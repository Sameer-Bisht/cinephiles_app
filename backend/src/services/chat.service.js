import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

const buildParticipantKey = (idA, idB) => {
  return [idA.toString(), idB.toString()].sort().join('_');
};

const formatConversationForUser = (conv, userId) => {
  const myId = userId.toString();
  const otherParticipant = conv.participants.find((p) => p._id.toString() !== myId) || null;
  const unreadMap = conv.unreadCounts instanceof Map
    ? Object.fromEntries(conv.unreadCounts)
    : conv.unreadCounts || {};

  return {
    _id: conv._id,
    status: conv.status,
    requestedBy: conv.requestedBy,
    otherParticipant,
    lastMessage: conv.lastMessage,
    myUnreadCount: unreadMap[myId] || 0,
    updatedAt: conv.updatedAt,
  };
};

export const getOrCreateConversation = async (userId, targetUsername) => {
  const target = await User.findOne({ username: targetUsername.toLowerCase() });
  if (!target) throw new ApiError(404, 'User not found');
  if (target._id.equals(userId)) {
    throw new ApiError(400, 'Cannot start a conversation with yourself');
  }

  const participantKey = buildParticipantKey(userId, target._id);
  let conv = await Conversation.findOne({ participantKey }).populate(
    'participants',
    'username displayName avatarUrl'
  );

  if (conv) {
    if (conv.status === 'declined') {
      throw new ApiError(403, 'Chat request was declined');
    }
    return formatConversationForUser(conv, userId);
  }

  // Check if mutual friends
  const [aFollowsB, bFollowsA] = await Promise.all([
    Follow.exists({ follower: userId, following: target._id }),
    Follow.exists({ follower: target._id, following: userId }),
  ]);
  const isMutual = Boolean(aFollowsB && bFollowsA);

  conv = await Conversation.create({
    participants: [userId, target._id],
    participantKey,
    status: isMutual ? 'accepted' : 'pending',
    requestedBy: isMutual ? null : userId,
    unreadCounts: {
      [userId.toString()]: 0,
      [target._id.toString()]: 0,
    },
  });

  if (!isMutual) {
    await createNotification({
      recipientId: target._id,
      actorId: userId,
      type: 'chat_request',
      entityId: conv._id,
    });
  }

  conv = await conv.populate('participants', 'username displayName avatarUrl');
  return formatConversationForUser(conv, userId);
};

export const getConversations = async (userId) => {
  const list = await Conversation.find({
    participants: userId,
    status: { $ne: 'declined' },
  })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username displayName avatarUrl')
    .lean();

  return list.map((c) => formatConversationForUser(c, userId));
};

export const respondToRequest = async (userId, conversationId, action) => {
  if (!['accept', 'decline'].includes(action)) {
    throw new ApiError(400, 'Invalid action');
  }

  const conv = await Conversation.findById(conversationId).populate(
    'participants',
    'username displayName avatarUrl'
  );
  if (!conv) throw new ApiError(404, 'Conversation not found');

  const isParticipant = conv.participants.some((p) => p._id.equals(userId));
  if (!isParticipant) throw new ApiError(403, 'Access denied');
  if (conv.status !== 'pending') throw new ApiError(400, 'Conversation is not pending');
  if (conv.requestedBy?.equals(userId)) {
    throw new ApiError(403, 'Only the recipient can respond to a chat request');
  }

  conv.status = action === 'accept' ? 'accepted' : 'declined';
  await conv.save();

  return formatConversationForUser(conv, userId);
};

export const getMessages = async (userId, conversationId, { cursor = null, limit = 30 } = {}) => {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new ApiError(404, 'Conversation not found');

  const isParticipant = conv.participants.some((p) => p.equals(userId));
  if (!isParticipant) throw new ApiError(403, 'Access denied');

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const query = { conversation: conversationId };
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }
  }

  const items = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit + 1)
    .populate('sender', 'username displayName avatarUrl')
    .lean();

  const hasMore = items.length > safeLimit;
  const sliced = hasMore ? items.slice(0, safeLimit) : items;
  const nextCursor = hasMore ? sliced[sliced.length - 1].createdAt.toISOString() : null;

  return {
    results: sliced.reverse(),
    nextCursor,
  };
};

export const markConversationRead = async (userId, conversationId) => {
  await Conversation.updateOne(
    { _id: conversationId, participants: userId },
    { $set: { [`unreadCounts.${userId.toString()}`]: 0 } }
  );
  return { read: true };
};

export const sendMessage = async (userId, conversationId, text) => {
  const trimmed = text?.trim();
  if (!trimmed) throw new ApiError(400, 'Message cannot be empty');
  if (trimmed.length > 2000) throw new ApiError(400, 'Message max 2000 characters');

  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new ApiError(404, 'Conversation not found');

  const isParticipant = conv.participants.some((p) => p.equals(userId));
  if (!isParticipant) throw new ApiError(403, 'Access denied');

  if (conv.status === 'declined') {
    throw new ApiError(403, 'Chat request was declined');
  }
  if (conv.status === 'pending' && !conv.requestedBy?.equals(userId)) {
    throw new ApiError(403, 'Accept the chat request before replying');
  }

  const otherUserId = conv.participants.find((p) => !p.equals(userId)).toString();

  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    text: trimmed,
    readBy: [userId],
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: {
          text: trimmed,
          sender: userId,
          sentAt: message.createdAt,
        },
        updatedAt: new Date(),
      },
      $inc: {
        [`unreadCounts.${otherUserId}`]: 1,
      },
    }
  );

  const populated = await message.populate('sender', 'username displayName avatarUrl');
  return { message: populated, otherUserId };
};

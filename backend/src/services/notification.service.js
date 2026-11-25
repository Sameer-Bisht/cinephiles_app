import { Notification } from '../models/Notification.js';
import { getIO } from '../sockets/index.js';

export const createNotification = async ({
  recipientId,
  actorId,
  type,
  entityId = null,
  meta = {},
}) => {
  if (!recipientId || !actorId || recipientId.toString() === actorId.toString()) {
    return null;
  }

  const notification = await Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    entityId,
    meta,
  });

  const populated = await notification.populate('actor', 'username displayName avatarUrl');

  const io = getIO();
  if (io) {
    io.to(`user:${recipientId.toString()}`).emit('notification:new', {
      notification: populated,
    });
  }

  return populated;
};

export const getMyNotifications = async (userId, page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [results, unreadCount, total] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('actor', 'username displayName avatarUrl')
      .lean(),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId }),
  ]);

  return {
    results,
    unreadCount,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
};

export const markNotificationsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
  return { unreadCount: 0 };
};

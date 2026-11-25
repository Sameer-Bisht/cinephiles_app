import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export const followUser = async (followerId, targetUsername) => {
  const target = await User.findOne({ username: targetUsername.toLowerCase() });
  if (!target) throw new ApiError(404, 'User not found');
  if (target._id.equals(followerId)) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const existing = await Follow.findOne({ follower: followerId, following: target._id });
  if (!existing) {
    await Follow.create({ follower: followerId, following: target._id });
    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(target._id, { $inc: { followersCount: 1 } }),
      createNotification({
        recipientId: target._id,
        actorId: followerId,
        type: 'follow',
      }),
    ]);
  }

  const followsBack = await Follow.exists({ follower: target._id, following: followerId });
  return { isFollowing: true, isMutual: Boolean(followsBack) };
};

export const unfollowUser = async (followerId, targetUsername) => {
  const target = await User.findOne({ username: targetUsername.toLowerCase() });
  if (!target) throw new ApiError(404, 'User not found');

  const result = await Follow.deleteOne({ follower: followerId, following: target._id });
  if (result.deletedCount === 1) {
    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(target._id, { $inc: { followersCount: -1 } }),
    ]);
  }

  return { isFollowing: false, isMutual: false };
};

export const getFollowers = async (username, page = 1, limit = 20) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [edges, total] = await Promise.all([
    Follow.find({ following: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('follower', 'username displayName avatarUrl bio')
      .lean(),
    Follow.countDocuments({ following: user._id }),
  ]);

  return {
    results: edges.map((e) => e.follower).filter(Boolean),
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const getFollowing = async (username, page = 1, limit = 20) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [edges, total] = await Promise.all([
    Follow.find({ follower: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('following', 'username displayName avatarUrl bio')
      .lean(),
    Follow.countDocuments({ follower: user._id }),
  ]);

  return {
    results: edges.map((e) => e.following).filter(Boolean),
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const getMutualFriends = async (userId) => {
  const followingEdges = await Follow.find({ follower: userId }).select('following').lean();
  const followingIds = followingEdges.map((e) => e.following);
  if (followingIds.length === 0) return [];

  const mutualEdges = await Follow.find({
    follower: { $in: followingIds },
    following: userId,
  })
    .populate('follower', 'username displayName avatarUrl bio')
    .lean();

  return mutualEdges.map((e) => e.follower).filter(Boolean);
};

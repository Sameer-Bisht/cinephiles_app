import { User } from '../models/User.js';
import { Follow } from '../models/Follow.js';
import { Review } from '../models/Review.js';
import { WatchlistItem } from '../models/WatchlistItem.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteCloudinaryAsset, uploadAvatarBuffer } from '../config/cloudinary.js';

export const searchUsers = async (query, limit = 15) => {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  return User.find({
    $or: [{ username: regex }, { displayName: regex }],
  })
    .limit(Math.min(limit, 30))
    .select('username displayName avatarUrl bio followersCount followingCount')
    .lean();
};

export const getUserProfile = async (username, viewerId) => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw new ApiError(404, 'User not found');

  const isSelf = user._id.equals(viewerId);
  const [reviewsCount, isFollowingDoc, followsMeDoc] = await Promise.all([
    Review.countDocuments({ user: user._id }),
    isSelf ? false : Follow.exists({ follower: viewerId, following: user._id }),
    isSelf ? false : Follow.exists({ follower: user._id, following: viewerId }),
  ]);

  const isFollowing = Boolean(isFollowingDoc);
  const followsMe = Boolean(followsMeDoc);

  return {
    user: user.toPublicJSON(),
    stats: {
      reviewsCount,
    },
    relationship: {
      isSelf,
      isFollowing,
      followsMe,
      isMutual: isFollowing && followsMe,
    },
  };
};

export const getUserReviews = async (username, page = 1, limit = 15) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [results, total] = await Promise.all([
    Review.find({ user: user._id })
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('movie', 'tmdbId title posterPath releaseYear')
      .populate('user', 'username displayName avatarUrl')
      .lean(),
    Review.countDocuments({ user: user._id }),
  ]);

  return {
    results,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const getUserWatchlist = async (username, page = 1, limit = 20) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WatchlistItem.find({ user: user._id })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('movie', 'tmdbId title posterPath releaseYear runtime')
      .lean(),
    WatchlistItem.countDocuments({ user: user._id }),
  ]);

  return {
    results: items.filter((i) => i.movie),
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const updateProfile = async (userId, { displayName, bio }) => {
  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) throw new ApiError(404, 'User not found');
  return user.toPublicJSON();
};

export const updateAvatar = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    throw new ApiError(400, 'Avatar image file is required');
  }

  const user = await User.findById(userId).select('+avatarPublicId');
  if (!user) throw new ApiError(404, 'User not found');

  const previousPublicId = user.avatarPublicId;
  const { url, publicId } = await uploadAvatarBuffer(fileBuffer);

  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save({ validateBeforeSave: false });

  if (previousPublicId) {
    await deleteCloudinaryAsset(previousPublicId);
  }

  return user.toPublicJSON();
};

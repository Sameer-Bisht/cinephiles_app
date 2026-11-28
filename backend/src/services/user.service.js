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

const WATCHLOG_RANKS = [
  { min: 60, key: 'couch_gremlin', title: 'Certified Couch Gremlin', subtitle: "Hasn't touched grass since the credits rolled" },
  { min: 30, key: 'cinema_menace', title: 'Cinema Menace', subtitle: 'Watches three films before breakfast' },
  { min: 15, key: 'film_nerd', title: 'Film Bro / Cinephile', subtitle: "Knows every director's favorite lens" },
  { min: 5, key: 'locked_in', title: 'Locked In', subtitle: 'No phones allowed during the runtime' },
  { min: 1, key: 'casual', title: 'Casual Viewer', subtitle: 'Weekend matinee enjoyer' },
  { min: 0, key: 'fresh_popcorn', title: 'Fresh Popcorn', subtitle: 'Just stepped into the theater' },
];

export const getWatchlogRank = (totalWatched) =>
  WATCHLOG_RANKS.find((r) => totalWatched >= r.min) || WATCHLOG_RANKS[WATCHLOG_RANKS.length - 1];

const buildWatchlogAchievements = ({ totalWatched, watchedLastMonth, seriesCount, writtenReviewsCount }) => {
  const list = [];
  if (totalWatched >= 1) list.push({ key: 'first_log', label: 'First Ticket', desc: 'Logged your first title' });
  if (totalWatched >= 10) list.push({ key: 'double_digits', label: 'Double Digits', desc: '10+ titles watched' });
  if (totalWatched >= 30) list.push({ key: 'marathoner', label: '30 Club', desc: '30+ titles in the watchlog' });
  if (watchedLastMonth >= 5) list.push({ key: 'monthly_binger', label: 'Monthly Binger', desc: '5+ watched in the last 30 days' });
  if (seriesCount >= 3) list.push({ key: 'series_survivor', label: 'Series Survivor', desc: '3+ TV series or anime logged' });
  if (writtenReviewsCount >= 5) list.push({ key: 'critic_era', label: 'Critic Era', desc: '5+ written reviews' });
  return list;
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
      totalWatched: reviewsCount,
      watchlogRank: getWatchlogRank(reviewsCount),
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
      .populate('movie', 'tmdbId mediaType title posterPath releaseYear isAnime')
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

export const getUserWatchlog = async (
  username,
  { period = 'all', sort = 'latest', page = 1, limit = 24 } = {}
) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  const now = Date.now();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);

  const filter = { user: user._id };
  if (period === 'month') {
    filter.watchedAt = { $gte: monthAgo };
  } else if (period === 'year') {
    filter.watchedAt = { $gte: yearAgo };
  }

  const safeLimit = Math.min(Math.max(limit, 1), 60);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;
  const sortOrder = sort === 'oldest' ? { watchedAt: 1 } : { watchedAt: -1 };

  const [items, filteredTotal, totalWatched, watchedLastMonth, watchedLastYear, allForBreakdown] =
    await Promise.all([
      Review.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(safeLimit)
        .populate('movie', 'tmdbId mediaType title posterPath releaseYear runtime isAnime')
        .lean(),
      Review.countDocuments(filter),
      Review.countDocuments({ user: user._id }),
      Review.countDocuments({ user: user._id, watchedAt: { $gte: monthAgo } }),
      Review.countDocuments({ user: user._id, watchedAt: { $gte: yearAgo } }),
      Review.find({ user: user._id })
        .select('content movie')
        .populate('movie', 'mediaType')
        .lean(),
    ]);

  let moviesCount = 0;
  let seriesCount = 0;
  let writtenReviewsCount = 0;
  for (const r of allForBreakdown) {
    if (r.movie?.mediaType === 'tv') seriesCount += 1;
    else moviesCount += 1;
    if (r.content && r.content.trim().length > 0) writtenReviewsCount += 1;
  }

  const rank = getWatchlogRank(totalWatched);
  const achievements = buildWatchlogAchievements({
    totalWatched,
    watchedLastMonth,
    seriesCount,
    writtenReviewsCount,
  });

  return {
    results: items.filter((i) => i.movie),
    page: safePage,
    totalPages: Math.ceil(filteredTotal / safeLimit) || 1,
    totalResults: filteredTotal,
    stats: {
      totalWatched,
      watchedLastMonth,
      watchedLastYear,
      moviesCount,
      seriesCount,
    },
    rank,
    achievements,
  };
};

export const getUserWatchlist = async (username, viewerId, page = 1, limit = 20) => {
  const user = await User.findOne({ username: username.toLowerCase() }).select('_id');
  if (!user) throw new ApiError(404, 'User not found');

  if (!user._id.equals(viewerId)) {
    throw new ApiError(403, 'Watchlist is private');
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WatchlistItem.find({ user: user._id })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('movie', 'tmdbId mediaType title posterPath releaseYear runtime isAnime')
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

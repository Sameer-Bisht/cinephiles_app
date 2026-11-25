import { Movie } from '../models/Movie.js';
import { Review } from '../models/Review.js';
import { ReviewLike } from '../models/ReviewLike.js';
import { Comment } from '../models/Comment.js';
import { WatchlistItem } from '../models/WatchlistItem.js';
import { Follow } from '../models/Follow.js';
import { ApiError } from '../utils/ApiError.js';
import { getOrCacheMovieByTmdbId } from './movie.service.js';
import { createNotification } from './notification.service.js';

const buildVerdictDelta = (previousVerdict, nextVerdict) => {
  const inc = {};
  if (previousVerdict === nextVerdict) return inc;

  if (previousVerdict) {
    inc[`verdictCounts.${previousVerdict}`] = -1;
    inc.totalVotes = (inc.totalVotes || 0) - 1;
  }
  if (nextVerdict) {
    inc[`verdictCounts.${nextVerdict}`] = (inc[`verdictCounts.${nextVerdict}`] || 0) + 1;
    inc.totalVotes = (inc.totalVotes || 0) + 1;
  }
  return inc;
};

export const upsertReview = async (userId, tmdbId, { verdict, content, containsSpoilers, watchedAt }) => {
  const { movie } = await getOrCacheMovieByTmdbId(tmdbId);
  const existing = await Review.findOne({ user: userId, movie: movie._id });

  const previousVerdict = existing?.verdict || null;
  const nextVerdict = verdict || null;
  const verdictInc = buildVerdictDelta(previousVerdict, nextVerdict);

  const review = await Review.findOneAndUpdate(
    { user: userId, movie: movie._id },
    {
      $set: {
        tmdbId: movie.tmdbId,
        verdict: nextVerdict,
        content: content || '',
        containsSpoilers: Boolean(containsSpoilers),
        ...(watchedAt ? { watchedAt } : {}),
      },
      $setOnInsert: {
        user: userId,
        movie: movie._id,
      },
    },
    { upsert: true, new: true, runValidators: true }
  ).populate('user', 'username displayName avatarUrl');

  let updatedMovie = movie;
  if (Object.keys(verdictInc).length > 0) {
    updatedMovie = await Movie.findByIdAndUpdate(
      movie._id,
      { $inc: verdictInc },
      { new: true }
    );
  }

  // Watching/logging a movie removes it from the Want-to-Watch list
  await WatchlistItem.deleteOne({ user: userId, movie: movie._id });

  return {
    review,
    verdictCounts: updatedMovie.verdictCounts,
    totalVotes: updatedMovie.totalVotes,
  };
};

export const deleteReview = async (userId, reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');
  if (!review.user.equals(userId)) {
    throw new ApiError(403, 'You can only delete your own review');
  }

  let updatedMovie = null;
  if (review.verdict) {
    updatedMovie = await Movie.findByIdAndUpdate(
      review.movie,
      {
        $inc: {
          [`verdictCounts.${review.verdict}`]: -1,
          totalVotes: -1,
        },
      },
      { new: true }
    );
  }

  await Promise.all([
    Review.deleteOne({ _id: review._id }),
    ReviewLike.deleteMany({ review: review._id }),
    Comment.deleteMany({ review: review._id }),
  ]);

  return {
    tmdbId: review.tmdbId,
    verdictCounts: updatedMovie?.verdictCounts || null,
    totalVotes: updatedMovie?.totalVotes ?? null,
  };
};

export const getMovieReviews = async (tmdbId, { sort = 'recent', page = 1, limit = 10, viewerId }) => {
  const numericId = Number(tmdbId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, 'Invalid TMDB movie ID');
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;
  const sortOrder = sort === 'likes' ? { likesCount: -1, createdAt: -1 } : { createdAt: -1 };

  const [reviews, total] = await Promise.all([
    Review.find({ tmdbId: numericId })
      .sort(sortOrder)
      .skip(skip)
      .limit(safeLimit)
      .populate('user', 'username displayName avatarUrl')
      .lean(),
    Review.countDocuments({ tmdbId: numericId }),
  ]);

  let likedSet = new Set();
  if (viewerId && reviews.length > 0) {
    const likes = await ReviewLike.find({
      user: viewerId,
      review: { $in: reviews.map((r) => r._id) },
    })
      .select('review')
      .lean();
    likedSet = new Set(likes.map((l) => l.review.toString()));
  }

  const enriched = reviews.map((r) => ({
    ...r,
    likedByMe: likedSet.has(r._id.toString()),
  }));

  return {
    results: enriched,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const toggleReviewLike = async (userId, reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  const existing = await ReviewLike.findOne({ user: userId, review: reviewId });
  if (existing) {
    await ReviewLike.deleteOne({ _id: existing._id });
    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likesCount: -1 } },
      { new: true }
    );
    return { liked: false, likesCount: Math.max(0, updated.likesCount) };
  }

  await ReviewLike.create({ user: userId, review: reviewId });
  const updated = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { likesCount: 1 } },
    { new: true }
  );
  await createNotification({
    recipientId: review.user,
    actorId: userId,
    type: 'review_like',
    entityId: review._id,
    meta: { tmdbId: review.tmdbId },
  });
  return { liked: true, likesCount: updated.likesCount };
};

export const getReviewComments = async (reviewId) => {
  const exists = await Review.exists({ _id: reviewId });
  if (!exists) throw new ApiError(404, 'Review not found');

  return Comment.find({ review: reviewId })
    .sort({ createdAt: 1 })
    .populate('author', 'username displayName avatarUrl')
    .lean();
};

export const addReviewComment = async (userId, reviewId, content) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  const comment = await Comment.create({
    review: reviewId,
    author: userId,
    content,
  });

  await Review.findByIdAndUpdate(reviewId, { $inc: { commentsCount: 1 } });
  await createNotification({
    recipientId: review.user,
    actorId: userId,
    type: 'review_comment',
    entityId: review._id,
    meta: { tmdbId: review.tmdbId },
  });

  return comment.populate('author', 'username displayName avatarUrl');
};

export const getFollowingFeed = async (userId, { cursor = null, limit = 15 } = {}) => {
  const safeLimit = Math.min(Math.max(limit, 1), 30);
  const followingEdges = await Follow.find({ follower: userId }).select('following').lean();
  const followingIds = followingEdges.map((e) => e.following);

  if (followingIds.length === 0) {
    return { results: [], nextCursor: null };
  }

  const query = { user: { $in: followingIds } };
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }
  }

  const items = await Review.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit + 1)
    .populate('user', 'username displayName avatarUrl')
    .populate('movie', 'tmdbId title posterPath releaseYear')
    .lean();

  const hasMore = items.length > safeLimit;
  const results = hasMore ? items.slice(0, safeLimit) : items;

  const likes = await ReviewLike.find({
    user: userId,
    review: { $in: results.map((r) => r._id) },
  })
    .select('review')
    .lean();
  const likedSet = new Set(likes.map((l) => l.review.toString()));

  const enriched = results.map((r) => ({
    ...r,
    likedByMe: likedSet.has(r._id.toString()),
  }));

  const nextCursor = hasMore ? results[results.length - 1].createdAt.toISOString() : null;
  return { results: enriched, nextCursor };
};

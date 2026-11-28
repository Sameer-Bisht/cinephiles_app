import { WatchlistItem } from '../models/WatchlistItem.js';
import { ApiError } from '../utils/ApiError.js';
import { getOrCacheMovieByTmdbId } from './movie.service.js';

export const getMyWatchlist = async (userId, page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    WatchlistItem.find({ user: userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('movie', 'tmdbId mediaType title posterPath releaseYear runtime isAnime')
      .lean(),
    WatchlistItem.countDocuments({ user: userId }),
  ]);

  return {
    results: items.filter((item) => item.movie),
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    totalResults: total,
  };
};

export const addToWatchlist = async (userId, tmdbId, mediaType = 'movie') => {
  const { movie } = await getOrCacheMovieByTmdbId(tmdbId, mediaType);

  const item = await WatchlistItem.findOneAndUpdate(
    { user: userId, movie: movie._id },
    {
      $setOnInsert: {
        user: userId,
        movie: movie._id,
        tmdbId: movie.tmdbId,
        mediaType: movie.mediaType || mediaType,
        addedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ).populate('movie', 'tmdbId mediaType title posterPath releaseYear runtime isAnime');

  return item;
};

export const removeFromWatchlist = async (userId, tmdbId, mediaType = 'movie') => {
  const numericId = Number(tmdbId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, 'Invalid TMDB ID');
  }

  await WatchlistItem.deleteOne({ user: userId, tmdbId: numericId, mediaType });
  return { tmdbId: numericId, mediaType, inWatchlist: false };
};

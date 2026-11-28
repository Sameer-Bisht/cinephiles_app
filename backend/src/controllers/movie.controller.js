import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as movieService from '../services/movie.service.js';
import { Review } from '../models/Review.js';
import { WatchlistItem } from '../models/WatchlistItem.js';

export const searchMovies = asyncHandler(async (req, res) => {
  const { q = '', page = 1, type = 'all' } = req.query;
  const data = await movieService.searchMovies(q, Number(page) || 1, type);
  return res.status(200).json(new ApiResponse(200, data, 'Movies fetched'));
});

export const getTrending = asyncHandler(async (req, res) => {
  const { page = 1, type = 'all' } = req.query;
  const data = await movieService.getTrendingMovies(Number(page) || 1, type);
  return res.status(200).json(new ApiResponse(200, data, 'Trending movies fetched'));
});

export const getMovieDetail = asyncHandler(async (req, res) => {
  const mediaType = req.params.mediaType || req.query.type || 'movie';
  const { movie, source } = await movieService.getOrCacheMovieByTmdbId(
    req.params.tmdbId,
    mediaType
  );

  let viewerState = null;
  if (req.user) {
    const [inWatchlistDoc, myReview] = await Promise.all([
      WatchlistItem.exists({ user: req.user._id, movie: movie._id }),
      Review.findOne({ user: req.user._id, movie: movie._id }).lean(),
    ]);
    viewerState = {
      inWatchlist: Boolean(inWatchlistDoc),
      myReview: myReview || null,
    };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { movie, source, viewerState }, 'Movie details fetched'));
});

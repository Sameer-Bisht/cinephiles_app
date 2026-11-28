import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as watchlistService from '../services/watchlist.service.js';

export const getMyWatchlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await watchlistService.getMyWatchlist(
    req.user._id,
    Number(page) || 1,
    Number(limit) || 20
  );
  return res.status(200).json(new ApiResponse(200, data, 'Watchlist fetched'));
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  const mediaType = req.query.type || req.body?.mediaType || 'movie';
  const item = await watchlistService.addToWatchlist(req.user._id, req.params.tmdbId, mediaType);
  return res.status(201).json(new ApiResponse(201, { item }, 'Added to watchlist'));
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const mediaType = req.query.type || 'movie';
  const data = await watchlistService.removeFromWatchlist(req.user._id, req.params.tmdbId, mediaType);
  return res.status(200).json(new ApiResponse(200, data, 'Removed from watchlist'));
});

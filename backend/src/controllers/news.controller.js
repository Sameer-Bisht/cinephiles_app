import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as newsService from '../services/news.service.js';

export const getNews = asyncHandler(async (req, res) => {
  const { source = 'all', limit = 30 } = req.query;
  const data = await newsService.getLatestMovieNews({ source, limit });
  return res.status(200).json(new ApiResponse(200, data, 'Movie news fetched'));
});

export const getForYouNews = asyncHandler(async (req, res) => {
  const data = await newsService.getForYouNews(req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Personalized news fetched'));
});

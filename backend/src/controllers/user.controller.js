import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export const searchUsers = asyncHandler(async (req, res) => {
  const users = await userService.searchUsers(req.query.q);
  return res.status(200).json(new ApiResponse(200, { users }, 'Users fetched'));
});

export const getProfile = asyncHandler(async (req, res) => {
  const data = await userService.getUserProfile(req.params.username, req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Profile fetched'));
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const data = await userService.getUserReviews(
    req.params.username,
    Number(page) || 1,
    Number(limit) || 15
  );
  return res.status(200).json(new ApiResponse(200, data, 'User reviews fetched'));
});

export const getUserWatchlog = asyncHandler(async (req, res) => {
  const { period = 'all', sort = 'latest', page = 1, limit = 24 } = req.query;
  const data = await userService.getUserWatchlog(req.params.username, {
    period,
    sort,
    page: Number(page) || 1,
    limit: Number(limit) || 24,
  });
  return res.status(200).json(new ApiResponse(200, data, 'User watchlog fetched'));
});

export const getUserWatchlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await userService.getUserWatchlist(
    req.params.username,
    req.user._id,
    Number(page) || 1,
    Number(limit) || 20
  );
  return res.status(200).json(new ApiResponse(200, data, 'User watchlist fetched'));
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated successfully'));
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file?.buffer);
  return res.status(200).json(new ApiResponse(200, { user }, 'Avatar updated successfully'));
});

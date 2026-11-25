import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as followService from '../services/follow.service.js';

export const follow = asyncHandler(async (req, res) => {
  const result = await followService.followUser(req.user._id, req.params.username);
  return res.status(200).json(new ApiResponse(200, result, 'User followed'));
});

export const unfollow = asyncHandler(async (req, res) => {
  const result = await followService.unfollowUser(req.user._id, req.params.username);
  return res.status(200).json(new ApiResponse(200, result, 'User unfollowed'));
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await followService.getFollowers(
    req.params.username,
    Number(page) || 1,
    Number(limit) || 20
  );
  return res.status(200).json(new ApiResponse(200, data, 'Followers fetched'));
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await followService.getFollowing(
    req.params.username,
    Number(page) || 1,
    Number(limit) || 20
  );
  return res.status(200).json(new ApiResponse(200, data, 'Following fetched'));
});

export const getFriends = asyncHandler(async (req, res) => {
  const friends = await followService.getMutualFriends(req.user._id);
  return res.status(200).json(new ApiResponse(200, { friends }, 'Friends fetched'));
});

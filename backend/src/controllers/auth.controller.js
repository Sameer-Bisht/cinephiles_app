import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  res.cookie('refreshToken', refreshToken, authService.refreshCookieOptions);
  return res
    .status(201)
    .json(new ApiResponse(201, { user, accessToken, refreshToken }, 'Account created successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  res.cookie('refreshToken', refreshToken, authService.refreshCookieOptions);
  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, 'Logged in successfully'));
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, accessToken, refreshToken } = await authService.refreshSession(incomingToken);
  res.cookie('refreshToken', refreshToken, authService.refreshCookieOptions);
  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, 'Session refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logoutUser(req.user?._id, incomingToken);
  res.clearCookie('refreshToken', {
    ...authService.refreshCookieOptions,
    maxAge: undefined,
  });
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user.toPublicJSON() }, 'Current user fetched'));
});

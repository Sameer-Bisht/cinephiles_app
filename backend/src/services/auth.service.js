import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId.toString() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId.toString() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const issueSessionTokens = async (user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = async ({ username, email, password, displayName }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const conflictField = existing.email === email ? 'Email' : 'Username';
    throw new ApiError(409, `${conflictField} is already taken`);
  }

  const user = await User.create({
    username,
    email,
    passwordHash: password,
    displayName: displayName || username,
  });

  const { accessToken, refreshToken } = await issueSessionTokens(user);
  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

export const loginUser = async ({ identifier, password }) => {
  const normalized = identifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select('+passwordHash');

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await issueSessionTokens(user);
  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

export const refreshSession = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || user.refreshTokenHash !== hashToken(incomingRefreshToken)) {
    throw new ApiError(401, 'Refresh token revoked');
  }

  const { accessToken, refreshToken } = await issueSessionTokens(user);
  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { $set: { refreshTokenHash: null } });
};

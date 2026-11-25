import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as reviewService from '../services/review.service.js';

export const upsertMovieReview = asyncHandler(async (req, res) => {
  const result = await reviewService.upsertReview(req.user._id, req.params.tmdbId, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Review saved'));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.user._id, req.params.reviewId);
  return res.status(200).json(new ApiResponse(200, result, 'Review deleted'));
});

export const getMovieReviews = asyncHandler(async (req, res) => {
  const { sort = 'recent', page = 1, limit = 10 } = req.query;
  const result = await reviewService.getMovieReviews(req.params.tmdbId, {
    sort,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    viewerId: req.user._id,
  });
  return res.status(200).json(new ApiResponse(200, result, 'Movie reviews fetched'));
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await reviewService.toggleReviewLike(req.user._id, req.params.reviewId);
  return res.status(200).json(new ApiResponse(200, result, 'Like toggled'));
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await reviewService.getReviewComments(req.params.reviewId);
  return res.status(200).json(new ApiResponse(200, { comments }, 'Comments fetched'));
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await reviewService.addReviewComment(
    req.user._id,
    req.params.reviewId,
    req.body.content
  );
  return res.status(201).json(new ApiResponse(201, { comment }, 'Comment added'));
});

export const getFeed = asyncHandler(async (req, res) => {
  const { cursor, limit = 15 } = req.query;
  const data = await reviewService.getFollowingFeed(req.user._id, {
    cursor,
    limit: Number(limit) || 15,
  });
  return res.status(200).json(new ApiResponse(200, data, 'Activity feed fetched'));
});

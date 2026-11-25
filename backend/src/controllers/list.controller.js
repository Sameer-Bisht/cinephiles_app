import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as listService from '../services/list.service.js';

export const createList = asyncHandler(async (req, res) => {
  const list = await listService.createList(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { list }, 'List created'));
});

export const getMyLists = asyncHandler(async (req, res) => {
  const lists = await listService.getMyLists(req.user._id, req.query.tmdbId);
  return res.status(200).json(new ApiResponse(200, { lists }, 'Lists fetched'));
});

export const getUserLists = asyncHandler(async (req, res) => {
  const lists = await listService.getUserLists(req.params.username, req.user._id);
  return res.status(200).json(new ApiResponse(200, { lists }, 'User lists fetched'));
});

export const getListDetail = asyncHandler(async (req, res) => {
  const { page = 1, limit = 24 } = req.query;
  const data = await listService.getListDetail(
    req.params.listId,
    req.user._id,
    Number(page) || 1,
    Number(limit) || 24
  );
  return res.status(200).json(new ApiResponse(200, data, 'List details fetched'));
});

export const updateList = asyncHandler(async (req, res) => {
  const list = await listService.updateList(req.user._id, req.params.listId, req.body);
  return res.status(200).json(new ApiResponse(200, { list }, 'List updated'));
});

export const deleteList = asyncHandler(async (req, res) => {
  const data = await listService.deleteList(req.user._id, req.params.listId);
  return res.status(200).json(new ApiResponse(200, data, 'List deleted'));
});

export const addItem = asyncHandler(async (req, res) => {
  const item = await listService.addMovieToList(req.user._id, req.params.listId, req.body);
  return res.status(201).json(new ApiResponse(201, { item }, 'Movie added to list'));
});

export const removeItem = asyncHandler(async (req, res) => {
  const data = await listService.removeMovieFromList(
    req.user._id,
    req.params.listId,
    req.params.tmdbId
  );
  return res.status(200).json(new ApiResponse(200, data, 'Movie removed from list'));
});

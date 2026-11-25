import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await notificationService.getMyNotifications(
    req.user._id,
    Number(page) || 1,
    Number(limit) || 20
  );
  return res.status(200).json(new ApiResponse(200, data, 'Notifications fetched'));
});

export const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markNotificationsRead(req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Notifications marked as read'));
});

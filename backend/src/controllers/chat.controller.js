import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as chatService from '../services/chat.service.js';

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user._id);
  return res.status(200).json(new ApiResponse(200, { conversations }, 'Conversations fetched'));
});

export const startConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getOrCreateConversation(
    req.user._id,
    req.body.username
  );
  return res.status(200).json(new ApiResponse(200, { conversation }, 'Conversation ready'));
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const conversation = await chatService.respondToRequest(
    req.user._id,
    req.params.conversationId,
    req.body.action
  );
  return res.status(200).json(new ApiResponse(200, { conversation }, 'Request updated'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { cursor, limit = 30 } = req.query;
  const data = await chatService.getMessages(req.user._id, req.params.conversationId, {
    cursor,
    limit: Number(limit) || 30,
  });
  return res.status(200).json(new ApiResponse(200, data, 'Messages fetched'));
});

export const markRead = asyncHandler(async (req, res) => {
  const data = await chatService.markConversationRead(req.user._id, req.params.conversationId);
  return res.status(200).json(new ApiResponse(200, data, 'Conversation marked as read'));
});

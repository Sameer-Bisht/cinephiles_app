import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import * as chatService from '../services/chat.service.js';
import { corsOrigin } from '../config/cors.js';
let ioInstance = null;

export const getIO = () => ioInstance;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.sub).select('username displayName avatarUrl');
      if (!user) {
        return next(new Error('Invalid token'));
      }
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    socket.on('chat:join', async ({ conversationId }) => {
      try {
        const isParticipant = await Conversation.exists({
          _id: conversationId,
          participants: socket.user._id,
        });
        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch {
        // Ignore invalid conversationId
      }
    });

    socket.on('chat:send', async ({ conversationId, text }, callback) => {
      try {
        const { message, otherUserId } = await chatService.sendMessage(
          socket.user._id,
          conversationId,
          text
        );

        ioInstance.to(`conversation:${conversationId}`).emit('chat:message', {
          conversationId,
          message,
        });

        ioInstance.to(`user:${otherUserId}`).emit('chat:inbox_update', {
          conversationId,
          message,
        });

        if (typeof callback === 'function') {
          callback({ ok: true, message });
        }
      } catch (error) {
        if (typeof callback === 'function') {
          callback({ ok: false, error: error.message || 'Failed to send message' });
        }
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('chat:read', async ({ conversationId }) => {
      try {
        await chatService.markConversationRead(socket.user._id, conversationId);
        socket.to(`conversation:${conversationId}`).emit('chat:read_receipt', {
          conversationId,
          userId,
        });
      } catch {
        // Ignore
      }
    });
  });

  return ioInstance;
};

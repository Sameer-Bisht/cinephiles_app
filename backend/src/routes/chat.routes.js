import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.startConversation);
router.patch('/conversations/:conversationId/respond', chatController.respondToRequest);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.patch('/conversations/:conversationId/read', chatController.markRead);

export default router;

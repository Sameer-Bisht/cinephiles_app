import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAllRead);

export default router;

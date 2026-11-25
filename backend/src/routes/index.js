import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import movieRoutes from './movie.routes.js';
import reviewRoutes from './review.routes.js';
import watchlistRoutes from './watchlist.routes.js';
import listRoutes from './list.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Cinephiles API is healthy' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/movies', movieRoutes);
router.use('/reviews', reviewRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/lists', listRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);

export default router;

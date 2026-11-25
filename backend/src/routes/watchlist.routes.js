import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', watchlistController.getMyWatchlist);
router.post('/:tmdbId', watchlistController.addToWatchlist);
router.delete('/:tmdbId', watchlistController.removeFromWatchlist);

export default router;

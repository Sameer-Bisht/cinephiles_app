import { Router } from 'express';
import * as movieController from '../controllers/movie.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/trending', movieController.getTrending);
router.get('/search', movieController.searchMovies);
router.get('/:tmdbId', optionalAuth, movieController.getMovieDetail);

export default router;

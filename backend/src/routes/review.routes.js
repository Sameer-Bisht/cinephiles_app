import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import { createCommentSchema, upsertReviewSchema } from '../validations/review.validation.js';

const router = Router();

// All review and comment endpoints are behind the auth wall
router.use(verifyJWT);

router.get('/feed', reviewController.getFeed);
router.get('/movies/:tmdbId', reviewController.getMovieReviews);
router.put('/movies/:tmdbId', validate(upsertReviewSchema), reviewController.upsertMovieReview);

router.delete('/:reviewId', reviewController.deleteReview);
router.post('/:reviewId/like', reviewController.toggleLike);
router.get('/:reviewId/comments', reviewController.getComments);
router.post('/:reviewId/comments', validate(createCommentSchema), reviewController.addComment);

export default router;

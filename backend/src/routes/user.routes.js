import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as followController from '../controllers/follow.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validate.js';
import { updateProfileSchema } from '../validations/auth.validation.js';

const router = Router();

// Profiles and social graph are behind the auth wall
router.use(verifyJWT);

router.get('/search', userController.searchUsers);
router.get('/me/friends', followController.getFriends);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.patch('/me/avatar', uploadAvatar.single('avatar'), userController.uploadMyAvatar);

router.get('/:username', userController.getProfile);
router.get('/:username/reviews', userController.getUserReviews);
router.get('/:username/watchlist', userController.getUserWatchlist);

router.post('/:username/follow', followController.follow);
router.delete('/:username/follow', followController.unfollow);
router.get('/:username/followers', followController.getFollowers);
router.get('/:username/following', followController.getFollowing);

export default router;

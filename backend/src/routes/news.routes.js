import { Router } from 'express';
import * as newsController from '../controllers/news.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', newsController.getNews);
router.get('/for-you', verifyJWT, newsController.getForYouNews);

export default router;

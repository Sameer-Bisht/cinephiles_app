import { Router } from 'express';
import * as listController from '../controllers/list.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.js';
import {
  addListItemSchema,
  createListSchema,
  updateListSchema,
} from '../validations/list.validation.js';

const router = Router();

router.use(verifyJWT);

router.get('/', listController.getMyLists);
router.post('/', validate(createListSchema), listController.createList);
router.get('/user/:username', listController.getUserLists);

router.get('/:listId', listController.getListDetail);
router.patch('/:listId', validate(updateListSchema), listController.updateList);
router.delete('/:listId', listController.deleteList);

router.post('/:listId/items', validate(addListItemSchema), listController.addItem);
router.delete('/:listId/items/:tmdbId', listController.removeItem);

export default router;

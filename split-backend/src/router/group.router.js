import { Router } from 'express';
import { createGroup, listMyGroups } from '../controller/group.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const groupRouter = Router();

groupRouter.use(requireAuth);
groupRouter.post('/', createGroup);
groupRouter.get('/me', listMyGroups);

export default groupRouter;

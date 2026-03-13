import { Router } from 'express';
import { getActivity } from '../controller/activity.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const activityRouter = Router();

activityRouter.use(requireAuth);
activityRouter.get('/', getActivity);

export default activityRouter;

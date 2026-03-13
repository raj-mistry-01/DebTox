import { Router } from 'express';
import {
  createGroup,
  listMyGroups,
  getGroupDetails,
  getGroupExpenses,
  getGroupMembers,
} from '../controller/group.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const groupRouter = Router();

groupRouter.use(requireAuth);
groupRouter.post('/', createGroup);
groupRouter.get('/', listMyGroups);
groupRouter.get('/:groupId', getGroupDetails);
groupRouter.get('/:groupId/expenses', getGroupExpenses);
groupRouter.get('/:groupId/members', getGroupMembers);

export default groupRouter;

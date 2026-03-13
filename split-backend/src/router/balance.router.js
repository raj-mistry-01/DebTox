import { Router } from 'express';
import { getFriends, getFriend, settlePayment } from '../controller/balance.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const balanceRouter = Router();

balanceRouter.use(requireAuth);
balanceRouter.get('/', getFriends);
balanceRouter.get('/:friendId', getFriend);
balanceRouter.post('/:friendId/settle', settlePayment);

export default balanceRouter;

import { Router } from 'express';
import authRouter from './auth.router.js';
import groupRouter from './group.router.js';
import expenseRouter from './expense.router.js';
import balanceRouter from './balance.router.js';
import activityRouter from './activity.router.js';
import friendRouter from './friend.router.js';
import notificationRouter from './notification.router.js';
import uropayRouter from './uropay.router.js';
import debtRouter from './debt.router.js';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/groups', groupRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/balances', balanceRouter);
apiRouter.use('/friends', friendRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/activity', activityRouter);
apiRouter.use('/payments', uropayRouter);
apiRouter.use('/debts', debtRouter);

export default apiRouter;

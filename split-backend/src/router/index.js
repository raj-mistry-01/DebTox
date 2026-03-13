import { Router } from 'express';
import authRouter from './auth.router.js';
import groupRouter from './group.router.js';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/groups', groupRouter);

export default apiRouter;

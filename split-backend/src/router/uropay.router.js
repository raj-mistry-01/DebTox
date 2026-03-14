import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { generateOrder, checkPaymentStatus, finalizePayment, recordCashPayment } from '../controller/uropay.controller.js';

const uropayRouter = Router();

uropayRouter.post('/create-order', generateOrder);
uropayRouter.post('/check-status/:orderId', requireAuth, checkPaymentStatus);
uropayRouter.post('/finalize', requireAuth, finalizePayment);
uropayRouter.post('/record-cash', requireAuth, recordCashPayment);

export default uropayRouter;

import { Router } from 'express';
import { generateOrder } from '../controller/uropay.controller.js';

const uropayRouter = Router();

uropayRouter.post('/create-order', generateOrder);

export default uropayRouter;

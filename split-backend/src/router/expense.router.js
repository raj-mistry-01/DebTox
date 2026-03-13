import { Router } from 'express';
import { createExpense, getExpense, deleteExpense } from '../controller/expense.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const expenseRouter = Router();

expenseRouter.use(requireAuth);
expenseRouter.post('/', createExpense);
expenseRouter.get('/:expenseId', getExpense);
expenseRouter.delete('/:expenseId', deleteExpense);

export default expenseRouter;

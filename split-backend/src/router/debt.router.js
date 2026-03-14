/**
 * Debt Settlement Routes
 * Endpoints for debt simplification and settlement operations
 */

import { Router } from 'express';
import {
  getSimplifiedDebts,
  markSettlementAsPaid,
  compareDebts,
  invalidateCache,
} from '../controller/debt.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const debtRouter = Router();

// All routes require authentication
debtRouter.use(requireAuth);

/**
 * Get minimized settlement plan for a group
 * GET /api/debts/:groupId/simplified?forceRecalculate=false
 */
debtRouter.get('/:groupId/simplified', getSimplifiedDebts);

/**
 * Compare original vs simplified debts
 * GET /api/debts/:groupId/comparison
 */
debtRouter.get('/:groupId/comparison', compareDebts);

/**
 * Mark a settlement transaction as paid
 * POST /api/debts/:groupId/settlement/:settlementId/mark-paid
 */
debtRouter.post('/:groupId/settlement/:settlementId/mark-paid', markSettlementAsPaid);

/**
 * Invalidate simplified debts cache
 * DELETE /api/debts/:groupId/cache
 */
debtRouter.delete('/:groupId/cache', invalidateCache);

export default debtRouter;

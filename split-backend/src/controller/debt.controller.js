/**
 * Debt Controller
 * Handles API endpoints for debt simplification and settlement
 */

import DebtSimplificationService from '../services/debtSimplification.service.js';
import { Group, GroupMember, OptimizedTransaction, User } from '../model/index.js';

/**
 * GET /api/debts/:groupId/simplified
 * Get minimized settlement plan for a group
 */
export async function getSimplifiedDebts(req, res) {
  try {
    const { groupId } = req.params;
    const { forceRecalculate = false } = req.query;

    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is member of group
    const membership = await GroupMember.findOne({
      where: { groupId, userId: req.user.sub },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Check cache (skip if forceRecalculate)
    if (!forceRecalculate) {
      const cached = await OptimizedTransaction.findAll({
        where: { groupId },
        include: [
          { model: User, as: 'debtor', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'creditor', attributes: ['id', 'name', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });

      if (cached.length > 0) {
        // Check if cache has expired
        const oldestCache = cached[cached.length - 1];
        if (oldestCache.expiresAt && new Date() < new Date(oldestCache.expiresAt)) {
          const formatted = cached.map((t) => ({
            from: t.debtor,
            to: t.creditor,
            amount: parseFloat(t.netAmount),
            settled: t.isSettled,
            id: t.id,
          }));

          return res.status(200).json({
            simplifiedDebts: formatted,
            totalTransactions: formatted.length,
            source: 'cache',
            calculatedAt: cached[0].createdAt,
          });
        }
      }
    }

    // Calculate fresh simplified debts
    const result = await DebtSimplificationService.simplifyGroupDebts(groupId);

    // Store optimized transactions in database (cache)
    if (result.simplifiedDebts.length > 0) {
      // Clear old records
      await OptimizedTransaction.destroy({ where: { groupId } });

      // Store new simplified debts
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      for (const settlement of result.simplifiedDebts) {
        await OptimizedTransaction.create({
          groupId,
          fromUserId: settlement.from.id,
          toUserId: settlement.to.id,
          amount: settlement.amount,
          expiresAt,
        });
      }
    }

    return res.status(200).json({
      simplifiedDebts: result.simplifiedDebts,
      totalTransactions: result.totalTransactions,
      originalTransactions: result.originalTransactions,
      savingsPercentage: result.savings,
      source: 'calculated',
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting simplified debts:', error);
    return res.status(500).json({
      message: 'Failed to get simplified debts',
      error: error.message,
    });
  }
}

/**
 * POST /api/debts/:groupId/settlement/:settlementId/mark-paid
 * Mark a simplified settlement as paid
 */
export async function markSettlementAsPaid(req, res) {
  try {
    const { groupId, settlementId } = req.params;
    const { paymentMethod = 'manual', transactionId = null } = req.body;

    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is member
    const membership = await GroupMember.findOne({
      where: { groupId, userId: req.user.sub },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Find settlement
    const settlement = await OptimizedTransaction.findByPk(settlementId);
    if (!settlement || settlement.groupId !== parseInt(groupId)) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Verify user is the debtor (the one paying)
    if (settlement.fromUserId !== req.user.sub) {
      return res.status(403).json({ message: 'Only the debtor can mark as paid' });
    }

    // Mark as settled
    settlement.isSettled = true;
    await settlement.save();

    // Optional: Log the payment
    if (paymentMethod !== 'manual') {
      console.log(`Payment recorded: ${paymentMethod} - Transaction: ${transactionId}`);
    }

    return res.status(200).json({
      message: 'Settlement marked as paid',
      settlement,
    });
  } catch (error) {
    console.error('Error marking settlement as paid:', error);
    return res.status(500).json({
      message: 'Failed to mark settlement as paid',
      error: error.message,
    });
  }
}

/**
 * GET /api/debts/:groupId/comparison
 * Compare original and simplified debts
 */
export async function compareDebts(req, res) {
  try {
    const { groupId } = req.params;

    // Verify group exists and user is member
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = await GroupMember.findOne({
      where: { groupId, userId: req.user.sub },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Get simplified debts
    const simplified = await DebtSimplificationService.simplifyGroupDebts(groupId);

    // Get original debts from Balance table
    const original = await DebtSimplificationService.getCurrentBalances(groupId);

    return res.status(200).json({
      simplified: simplified.simplifiedDebts,
      original,
      stats: {
        originalCount: original.length,
        simplifiedCount: simplified.totalTransactions,
        reduction: `${simplified.savings}%`,
      },
    });
  } catch (error) {
    console.error('Error comparing debts:', error);
    return res.status(500).json({
      message: 'Failed to compare debts',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/debts/:groupId/cache
 * Manually invalidate cache for a group
 */
export async function invalidateCache(req, res) {
  try {
    const { groupId } = req.params;

    // Verify group exists and user is owner
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy !== req.user.sub) {
      return res.status(403).json({ message: 'Only group creator can invalidate cache' });
    }

    // Delete cached simplified debts
    const deleted = await OptimizedTransaction.destroy({ where: { groupId } });

    return res.status(200).json({
      message: 'Cache invalidated',
      deletedRecords: deleted,
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return res.status(500).json({
      message: 'Failed to invalidate cache',
      error: error.message,
    });
  }
}

export default {
  getSimplifiedDebts,
  markSettlementAsPaid,
  compareDebts,
  invalidateCache,
};

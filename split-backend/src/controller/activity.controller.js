import { Expense, ExpenseShare, Payment, Group, User, GroupMember } from '../model/index.js';
import { Op } from 'sequelize';

async function getActivity(req, res) {
  try {
    const userId = req.user.sub;
    console.log('[ACTIVITY] Fetching activity for user:', userId);

    // Step 1: Get all user's groups
    const memberships = await GroupMember.findAll({
      where: { userId },
      attributes: ['groupId'],
      raw: true,
    });
    const groupIds = memberships.map((m) => m.groupId);
    console.log('[ACTIVITY] User groups:', groupIds);

    // Step 2: Get ALL expenses (both group and friend)
    const allExpenses = await Expense.findAll({
      include: [
        { model: Group, required: false },
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    console.log('[ACTIVITY] Total expenses in DB:', allExpenses.length);

    // Step 3: Filter to only user's expenses
    const filteredExpenses = allExpenses.filter((e) => {
      // Include if it's a group expense in one of user's groups
      if (e.groupId && groupIds.includes(e.groupId)) return true;

      // Include friend expenses where user is payer
      if (!e.groupId && e.paidByUserId === userId) return true;

      // Include friend expenses where user is a sharer
      if (!e.groupId && e.shares?.some((s) => s.userId === userId)) return true;

      return false;
    });
    console.log('[ACTIVITY] Filtered expenses:', filteredExpenses.length);

    // Step 4: Get ALL payments
    const allPayments = await Payment.findAll({
      include: [
        { model: Group, required: false },
        { model: User, as: 'payer' },
        { model: User, as: 'payee' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    console.log('[ACTIVITY] Total payments in DB:', allPayments.length);

    // Step 5: Filter to only user's payments
    const filteredPayments = allPayments.filter((p) => {
      // Include if it's a group payment in one of user's groups
      if (p.groupId && groupIds.includes(p.groupId)) return true;

      // Include friend payments where user is payer
      if (!p.groupId && p.paidByUserId === userId) return true;

      // Include friend payments where user is payee
      if (!p.groupId && p.payeeId === userId) return true;

      return false;
    });
    console.log('[ACTIVITY] Filtered payments:', filteredPayments.length);

    // Step 6: Format activities
    const activities = [];

    // Add expenses
    filteredExpenses.forEach((e) => {
      if (!e.payer) {
        console.warn('[ACTIVITY] Expense missing payer:', e.id);
        return;
      }

      const involvedUsers = [
        e.payer,
        ...(e.shares || []).map((s) => s.user).filter((u) => u && u.id !== e.payer?.id),
      ];

      activities.push({
        id: `expense-${e.id}`,
        type: 'expense',
        description: `${e.payer.name} paid for ${e.title}`,
        amount: parseFloat(e.amount),
        date: e.createdAt.toISOString(),
        groupName: e.group?.name || 'Friend Payment',
        involvedUsers: involvedUsers.filter((u) => u),
      });
    });

    // Add payments
    filteredPayments.forEach((p) => {
      if (!p.payer || !p.payee) {
        console.warn('[ACTIVITY] Payment missing payer/payee:', { id: p.id, payerId: p.paidByUserId, payeeId: p.payeeId });
        return;
      }

      activities.push({
        id: `payment-${p.id}`,
        type: 'payment',
        description: `${p.payer.name} paid ${p.payee.name}`,
        amount: parseFloat(p.amount),
        date: p.createdAt.toISOString(),
        groupName: p.group?.name || 'Friend Payment',
        involvedUsers: [p.payer, p.payee],
      });
    });

    // Step 7: Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('[ACTIVITY] Total activities to return:', Math.min(activities.length, 50));

    return res.status(200).json({ activities: activities.slice(0, 50) });
  } catch (error) {
    console.error('[ACTIVITY] ERROR:', error.message);
    console.error('[ACTIVITY] Stack:', error.stack);
    return res.status(500).json({ 
      message: 'Failed to fetch activity', 
      error: error.message 
    });
  }
}

export { getActivity };

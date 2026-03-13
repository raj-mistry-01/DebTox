import { Expense, ExpenseShare, Payment, Group, User, GroupMember } from '../model/index.js';
import { Op } from 'sequelize';

async function getActivity(req, res) {
  try {
    const userId = req.user.sub;

    // Get all user's groups
    const memberships = await GroupMember.findAll({
      where: { userId },
      attributes: ['groupId'],
      raw: true,
    });

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return res.status(200).json({ activities: [] });
    }

    // Get expenses from user's groups
    const expenses = await Expense.findAll({
      where: { groupId: { [Op.in]: groupIds } },
      include: [
        { model: Group },
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Get payments from user's groups
    const payments = await Payment.findAll({
      where: { groupId: { [Op.in]: groupIds } },
      include: [
        { model: Group },
        { model: User, as: 'payer' },
        { model: User, as: 'payee' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // Format activities
    const activities = [];

    expenses.forEach((e) => {
      const involvedUsers = [
        e.payer,
        ...e.shares.map((s) => s.user).filter((u) => u.id !== e.payer.id),
      ];

      activities.push({
        id: `expense-${e.id}`,
        type: 'expense',
        description: `${e.payer.name} paid for ${e.title}`,
        amount: parseFloat(e.amount),
        date: e.createdAt.toISOString(),
        groupName: e.group.name,
        involvedUsers,
      });
    });

    payments.forEach((p) => {
      activities.push({
        id: `payment-${p.id}`,
        type: 'payment',
        description: `${p.payer.name} paid ${p.payee.name}`,
        amount: parseFloat(p.amount),
        date: p.createdAt.toISOString(),
        groupName: p.group.name,
        involvedUsers: [p.payer, p.payee],
      });
    });

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ activities: activities.slice(0, 50) });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch activity', error: error.message });
  }
}

export { getActivity };

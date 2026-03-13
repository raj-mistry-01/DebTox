import { Expense, ExpenseShare, Group, GroupMember, Balance, User, OptimizedTransaction } from '../model/index.js';
import sequelize from '../db/sequelize.js';

async function createExpense(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const {
      groupId,
      title,
      amount,
      currency = 'INR',
      category = 'OTHER',
      splitMethod = 'equal',
      splits, // [{ userId, shareAmount }]
    } = req.body;

    // Validate required fields - groupId is optional (null for friend expenses)
    if (!title || !amount || !splits) {
      return res.status(400).json({
        message: 'title, amount, and splits are required',
      });
    }

    // Verify user is member of group (only for group expenses)
    if (groupId) {
      const membership = await GroupMember.findOne(
        { where: { groupId, userId: req.user.sub } },
        { transaction }
      );

      if (!membership) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Not a member of this group' });
      }
    }

    const expense = await Expense.create(
      {
        groupId,
        paidByUserId: req.user.sub,
        title,
        amount: parseFloat(amount),
        currency,
        category,
        splitMethod,
      },
      { transaction }
    );

    // Create expense shares
    const sharePromises = splits.map((split) =>
      ExpenseShare.create(
        {
          expenseId: expense.id,
          userId: split.userId,
          shareAmount: parseFloat(split.shareAmount),
        },
        { transaction }
      )
    );

    await Promise.all(sharePromises);

    // Update balances - round to 2 decimals to avoid floating point errors
    for (const split of splits) {
      if (split.userId === req.user.sub) continue; // Skip self

      const shareAmount = parseFloat(parseFloat(split.shareAmount).toFixed(2));
      const gId = groupId || null; // Handle null for friend expenses
      
      const existing = await Balance.findOne(
        {
          where: {
            groupId: gId,
            fromUserId: split.userId,
            toUserId: req.user.sub,
          },
        },
        { transaction }
      );

      if (existing) {
        // Update with rounded value
        const newAmount = parseFloat((existing.netAmount + shareAmount).toFixed(2));
        await existing.update(
          { netAmount: newAmount },
          { transaction }
        );
      } else {
        await Balance.create(
          {
            groupId: gId,
            fromUserId: split.userId,
            toUserId: req.user.sub,
            netAmount: shareAmount,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    const expenseData = await Expense.findByPk(expense.id, {
      include: [
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }] },
      ],
    });

    // Invalidate simplified debts cache (only for group expenses)
    if (groupId) {
      await OptimizedTransaction.destroy({ where: { groupId } });
    }

    return res.status(201).json({
      message: 'Expense created',
      expense: {
        id: expenseData.id,
        groupId: expenseData.groupId,
        description: expenseData.title,
        amount: parseFloat(expenseData.amount),
        currency: expenseData.currency,
        paidBy: expenseData.payer,
        splitWith: expenseData.shares.map((s) => ({
          user: s.user,
          share: parseFloat(s.shareAmount),
        })),
        date: expenseData.createdAt.toISOString(),
        category: expenseData.category,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: 'Failed to create expense', error: error.message });
  }
}

async function getExpense(req, res) {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findByPk(expenseId, {
      include: [
        { model: Group },
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }] },
      ],
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Verify user is member of group (only for group expenses)
    if (expense.groupId) {
      const membership = await GroupMember.findOne({
        where: { groupId: expense.groupId, userId: req.user.sub },
      });

      if (!membership) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
    }

    return res.status(200).json({
      id: expense.id,
      groupId: expense.groupId,
      description: expense.title,
      amount: parseFloat(expense.amount),
      currency: expense.currency,
      paidBy: expense.payer,
      splitWith: expense.shares.map((s) => ({
        user: s.user,
        share: parseFloat(s.shareAmount),
      })),
      date: expense.createdAt.toISOString(),
      category: expense.category,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch expense', error: error.message });
  }
}

async function deleteExpense(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findByPk(expenseId, { transaction });

    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paidByUserId !== req.user.sub) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only the payer can delete' });
    }

    // Get shares to reverse balances
    const shares = await ExpenseShare.findAll(
      { where: { expenseId } },
      { transaction }
    );

    // Reverse balances
    for (const share of shares) {
      if (share.userId === req.user.sub) continue;

      const balance = await Balance.findOne(
        {
          where: {
            groupId: expense.groupId,
            fromUserId: share.userId,
            toUserId: req.user.sub,
          },
        },
        { transaction }
      );

      if (balance) {
        const newAmount = parseFloat(balance.netAmount) - parseFloat(share.shareAmount);
        if (newAmount <= 0) {
          await balance.destroy({ transaction });
        } else {
          await balance.update({ netAmount: newAmount }, { transaction });
        }
      }
    }

    // Delete shares
    await ExpenseShare.destroy({ where: { expenseId } }, { transaction });

    // Delete expense
    await expense.destroy({ transaction });

    await transaction.commit();

    // Invalidate simplified debts cache for this group
    await OptimizedTransaction.destroy({ where: { groupId: expense.groupId } });

    return res.status(200).json({ message: 'Expense deleted' });
  } catch (error) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: 'Failed to delete expense', error: error.message });
  }
}

export { createExpense, getExpense, deleteExpense };

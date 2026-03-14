import { Balance, User, GroupMember, Payment, Group, Expense, ExpenseShare, FriendRequest } from '../model/index.js';
import sequelize from '../db/sequelize.js';
import { Op } from 'sequelize';

async function getFriends(req, res) {
  try {
    const userId = req.user.sub;

    // First, get all balances involving this user
    const balances = await Balance.findAll({
      where: {
        [Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: [
        { model: User, as: 'debtor' },
        { model: User, as: 'creditor' },
      ],
      raw: false,
    });

    // Get all accepted friends from FriendRequest table
    const friendRequests = await FriendRequest.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      raw: false,
    });

    // Aggregate by friend
    const friendMap = new Map();

    // Add friends from balances
    balances.forEach((b) => {
      const isDebtor = b.fromUserId === userId;
      const friend = isDebtor ? b.creditor : b.debtor;
      const friendId = friend.id;

      if (!friendMap.has(friendId)) {
        friendMap.set(friendId, { user: friend, balance: 0 });
      }

      const current = friendMap.get(friendId);
      const amount = parseFloat(b.netAmount);

      if (isDebtor) {
        current.balance -= amount; // We owe
      } else {
        current.balance += amount; // They owe us
      }
    });

    // Add friends from accepted friend requests
    friendRequests.forEach((fr) => {
      const friend = fr.fromUserId === userId ? fr.receiver : fr.sender;
      const friendId = friend.id;

      if (!friendMap.has(friendId)) {
        friendMap.set(friendId, { user: friend, balance: 0 });
      }
    });

    const friends = Array.from(friendMap.values()).map((f) => ({
      id: `friend-${f.user.id}`,
      user: f.user,
      balance: f.balance,
    }));

    return res.status(200).json({ friends });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch friends', error: error.message });
  }
}

async function getFriend(req, res) {
  try {
    const { friendId } = req.params;
    const userId = req.user.sub;

    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    const balances = await Balance.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId },
        ],
      },
      raw: true,
    });

    let netBalance = 0;
    balances.forEach((b) => {
      const amount = parseFloat(b.netAmount);
      if (b.fromUserId === userId) {
        netBalance -= amount;
      } else {
        netBalance += amount;
      }
    });

    return res.status(200).json({
      id: `friend-${friend.id}`,
      user: friend,
      balance: netBalance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch friend', error: error.message });
  }
}

async function settlePayment(req, res) {
  try {
    const { friendId } = req.params;
    const { amount, groupId = null, method = 'online' } = req.body;
    const userId = req.user.sub;

    if (!amount || !friendId) {
      return res
        .status(400)
        .json({ message: 'amount and friendId are required' });
    }

    // If groupId provided, verify it exists
    if (groupId) {
      const group = await Group.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
    }

    const payment = await Payment.create({
      groupId: groupId || null, // null for friend-to-friend payments
      payerId: userId,
      payeeId: friendId,
      amount: parseFloat(amount),
      method,
      status: 'completed',
    });

    // Mark expense shares as settled - if groupId provided
    if (groupId) {
      const expenses = await Expense.findAll({
        where: { groupId, paidByUserId: userId },
      });

      const expenseIds = expenses.map((e) => e.id);

      if (expenseIds.length > 0) {
        await ExpenseShare.update(
          { isSettled: true },
          {
            where: {
              userId: friendId,
              expenseId: { [Op.in]: expenseIds },
            },
          }
        );
      }
    }

    // Update or create balance
    const balance = await Balance.findOne({
      where: { 
        groupId: groupId || null,
        fromUserId: userId, 
        toUserId: friendId 
      },
    });

    if (balance) {
      const newAmount = parseFloat(balance.netAmount) - parseFloat(amount);
      if (newAmount <= 0) {
        await balance.destroy();
      } else {
        await balance.update({ netAmount: newAmount });
      }
    }

    return res.status(201).json({
      message: 'Payment settled',
      payment: {
        id: payment.id,
        amount: parseFloat(payment.amount),
        date: payment.createdAt.toISOString(),
        status: payment.status,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to settle payment', error: error.message });
  }
}

export { getFriends, getFriend, settlePayment };

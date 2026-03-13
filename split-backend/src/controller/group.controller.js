import { Group, GroupMember, Expense, ExpenseShare, User, Balance } from '../model/index.js';
import sequelize from '../db/sequelize.js';

async function createGroup(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { name, description, currency = 'INR', memberEmails = [] } = req.body;
    const creatorId = req.user.sub;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Group name is required and must be at least 2 characters' });
    }

    if (!['USD', 'EUR', 'INR', 'GBP', 'AUD', 'CAD', 'JPY', 'MXN', 'SGD', 'HKD'].includes(currency)) {
      return res.status(400).json({ message: 'Invalid currency code' });
    }

    // Create group
    const group = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      currency,
      createdBy: creatorId,
    }, { transaction });

    // Add creator as admin
    await GroupMember.create({
      groupId: group.id,
      userId: creatorId,
      role: 'admin',
      joinedAt: new Date(),
    }, { transaction });

    // Add members if provided
    const addedMembers = [];
    const creator = await User.findByPk(creatorId);
    addedMembers.push({
      id: creator.id,
      name: creator.name,
      email: creator.email,
      role: 'admin',
    });

    // Process member emails
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const memberEmail = email.trim().toLowerCase();
        
        // Skip adding creator again
        if (memberEmail === creator.email.toLowerCase()) {
          continue;
        }

        // Find user by email
        const member = await User.findOne({
          where: { email: memberEmail },
        });

        if (member) {
          // Check if already a member
          const existingMembership = await GroupMember.findOne({
            where: { groupId: group.id, userId: member.id },
          });

          if (!existingMembership) {
            await GroupMember.create({
              groupId: group.id,
              userId: member.id,
              role: 'member',
              joinedAt: new Date(),
            }, { transaction });

            addedMembers.push({
              id: member.id,
              name: member.name,
              email: member.email,
              role: 'member',
            });
          }
        }
      }
    }

    await transaction.commit();

    return res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        currency: group.currency,
        createdBy: creatorId,
        members: addedMembers,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create group error:', error);
    return res.status(500).json({
      message: 'Failed to create group',
      error: error.message,
    });
  }
}

async function listMyGroups(req, res) {
  try {
    const memberships = await GroupMember.findAll({
      where: { userId: req.user.sub },
      include: [{ model: Group, include: [{ model: User, as: 'creator' }] }],
      order: [['joinedAt', 'DESC']],
    });

    const groups = memberships.map(async (row) => {
      const group = row.group.toJSON();
      
      // Fetch members
      const members = await GroupMember.findAll({
        where: { groupId: group.id },
        include: [{ model: User }],
      });
      group.members = members.map((m) => m.dataValues.user);

      // Get net balance for current user
      const balances = await Balance.findAll({
        where: { groupId: group.id },
        raw: true,
      });
      
      const userBalances = balances.filter((b) => b.fromUserId === req.user.sub || b.toUserId === req.user.sub);
      let netBalance = 0;
      userBalances.forEach((b) => {
        if (b.fromUserId === req.user.sub) {
          netBalance -= parseFloat(b.netAmount);
        } else {
          netBalance += parseFloat(b.netAmount);
        }
      });

      return {
        id: group.id,
        name: group.name,
        members: group.members,
        netBalance,
      };
    });

    const enrichedGroups = await Promise.all(groups);
    return res.status(200).json({ groups: enrichedGroups });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch groups', error: error.message });
  }
}

async function getGroupDetails(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findByPk(groupId, {
      include: [{ model: User, as: 'creator' }],
    });

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

    const members = await GroupMember.findAll({
      where: { groupId },
      include: [{ model: User }],
    });

    const formattedGroup = group.toJSON();
    formattedGroup.members = members.map((m) => m.dataValues.user);

    // Get expenses
    const expenses = await Expense.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    formattedGroup.expenses = expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      description: e.title,
      amount: parseFloat(e.amount),
      currency: e.currency,
      paidBy: e.payer,
      splitWith: e.shares.map((s) => ({
        user: s.user,
        share: parseFloat(s.shareAmount),
      })),
      date: e.createdAt.toISOString(),
      category: e.category,
    }));

    // Get balances for user
    const balances = await Balance.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'debtor' },
        { model: User, as: 'creditor' },
      ],
      raw: false,
    });

    const userBalances = balances
      .filter((b) => b.fromUserId === req.user.sub || b.toUserId === req.user.sub)
      .map((b) => ({
        fromUser: b.debtor,
        toUser: b.creditor,
        amount: parseFloat(b.netAmount),
      }));

    formattedGroup.userBalances = userBalances;

    return res.status(200).json(formattedGroup);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch group details', error: error.message });
  }
}

async function getGroupExpenses(req, res) {
  try {
    const { groupId } = req.params;

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

    const expenses = await Expense.findAll({
      where: { groupId },
      include: [
        { model: User, as: 'payer' },
        { model: ExpenseShare, as: 'shares', include: [{ model: User }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formatted = expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      description: e.title,
      amount: parseFloat(e.amount),
      currency: e.currency,
      paidBy: e.payer,
      splitWith: e.shares.map((s) => ({
        user: s.user,
        share: parseFloat(s.shareAmount),
      })),
      date: e.createdAt.toISOString(),
      category: e.category,
    }));

    return res.status(200).json({ expenses: formatted });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
}

async function getGroupMembers(req, res) {
  try {
    const { groupId } = req.params;

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

    const members = await GroupMember.findAll({
      where: { groupId },
      include: [{ model: User }],
    });

    return res.status(200).json({
      members: members.map((m) => ({
        ...m.user.toJSON(),
        role: m.role,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch members', error: error.message });
  }
}

export {
  createGroup,
  listMyGroups,
  getGroupDetails,
  getGroupExpenses,
  getGroupMembers,
};

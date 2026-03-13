import { User, FriendRequest, Notification } from '../model/index.js';
import { Op } from 'sequelize';
import { sendFriendRequestEmail, sendFriendAcceptedEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import sequelize from '../db/sequelize.js';

// Search users by email or phone
async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    const currentUserId = req.user.sub;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { email: { [Op.iLike]: `%${query}%` } },
              { phone: { [Op.iLike]: `%${query}%` } },
              { name: { [Op.iLike]: `%${query}%` } },
            ],
          },
          { id: { [Op.ne]: currentUserId } }, // Exclude current user
        ],
      },
      attributes: ['id', 'name', 'email', 'phone'],
      limit: 20,
    });

    // Get friend request status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendRequest = await FriendRequest.findOne({
          where: {
            [Op.or]: [
              { fromUserId: currentUserId, toUserId: user.id },
              { fromUserId: user.id, toUserId: currentUserId },
            ],
          },
        });

        return {
          ...user.toJSON(),
          friendStatus: friendRequest?.status || 'none', // 'none', 'pending', 'accepted', 'rejected'
          friendRequestId: friendRequest?.id,
        };
      })
    );

    return res.status(200).json({ users: usersWithStatus });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to search users',
      error: error.message,
    });
  }
}

// Send friend request
async function sendFriendRequest(req, res) {
  try {
    const { toUserId, message } = req.body;
    const fromUserId = req.user.sub;

    if (!toUserId) {
      return res.status(400).json({ message: 'toUserId is required' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findByPk(fromUserId),
      User.findByPk(toUserId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        message: `Friend request already ${existingRequest.status}`,
      });
    }

    // Create friend request in transaction
    const transaction = await sequelize.transaction();
    try {
      const friendRequest = await FriendRequest.create({
        fromUserId,
        toUserId,
        message: message || null,
        status: 'pending',
      }, { transaction });

      // Create in-app notification
      await createNotification(
        toUserId,
        'friend_request',
        `${sender.name} sent you a friend request`,
        `Accept to start splitting expenses together`,
        fromUserId,
        friendRequest.id
      );

      // Send email notification
      await sendFriendRequestEmail(receiver.email, sender.name, receiver.name);

      await transaction.commit();

      return res.status(201).json({
        message: 'Friend request sent',
        friendRequest: {
          id: friendRequest.id,
          fromUserId: friendRequest.fromUserId,
          toUserId: friendRequest.toUserId,
          status: friendRequest.status,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send friend request',
      error: error.message,
    });
  }
}

// Get pending friend requests
async function getPendingRequests(req, res) {
  try {
    const userId = req.user.sub;

    const requests = await FriendRequest.findAll({
      where: { toUserId: userId, status: 'pending' },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      requests: requests.map((r) => ({
        id: r.id,
        sender: r.sender,
        message: r.message,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch pending requests',
      error: error.message,
    });
  }
}

// Accept friend request
async function acceptFriendRequest(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user.sub;

    const friendRequest = await FriendRequest.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found or already responded' });
    }

    const transaction = await sequelize.transaction();
    try {
      // Update friend request
      friendRequest.status = 'accepted';
      friendRequest.respondedAt = new Date();
      await friendRequest.save({ transaction });

      // Create in-app notification for sender
      await createNotification(
        friendRequest.fromUserId,
        'friend_accepted',
        `${friendRequest.receiver.name} accepted your friend request`,
        'You can now split expenses together',
        userId
      );

      // Send email to sender
      await sendFriendAcceptedEmail(
        friendRequest.sender.email,
        friendRequest.receiver.name,
        friendRequest.sender.name
      );

      await transaction.commit();

      return res.status(200).json({
        message: 'Friend request accepted',
        friendRequest: {
          id: friendRequest.id,
          status: friendRequest.status,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to accept friend request',
      error: error.message,
    });
  }
}

// Reject friend request
async function rejectFriendRequest(req, res) {
  try {
    const { requestId } = req.params;
    const userId = req.user.sub;

    const friendRequest = await FriendRequest.findOne({
      where: { id: requestId, toUserId: userId, status: 'pending' },
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    return res.status(200).json({
      message: 'Friend request rejected',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reject friend request',
      error: error.message,
    });
  }
}

// Get list of accepted friends
async function getFriendsList(req, res) {
  try {
    const userId = req.user.sub;

    const friendRequests = await FriendRequest.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, status: 'accepted' },
          { toUserId: userId, status: 'accepted' },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });

    // Extract friend objects
    const friends = friendRequests.map((req) => {
      return req.fromUserId === userId ? req.receiver : req.sender;
    });

    return res.status(200).json({
      friends,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch friends list',
      error: error.message,
    });
  }
}

export {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
};

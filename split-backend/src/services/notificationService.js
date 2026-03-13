import { Notification } from '../model/index.js';

async function createNotification(userId, type, title, message, relatedUserId = null, relatedId = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedUserId,
      relatedId,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
}

async function getNotifications(userId, limit = 20, offset = 0) {
  try {
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: require('../model/index.js').User,
          as: 'relatedUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const count = await Notification.count({ where: { userId } });

    return { notifications, total: count };
  } catch (error) {
    console.error('Failed to fetch notifications:', error.message);
    return { notifications: [], total: 0 };
  }
}

async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('Failed to mark notification as read:', error.message);
    return null;
  }
}

async function markAllAsRead(userId) {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error.message);
    return false;
  }
}

async function getUnreadCount(userId) {
  try {
    const count = await Notification.count({
      where: { userId, isRead: false },
    });
    return count;
  } catch (error) {
    console.error('Failed to get unread count:', error.message);
    return 0;
  }
}

export {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};

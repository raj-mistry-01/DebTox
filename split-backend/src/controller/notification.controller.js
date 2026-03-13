import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../services/notificationService.js';

// Get all notifications for user
async function getNotificationsList(req, res) {
  try {
    const userId = req.user.sub;
    const { limit = 20, offset = 0 } = req.query;

    const result = await getNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    if (!result || !result.notifications) {
      return res.status(200).json({ notifications: [] });
    }

    return res.status(200).json({
      notifications: result.notifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      total: result.total,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
}

// Mark single notification as read
async function readNotification(req, res) {
  try {
    const userId = req.user.sub;
    const { notificationId } = req.params;

    const result = await markAsRead(notificationId, userId);

    if (!result) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
}

// Mark all notifications as read for user
async function readAllNotifications(req, res) {
  try {
    const userId = req.user.sub;

    const result = await markAllAsRead(userId);

    return res.status(200).json({
      message: 'All notifications marked as read',
      updatedCount: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
}

// Get count of unread notifications for badge
async function getUnreadNotificationCount(req, res) {
  try {
    const userId = req.user.sub;

    const count = await getUnreadCount(userId);

    return res.status(200).json({ unreadCount: count || 0 });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
}

export {
  getNotificationsList,
  readNotification,
  readAllNotifications,
  getUnreadNotificationCount,
};

import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getNotificationsList,
  readNotification,
  readAllNotifications,
  getUnreadNotificationCount,
} from '../controller/notification.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get unread count (for badge) - MUST come before generic GET /
router.get('/unread', getUnreadNotificationCount);

// Get all notifications
router.get('/', getNotificationsList);

// Mark all notifications as read
router.put('/read-all', readAllNotifications);

// Mark single notification as read
router.put('/:notificationId/read', readNotification);

export default router;

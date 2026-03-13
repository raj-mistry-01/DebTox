import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
} from '../controller/friend.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Search for users by email or phone
router.get('/search', searchUsers);

// Get list of accepted friends
router.get('/', getFriendsList);

// Get pending friend requests (incoming)
router.get('/requests', getPendingRequests);

// Send friend request
router.post('/request', sendFriendRequest);

// Accept friend request
router.put('/requests/:requestId/accept', acceptFriendRequest);

// Reject friend request
router.put('/requests/:requestId/reject', rejectFriendRequest);

export default router;

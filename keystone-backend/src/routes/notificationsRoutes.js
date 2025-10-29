const express = require('express');
const router = express.Router();
const verifyAuth = require('../middleware/verifyAuth');
const {
  registerEndpoint,
  unregisterEndpoint,
  testSend
} = require('../controllers/notificationsController');
const {
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationPreferencesController');

// All notification routes require authentication
router.use(verifyAuth);

// POST /api/users/me/push-endpoints - Register current user's push endpoint
router.post('/users/me/push-endpoints', registerEndpoint);

// DELETE /api/users/me/push-endpoints/:id - Unregister a push endpoint by id (must belong to current user)
router.delete('/users/me/push-endpoints/:id', unregisterEndpoint);

// POST /api/notifications/test - Send a test notification (to current user by default)
router.post('/notifications/test', testSend);

// GET /api/users/me/notification-preferences - Get current user's notification preferences
router.get('/users/me/notification-preferences', getNotificationPreferences);

// PUT /api/users/me/notification-preferences - Update current user's notification preferences
router.put('/users/me/notification-preferences', updateNotificationPreferences);

module.exports = router;

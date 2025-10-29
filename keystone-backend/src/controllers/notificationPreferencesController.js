const prisma = require('../config/database');

/**
 * GET /api/users/me/notification-preferences
 * Get current user's notification preferences
 */
async function getNotificationPreferences(req, res) {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing authenticated user' });
    }

    const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { user_id: user.id },
      select: {
        event: true,
        push: true
      }
    }); // Create a preferences object with defaults for missing events
    const allEvents = [
      'expense_created',
      'expense_approved',
      'expense_denied',
      'category_shared',
      'mention',
      'weekly_summary'
    ];
    const preferencesMap = {};

    // Set defaults
    allEvents.forEach((event) => {
      preferencesMap[event] = { push: true };
    });

    // Override with actual preferences
    preferences.forEach((pref) => {
      preferencesMap[pref.event] = {
        push: pref.push
      };
    });

    return res.json({ preferences: preferencesMap });
  } catch (err) {
    console.error('getNotificationPreferences error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: 'Failed to get notification preferences' });
  }
}

/**
 * PUT /api/users/me/notification-preferences
 * Update current user's notification preferences
 * Body: { preferences: { [event]: { push: boolean, email: boolean } } }
 */
async function updateNotificationPreferences(req, res) {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing authenticated user' });
    }

    const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res
        .status(400)
        .json({ error: 'Bad Request', message: 'preferences object is required' });
    }

    const validEvents = [
      'expense_created',
      'expense_approved',
      'expense_denied',
      'category_shared',
      'mention',
      'weekly_summary'
    ];

    // Update preferences for each event
    const updatePromises = Object.entries(preferences).map(async ([event, settings]) => {
      if (!validEvents.includes(event)) {
        throw new Error(`Invalid event: ${event}`);
      }

      if (typeof settings !== 'object' || typeof settings.push !== 'boolean') {
        throw new Error(`Invalid settings for event ${event}`);
      }

      return prisma.notificationPreference.upsert({
        where: {
          user_id_event: {
            user_id: user.id,
            event: event
          }
        },
        create: {
          user_id: user.id,
          event: event,
          push: settings.push,
          email: false // Always false since we don't support email
        },
        update: {
          push: settings.push
          // Don't update email field
        }
      });
    });

    await Promise.all(updatePromises);

    // Return updated preferences
    const updatedPreferences = await prisma.notificationPreference.findMany({
      where: { user_id: user.id },
      select: {
        event: true,
        push: true
      }
    });

    const preferencesMap = {};
    updatedPreferences.forEach((pref) => {
      preferencesMap[pref.event] = {
        push: pref.push
      };
    });

    return res.json({
      message: 'Notification preferences updated',
      preferences: preferencesMap
    });
  } catch (err) {
    console.error('updateNotificationPreferences error:', err);
    return res
      .status(500)
      .json({
        error: 'Internal Server Error',
        message: err.message || 'Failed to update notification preferences'
      });
  }
}

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences
};

const prisma = require('../config/database');
const { sendExpoPush } = require('../services/notifications/expo');

/**
 * POST /api/users/me/push-endpoints
 * Body: { provider: 'expo', token: string, platform: 'ios'|'android', app?: string, locale?: string, subscription?: object }
 * Requires verifyAuth (mounted at router level).
 */
async function registerEndpoint(req, res) {
  try {
    const {
      provider = 'expo',
      token,
      platform,
      app = 'expo',
      locale,
      subscription
    } = req.body || {};

    if (!token || !platform) {
      return res
        .status(400)
        .json({ error: 'Bad Request', message: 'token and platform are required' });
    }

    // Find current user by Firebase UID from req.user (set by verifyAuth middleware)
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing authenticated user' });
    }

    const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    // Upsert endpoint: unique(provider, token)
    const endpoint = await prisma.notificationEndpoint.upsert({
      where: { provider_token: { provider, token } },
      create: {
        user_id: user.id,
        provider,
        platform,
        token,
        app,
        locale: locale || null,
        subscription: subscription || undefined,
        lastSeenAt: new Date()
      },
      update: {
        user_id: user.id,
        platform,
        app,
        locale: locale || null,
        subscription: subscription || undefined,
        lastSeenAt: new Date()
      },
      select: {
        id: true,
        user_id: true,
        platform: true,
        provider: true,
        token: true,
        app: true,
        locale: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      message: 'Push endpoint registered',
      endpoint
    });
  } catch (err) {
    console.error('registerEndpoint error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: 'Failed to register push endpoint' });
  }
}

/**
 * DELETE /api/users/me/push-endpoints/:id
 * Requires verifyAuth
 */
async function unregisterEndpoint(req, res) {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing authenticated user' });
    }
    const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Valid id param required' });
    }

    // Ensure endpoint belongs to user
    const existing = await prisma.notificationEndpoint.findUnique({ where: { id } });
    if (!existing || existing.user_id !== user.id) {
      return res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
    }

    await prisma.notificationEndpoint.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('unregisterEndpoint error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: 'Failed to unregister push endpoint' });
  }
}

/**
 * POST /api/notifications/test
 * Body: { userId?: number, title?: string, body?: string, data?: object }
 * Sends a test push to all Expo endpoints for the current user (default) or specified userId (admin use).
 * Requires verifyAuth (you can restrict further as needed).
 */
async function testSend(req, res) {
  try {
    const {
      userId,
      title = 'Test notification',
      body = 'Hello from Keystone',
      data = {}
    } = req.body || {};

    let targetUserId = userId;
    if (!targetUserId) {
      // Default to current authenticated user
      const firebaseUid = req.user?.uid;
      if (!firebaseUid) {
        return res
          .status(401)
          .json({ error: 'Unauthorized', message: 'Missing authenticated user' });
      }
      const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }
      targetUserId = user.id;
    }

    // Fetch endpoints for user
    const endpoints = await prisma.notificationEndpoint.findMany({
      where: { user_id: targetUserId, provider: 'expo' },
      select: { token: true }
    });

    if (!endpoints.length) {
      return res.status(404).json({ error: 'Not Found', message: 'No Expo endpoints for user' });
    }

    const messages = endpoints.map((e) => ({
      to: e.token,
      title,
      body,
      data,
      sound: 'default'
    }));

    const result = await sendExpoPush(messages);
    return res.status(200).json({ message: 'Test push attempted', result });
  } catch (err) {
    console.error('testSend error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', message: 'Failed to send test push' });
  }
}

module.exports = {
  registerEndpoint,
  unregisterEndpoint,
  testSend
};

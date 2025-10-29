const express = require('express');
const router = express.Router();
const ShareLinkService = require('../services/shareLinkService');
const verifyAuth = require('../middleware/verifyAuth');
const { checkPermissions } = require('../middleware/checkPermissions');
const { PrismaClient } = require('@prisma/client');
const permissionService = require('../services/permissionService');

const prisma = new PrismaClient();

// GET all links for a specific category (admin-only)
router.get('/category/:categoryId', verifyAuth, checkPermissions('ADMIN'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const links = await ShareLinkService.getCategoryShareLinks(categoryId);
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve links' });
  }
});

// POST to create a new link (admin-only)
router.post('/create', verifyAuth, checkPermissions('ADMIN'), async (req, res) => {
  try {
    const { categoryId, permission_level, expires_at, description } = req.body;
    const newLink = await ShareLinkService.createShareLink(
      categoryId,
      permission_level,
      expires_at,
      description
    );
    res.status(201).json(newLink);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE to revoke a link (admin-only)
router.delete('/:token', verifyAuth, async (req, res) => {
  try {
    const { token } = req.params;

    // Look up the link to determine its category
    const link = await prisma.guestToken.findUnique({ where: { token } });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Resolve current user
    const firebaseUid = req.user?.uid;
    const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    // Ensure the user has admin permission on the linked category
    const hasAdmin = await permissionService.hasAdminPermission(user.id, link.category_id);
    if (!hasAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
    }

    const success = await ShareLinkService.revokeShareLink(token);
    if (success) {
      return res.status(204).send();
    }
    return res.status(404).json({ error: 'Link not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to revoke link' });
  }
});

// Public: validate token for guest entry (no auth)
router.post('/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  try {
    const linkDetails = await ShareLinkService.validateShareLink(token);
    // Return the necessary details for the frontend to establish a session
    res.json({
      permission_level: linkDetails.permission_level,
      category_id: linkDetails.category_id
    });
  } catch (error) {
    if (error.message === 'Invalid or expired share link') {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    res.status(500).json({ error: 'Server error during token validation.' });
  }
});

module.exports = router;

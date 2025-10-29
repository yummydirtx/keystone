const express = require('express');
const router = express.Router();
const ShareLinkService = require('../services/shareLinkService');

// GET all links for a specific category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const links = await ShareLinkService.getCategoryShareLinks(parseInt(req.params.categoryId));
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve links' });
  }
});

// POST to create a new link
router.post('/create', async (req, res) => {
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

// DELETE to revoke a link
router.delete('/:token', async (req, res) => {
  try {
    const success = await ShareLinkService.revokeShareLink(req.params.token);
    if (success) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ error: 'Link not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke link' });
  }
});

module.exports = router;

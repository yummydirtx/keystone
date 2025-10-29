const { prisma, getCurrentUser, validateCategoryId } = require('./utils');
const ShareLinkService = require('../../services/shareLinkService');

/**
 * Get all active guest links for a specific category
 * GET /api/categories/:id/guest-links
 *
 * Requires REVIEWER role or higher on the category
 */
const getGuestLinksForCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get current user - try req.dbUser first (from checkPermissions middleware),
    // then fall back to looking up from req.user (for test environment)
    let currentUser = req.dbUser;
    if (!currentUser && req.user) {
      currentUser = await prisma.user.findUnique({
        where: { firebase_uid: req.user.uid }
      });

      if (!currentUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }
    }

    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const categoryIdInt = validateCategoryId(categoryId, res);
    if (!categoryIdInt) return;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryIdInt }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Get all active guest links for the category
    const guestLinks = await ShareLinkService.getCategoryShareLinks(categoryIdInt);

    res.json({
      success: true,
      data: guestLinks
    });
  } catch (error) {
    console.error('Error getting guest links for category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve guest links'
    });
  }
};

module.exports = { getGuestLinksForCategory };

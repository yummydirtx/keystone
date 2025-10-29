const crypto = require('crypto');
const {
  prisma,
  getCurrentUser,
  validateCategoryId,
  validatePermissionLevel,
  validateExpirationDate,
  validateAdminPermission
} = require('./utils');

/**
 * Generate a shareable guest link for a category
 * POST /api/categories/:categoryId/share-links
 *
 * Requires ADMIN role on the category
 */
const createShareLink = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { permission_level, expires_at, description } = req.body;

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

    const validPermissionLevel = validatePermissionLevel(permission_level, res);
    if (!validPermissionLevel) return;

    // Check admin permission and validate category
    const hasPermission = await validateAdminPermission(currentUser.id, categoryIdInt, res);
    if (!hasPermission) return;

    // Parse expiration date if provided
    const expiresAt = validateExpirationDate(expires_at, res);
    if (expiresAt === false) return; // Validation failed

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create the guest token
    const guestToken = await prisma.guestToken.create({
      data: {
        token,
        permission_level: validPermissionLevel,
        expires_at: expiresAt,
        category: {
          connect: {
            id: categoryIdInt
          }
        }
      },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });

    // Generate the shareable link (you might want to use your actual domain)
    const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/guest?token=${token}`;

    res.status(201).json({
      message: 'Share link created successfully',
      shareLink: {
        id: guestToken.id,
        token: guestToken.token,
        url: shareableLink,
        permission_level: guestToken.permission_level,
        expires_at: guestToken.expires_at,
        category: guestToken.category,
        is_active: true,
        createdAt: guestToken.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create share link'
    });
  }
};

module.exports = { createShareLink };

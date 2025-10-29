const permissionService = require('../../services/permissionService');
const {
  getCurrentUser,
  validateCategoryId,
  validateAdminPermission,
  getUserDatabaseId
} = require('./utils');

/**
 * Revoke a user's permission from a category
 * DELETE /api/categories/:categoryId/permissions/:userId
 *
 * Requires ADMIN role on the category
 */
const revokePermission = async (req, res) => {
  try {
    const { categoryId, userId } = req.params;

    // Get current user
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    const categoryIdInt = validateCategoryId(categoryId, res);
    if (!categoryIdInt) return;

    // Check admin permission and validate category
    const hasPermission = await validateAdminPermission(currentUser.id, categoryIdInt, res);
    if (!hasPermission) return;

    // Handle userId - convert to database ID
    let userIdInt;
    try {
      userIdInt = await getUserDatabaseId(userId);
    } catch (error) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Target user not found'
      });
    }

    // Revoke the permission
    const revokedPermission = await permissionService.revokePermission(categoryIdInt, userIdInt);

    res.status(200).json({
      message: 'Permission revoked successfully',
      revokedPermission: {
        user: revokedPermission.user,
        role: revokedPermission.role,
        categoryId: categoryIdInt
      }
    });
  } catch (error) {
    console.error('Error revoking permission:', error);

    if (error.message === 'Permission not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Permission not found for this user on this category'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke permission'
    });
  }
};

module.exports = { revokePermission };

const permissionService = require('../../services/permissionService');
const {
  prisma,
  getCurrentUser,
  validateCategoryId,
  validateRole,
  validateAdminPermission
} = require('./utils');
const { notifyUserCategoryShared } = require('../../services/notifications');

/**
 * Grant a user permission on a category
 * POST /api/categories/:categoryId/permissions
 *
 * Requires ADMIN role on the category
 */
const grantPermission = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { userId, role } = req.body;

    // Get current user
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Validate input
    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required'
      });
    }

    const categoryIdInt = validateCategoryId(categoryId, res);
    if (!categoryIdInt) return;

    const validRole = validateRole(role, res);
    if (!validRole) return;

    // Check admin permission and validate category
    const hasPermission = await validateAdminPermission(currentUser.id, categoryIdInt, res);
    if (!hasPermission) return;

    // Check if permission already exists to determine status code
    const existingPermission = await prisma.categoryPermission.findFirst({
      where: {
        category_id: categoryIdInt,
        user: {
          firebase_uid: userId // userId is actually firebase_uid in our case
        }
      }
    });

    // Grant the permission - the service handles user lookup and upsert logic
    const permission = await permissionService.grantPermission(categoryIdInt, userId, validRole);

    const statusCode = existingPermission ? 200 : 201;
    const message = existingPermission
      ? 'Permission updated successfully'
      : 'Permission granted successfully';

    // Fire-and-forget notification: category shared with user
    try {
      // permission.user.id is internal user id if service selects it; otherwise fetch by firebase uid
      let targetUserId = permission?.user?.id;
      if (!targetUserId) {
        const targetUser = await prisma.user.findUnique({
          where: { firebase_uid: userId },
          select: { id: true }
        });
        targetUserId = targetUser?.id || null;
      }

      if (targetUserId) {
        // Fetch some context for better message
        const category = await prisma.category.findUnique({
          where: { id: categoryIdInt },
          select: { id: true, name: true, report_id: true }
        });
        await notifyUserCategoryShared(targetUserId, {
          categoryId: categoryIdInt,
          role: validRole,
          categoryName: category?.name || undefined,
          reportId: category?.report_id || undefined
        });
      }
    } catch (notifyErr) {
      // Don't fail the API response if notification send fails
      console.warn('Notification (category shared) failed:', notifyErr?.message || notifyErr);
    }

    res.status(statusCode).json({
      message: message,
      permission: {
        id: permission.id,
        role: permission.role,
        user: permission.user,
        category: permission.category,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      }
    });
  } catch (error) {
    console.error('Error granting permission:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Target user not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error: ' + error.message,
      message: 'Failed to grant permission'
    });
  }
};

module.exports = { grantPermission };

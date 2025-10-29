const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service for managing category permissions
 */
class PermissionService {
  /**
   * Check if a user has admin permissions on a category (includes recursive parent checking)
   * @param {number} userId - User ID from database
   * @param {number} categoryId - Category ID
   * @returns {Promise<boolean>} - Whether user has admin permissions
   */
  async hasAdminPermission(userId, categoryId) {
    return await this.checkCategoryPermissionRecursive(userId, categoryId, 'ADMIN');
  }

  /**
   * Recursively check if a user has the required permission on a category or any of its parents
   * @param {number} userId - The user's database ID
   * @param {number} categoryId - The category ID to check
   * @param {string} requiredRole - The minimum role required
   * @returns {Promise<boolean>} Whether the user has the required permission
   */
  async checkCategoryPermissionRecursive(userId, categoryId, requiredRole) {
    try {
      // Get the category and its permission chain
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          permissions: {
            where: { user_id: userId }
          },
          parent_category: true,
          report: true
        }
      });

      if (!category) {
        if (requiredRole === 'ADMIN') {
          throw new Error('Category not found');
        }
        return false;
      }

      // Check if user is the report owner (always has ADMIN privileges)
      if (category.report.owner_id === userId) {
        return true;
      }

      // Check direct permission on this category
      const directPermission = category.permissions.find((p) => p.user_id === userId);
      if (directPermission) {
        // Role hierarchy: ADMIN > REVIEWER > SUBMITTER
        if (
          directPermission.role === 'ADMIN' ||
          (directPermission.role === 'REVIEWER' &&
            (requiredRole === 'REVIEWER' || requiredRole === 'SUBMITTER')) ||
          (directPermission.role === 'SUBMITTER' && requiredRole === 'SUBMITTER')
        ) {
          return true;
        }
      }

      // If no direct permission and there's a parent category, check recursively
      if (category.parent_category_id) {
        return await this.checkCategoryPermissionRecursive(
          userId,
          category.parent_category_id,
          requiredRole
        );
      }

      return false;
    } catch (error) {
      console.error('Error in checkCategoryPermissionRecursive:', error);
      if (requiredRole === 'ADMIN' && error.message === 'Category not found') {
        throw error;
      }
      return false;
    }
  }

  /**
   * Grant or update a permission for a user on a category
   * @param {number} categoryId - Category ID
   * @param {string|number} userIdentifier - Target user's email, Firebase UID, or database ID
   * @param {string} role - Role to grant (REVIEWER or ADMIN)
   * @returns {Promise<Object>} - Created or updated permission
   */
  async grantPermission(categoryId, userIdentifier, role) {
    // Find the target user by different identifiers
    let targetUser;

    // First try to parse as integer (database ID)
    if (!isNaN(parseInt(userIdentifier))) {
      const userIdInt = parseInt(userIdentifier);
      targetUser = await prisma.user.findUnique({
        where: { id: userIdInt },
        select: { id: true, name: true, email: true }
      });
    } else if (userIdentifier.includes('@')) {
      // If contains @, treat as email (normalize to lowercase for case-insensitive lookup)
      targetUser = await prisma.user.findUnique({
        where: { email: userIdentifier.toLowerCase() },
        select: { id: true, name: true, email: true }
      });
    } else {
      // Otherwise, treat as Firebase UID
      targetUser = await prisma.user.findUnique({
        where: { firebase_uid: userIdentifier },
        select: { id: true, name: true, email: true }
      });
    }

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if permission already exists
    const existingPermission = await prisma.categoryPermission.findFirst({
      where: {
        category_id: categoryId,
        user_id: targetUser.id
      }
    });

    let permission;

    if (existingPermission) {
      // Update existing permission
      permission = await prisma.categoryPermission.update({
        where: { id: existingPermission.id },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          category: {
            select: { id: true, name: true }
          }
        }
      });
    } else {
      // Create new permission
      permission = await prisma.categoryPermission.create({
        data: {
          category_id: categoryId,
          user_id: targetUser.id,
          role
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          category: {
            select: { id: true, name: true }
          }
        }
      });
    }

    return permission;
  }

  /**
   * Revoke a permission for a user on a category
   * @param {number} categoryId - Category ID
   * @param {number} targetUserId - Target user's ID
   * @returns {Promise<Object>} - Revoked permission details
   */
  async revokePermission(categoryId, targetUserId) {
    const permission = await prisma.categoryPermission.findFirst({
      where: {
        category_id: categoryId,
        user_id: targetUserId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    await prisma.categoryPermission.delete({
      where: { id: permission.id }
    });

    return permission;
  }

  /**
   * Get all permissions for a category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>} - List of permissions
   */
  async getCategoryPermissions(categoryId) {
    return await prisma.categoryPermission.findMany({
      where: { category_id: categoryId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

module.exports = new PermissionService();

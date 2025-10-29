const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service for user authentication and authorization
 */
class AuthService {
  /**
   * Get or create user from Firebase authentication
   * @param {Object} firebaseUser - Firebase user object (from req.user)
   * @returns {Promise<Object>} - Database user object
   */
  async getOrCreateUser(firebaseUser) {
    const { uid, email, name, picture } = firebaseUser;

    // Try to find existing user
    let dbUser = await prisma.user.findUnique({
      where: { firebase_uid: uid },
      select: {
        id: true,
        firebase_uid: true,
        email: true,
        name: true,
        avatar_url: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          firebase_uid: uid,
          email: email ? email.toLowerCase() : email,
          name: name || null,
          avatar_url: picture || null
        },
        select: {
          id: true,
          firebase_uid: true,
          email: true,
          name: true,
          avatar_url: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    return dbUser;
  }

  /**
   * Check if user has admin permission on a category (includes recursive parent checking)
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
      return false;
    }
  }

  /**
   * Check if user has any permission on a category
   * @param {number} userId - User ID from database
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object|null>} - Permission object or null
   */
  async getUserPermission(userId, categoryId) {
    // Check if user owns the report
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        report: {
          select: { owner_id: true }
        }
      }
    });

    if (!category) {
      return null;
    }

    // If user owns the report, they have implicit ADMIN permission
    if (category.report.owner_id === userId) {
      return {
        role: 'ADMIN',
        source: 'owner'
      };
    }

    // Check explicit permissions
    const permission = await prisma.categoryPermission.findFirst({
      where: {
        category_id: categoryId,
        user_id: userId
      }
    });

    if (permission) {
      return {
        role: permission.role,
        source: 'permission'
      };
    }

    return null;
  }

  /**
   * Validate that a category exists and get its details
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} - Category with report details
   */
  async validateCategory(categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            owner_id: true
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }
}

module.exports = new AuthService();

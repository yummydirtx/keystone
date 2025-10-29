const permissionService = require('../../services/permissionService');
const { prisma, getCurrentUser, validateCategoryId, validateAdminPermission } = require('./utils');

/**
 * Get all permissions for a category including inherited permissions from parent categories
 * GET /api/categories/:categoryId/permissions
 *
 * Requires ADMIN role on the category
 */
const getCategoryPermissions = async (req, res) => {
  try {
    const { categoryId } = req.params;

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

    // Get category with report owner information and parent hierarchy
    const category = await prisma.category.findUnique({
      where: { id: categoryIdInt },
      include: {
        report: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Helper function to get all parent categories in hierarchy
    const getParentCategories = async (categoryId) => {
      const parents = [];
      let currentCategoryId = categoryId;
      
      while (currentCategoryId) {
        const currentCategory = await prisma.category.findUnique({
          where: { id: currentCategoryId },
          select: {
            id: true,
            name: true,
            parent_category_id: true
          }
        });
        
        if (!currentCategory) break;
        
        if (currentCategory.parent_category_id) {
          parents.push(currentCategory.parent_category_id);
          currentCategoryId = currentCategory.parent_category_id;
        } else {
          break;
        }
      }
      
      return parents;
    };

    // Get all parent category IDs
    const parentCategoryIds = await getParentCategories(categoryIdInt);
    const allCategoryIds = [categoryIdInt, ...parentCategoryIds];

    // Get all permissions for this category and its parents
    const allPermissions = await prisma.categoryPermission.findMany({
      where: {
        category_id: { in: allCategoryIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // ADMIN first, then REVIEWER
        { user: { name: 'asc' } } // Then by user name
      ]
    });

    // Build user permission map - prefer permissions from closer categories (higher priority)
    const userPermissionMap = new Map();
    
    // Process permissions from current category first, then parents (in order)
    for (const categoryId of allCategoryIds) {
      const categoryPermissions = allPermissions.filter(p => p.category_id === categoryId);
      
      for (const permission of categoryPermissions) {
        const userId = permission.user.id;
        
        // Only add if we don't already have a permission for this user (closer category takes precedence)
        if (!userPermissionMap.has(userId)) {
          userPermissionMap.set(userId, {
            id: permission.id,
            role: permission.role,
            user: permission.user,
            sourceCategory: permission.category,
            isDirect: permission.category_id === categoryIdInt,
            isInherited: permission.category_id !== categoryIdInt
          });
        }
      }
    }

    // Build the final permissions list with owner first
    const ownerPermission = {
      id: null, // Owner doesn't have an explicit permission record
      role: 'OWNER',
      user: category.report.owner,
      sourceCategory: null,
      isDirect: true,
      isInherited: false
    };

    // Convert map to array and filter out owner if they have explicit permissions
    const userPermissions = Array.from(userPermissionMap.values())
      .filter(p => p.user.id !== category.report.owner.id);

    // Create final permissions array with owner first, then others
    const finalPermissions = [
      ownerPermission,
      ...userPermissions
    ];

    return res.status(200).json({
      message: 'Permissions retrieved successfully',
      permissions: finalPermissions
    });
  } catch (error) {
    console.error('Error getting category permissions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category permissions'
    });
  }
};

module.exports = { getCategoryPermissions };

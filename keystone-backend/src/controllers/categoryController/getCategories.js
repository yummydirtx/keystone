const {
  prisma,
  validateCategoryId,
  validateReportId,
  formatCategoryResponse,
  buildCategoryHierarchy,
  calculateCategorySpending
} = require('./utils');

/**
 * Get all categories for a report in hierarchical structure
 * GET /api/reports/:reportId/categories
 */
const getCategories = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validate reportId
    const reportIdInt = validateReportId(reportId, res);
    if (!reportIdInt) return;

    // Get all categories for the report
    const categories = await prisma.category.findMany({
      where: {
        report_id: reportIdInt
      },
      include: {
        parent_category: {
          select: {
            id: true,
            name: true
          }
        },
        child_categories: {
          select: {
            id: true,
            name: true,
            budget: true
          }
        },
        _count: {
          select: {
            expenses: true,
            child_categories: true
          }
        }
      },
      orderBy: [{ parent_category_id: 'asc' }, { name: 'asc' }]
    });

    // Build hierarchical structure with spending calculations
    const rootCategories = await buildCategoryHierarchy(categories);

    res.json({
      message: 'Categories retrieved successfully',
      categories: rootCategories,
      totalCount: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories'
    });
  }
};

/**
 * Get a specific category with details
 * GET /api/categories/:categoryId
 */
const getCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userFirebaseUid = req.user.uid;

    // Validate categoryId
    const categoryIdInt = validateCategoryId(categoryId, res);
    if (!categoryIdInt) return;

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { firebase_uid: userFirebaseUid }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryIdInt },
      include: {
        parent_category: {
          select: {
            id: true,
            name: true
          }
        },
        child_categories: {
          select: {
            id: true,
            name: true,
            budget: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        report: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          }
        },
        permissions: {
          where: { user_id: user.id }
        },
        _count: {
          select: {
            expenses: true,
            child_categories: true
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

    // Check user's permission level for this category
    let userRole = null;
    let hasDirectPermission = false;

    // Check if user is the report owner
    if (category.report.owner.id === user.id) {
      userRole = 'ADMIN';
      hasDirectPermission = true; // Report owner has direct admin permissions
    } else {
      // Check direct permission on this category
      const directPermission = category.permissions.find((p) => p.user_id === user.id);
      if (directPermission) {
        userRole = directPermission.role;
        hasDirectPermission = true;
      } else {
        // If no direct permission, check parent categories recursively
        userRole = await getUserRoleForCategory(user.id, categoryIdInt);
        hasDirectPermission = false;
      }
    }

    // Format response based on user's permission level
    let responseCategory = await formatCategoryResponse(category);

    // If user only has SUBMITTER permission, restrict the data
    if (userRole === 'SUBMITTER') {
      // Calculate spending for submitter view (they can see spending but not budget)
      const spentAmount = await calculateCategorySpending(category.id);

      responseCategory = {
        id: category.id,
        name: category.name,
        spentAmount: spentAmount,
        require_receipt: category.require_receipt, // Include receipt requirement
        allow_guest_submissions: category.allow_guest_submissions,
        allow_user_submissions: category.allow_user_submissions,
        // Don't include budget or percentage for submitters
        parent_category: category.parent_category,
        child_categories: category.child_categories.map((child) => ({
          id: child.id,
          name: child.name
          // Remove budget for submitters
        })),
        report: category.report,
        _count: {
          child_categories: category._count.child_categories
          // Remove expenses count for submitters
        }
      };
    }

    // Debug log removed for production deployment.

    res.json({
      message: 'Category retrieved successfully',
      category: responseCategory,
      userRole: userRole,
      hasDirectPermission: hasDirectPermission
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category'
    });
  }
};

/**
 * Helper function to get user's role for a category by checking parent hierarchy
 */
async function getUserRoleForCategory(userId, categoryId) {
  try {
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
      return null;
    }

    // Check if user is the report owner
    if (category.report.owner_id === userId) {
      return 'ADMIN';
    }

    // Check direct permission
    const directPermission = category.permissions.find((p) => p.user_id === userId);
    if (directPermission) {
      return directPermission.role;
    }

    // Check parent category recursively
    if (category.parent_category_id) {
      return await getUserRoleForCategory(userId, category.parent_category_id);
    }

    return null;
  } catch (error) {
    console.error('Error getting user role for category:', error);
    return null;
  }
}

module.exports = { getCategories, getCategory };

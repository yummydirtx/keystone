const prisma = require('../config/database');

/**
 * Middleware to check if a user has the required permission on a category.
 * This performs recursive permission checking - if a user has permission on a parent category,
 * they inherit that permission on all child categories.
 *
 * @param {string} requiredRole - The minimum role required ('REVIEWER' or 'ADMIN')
 * @returns {Function} Express middleware function
 */
const checkPermissions = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { categoryId, reportId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      let hasPermission = false;

      // Check categoryId from params or body (for POST requests)
      const effectiveCategoryId = categoryId || req.body.categoryId;

      if (effectiveCategoryId) {
        // Check permissions for a specific category
        const categoryIdInt = parseInt(effectiveCategoryId);
        if (isNaN(categoryIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid category ID'
          });
        }
        hasPermission = await checkCategoryPermission(user.id, categoryIdInt, requiredRole);
      } else if (reportId) {
        // Check if user is the owner of the report (for creating categories)
        const reportIdInt = parseInt(reportId);
        if (isNaN(reportIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid report ID'
          });
        }

        const report = await prisma.report.findUnique({
          where: { id: reportIdInt }
        });

        if (!report) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Report not found'
          });
        }

        // Report owner has ADMIN privileges on all categories within their report
        hasPermission = report.owner_id === user.id;

        // If not report owner, check if creating a subcategory with parentCategoryId
        if (!hasPermission && req.body.parentCategoryId) {
          const parentCategoryId = parseInt(req.body.parentCategoryId);
          if (!isNaN(parentCategoryId)) {
            // Check if user has ADMIN or REVIEWER permission on the parent category
            // REVIEWER users can create subcategories
            hasPermission = await checkCategoryPermission(user.id, parentCategoryId, 'REVIEWER');
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Insufficient permissions. ${requiredRole} role required.`
        });
      }

      // Add user info to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware specifically for category deletion that allows:
 * - ADMIN users to delete any category they have access to
 * - REVIEWER users to delete empty subcategories of categories shared with them
 */
const checkCategoryDeletionPermissions = () => {
  return async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      const categoryIdInt = parseInt(categoryId);
      if (isNaN(categoryIdInt)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid category ID'
        });
      }

      // Get the category with necessary information
      const category = await prisma.category.findUnique({
        where: { id: categoryIdInt },
        include: {
          report: true,
          permissions: {
            where: { user_id: user.id }
          },
          parent_category: {
            include: {
              permissions: {
                where: { user_id: user.id }
              },
              report: true
            }
          },
          _count: {
            select: { expenses: true }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      let hasPermission = false;

      // Check if user is the report owner (always has ADMIN privileges)
      if (category.report.owner_id === user.id) {
        hasPermission = true;
      } else {
        // Check if user has ADMIN permission on this category (recursively)
        const hasAdminPermission = await checkCategoryPermission(user.id, categoryIdInt, 'ADMIN');
        if (hasAdminPermission) {
          hasPermission = true;
        } else if (category.parent_category_id) {
          // Special case for REVIEWER: can delete empty subcategories
          // Check if user has REVIEWER permission on the parent category (directly or inherited)
          const hasReviewerOnParent = await checkCategoryPermission(
            user.id,
            category.parent_category_id,
            'REVIEWER'
          );

          if (hasReviewerOnParent) {
            // This is a subcategory and user has REVIEWER permission on parent
            // Check if the category has no expenses
            if (category._count.expenses === 0) {
              hasPermission = true;
            } else {
              return res.status(403).json({
                error: 'Forbidden',
                message: 'Cannot delete subcategory that contains expenses'
              });
            }
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions to delete this category'
        });
      }

      // Add user info to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking category deletion permissions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware specifically for category editing that allows:
 * - ADMIN users to edit any category they have access to
 * - REVIEWER users to edit subcategories of categories shared with them
 */
const checkCategoryEditPermissions = () => {
  return async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      const categoryIdInt = parseInt(categoryId);
      if (isNaN(categoryIdInt)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid category ID'
        });
      }

      // Get the category with necessary information
      const category = await prisma.category.findUnique({
        where: { id: categoryIdInt },
        include: {
          report: true,
          permissions: {
            where: { user_id: user.id }
          },
          parent_category: {
            include: {
              permissions: {
                where: { user_id: user.id }
              },
              report: true
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

      let hasPermission = false;

      // Check if user is the report owner (always has ADMIN privileges)
      if (category.report.owner_id === user.id) {
        hasPermission = true;
      } else {
        // Check if user has ADMIN permission on this category (recursively)
        const hasAdminPermission = await checkCategoryPermission(user.id, categoryIdInt, 'ADMIN');
        if (hasAdminPermission) {
          hasPermission = true;
        } else if (category.parent_category_id) {
          // Special case for REVIEWER: can edit subcategories
          // Check if user has REVIEWER permission on the parent category (directly or inherited)
          const hasReviewerOnParent = await checkCategoryPermission(
            user.id,
            category.parent_category_id,
            'REVIEWER'
          );

          if (hasReviewerOnParent) {
            // This is a subcategory and user has REVIEWER permission on parent
            hasPermission = true;
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions to edit this category'
        });
      }

      // Add user info to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking category edit permissions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Recursively check if a user has the required permission on a category or any of its parents
 * @param {number} userId - The user's database ID
 * @param {number} categoryId - The category ID to check
 * @param {string} requiredRole - The minimum role required
 * @returns {Promise<boolean>} Whether the user has the required permission
 */
async function checkCategoryPermission(userId, categoryId, requiredRole) {
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
      return await checkCategoryPermission(userId, category.parent_category_id, requiredRole);
    }

    return false;
  } catch (error) {
    console.error('Error in checkCategoryPermission:', error);
    return false;
  }
}

/**
 * Middleware to check if user has view permission on a category/report
 * View permission is granted if user has any role on the category/report or is the report owner
 */
const checkViewPermission = () => {
  return async (req, res, next) => {
    try {
      const { categoryId, reportId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      let hasViewPermission = false;

      if (categoryId) {
        // Check if user has any permission on this category or its parents
        const categoryIdInt = parseInt(categoryId);
        if (isNaN(categoryIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid category ID'
          });
        }

        // First check if category exists
        const category = await prisma.category.findUnique({
          where: { id: categoryIdInt }
        });

        if (!category) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Category not found'
          });
        }

        hasViewPermission = await checkCategoryPermission(user.id, categoryIdInt, 'SUBMITTER');
      } else if (reportId) {
        // Check if user is the owner of the report or has any permissions on any categories in the report
        const reportIdInt = parseInt(reportId);
        if (isNaN(reportIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid report ID'
          });
        }

        const report = await prisma.report.findUnique({
          where: { id: reportIdInt },
          include: {
            categories: {
              include: {
                permissions: {
                  where: { user_id: user.id }
                }
              }
            }
          }
        });

        if (!report) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Report not found'
          });
        }

        // User has view permission if they own the report or have permission on any category
        hasViewPermission =
          report.owner_id === user.id ||
          report.categories.some((cat) => cat.permissions.length > 0);
      }

      if (!hasViewPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'No permission to view this resource'
        });
      }

      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking view permission:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if user has review permission on an expense
 * This middleware looks up the expense to find its category and checks permissions accordingly
 * Report owners automatically have review permissions on all expenses in their reports
 */
const checkExpenseReviewPermission = () => {
  return async (req, res, next) => {
    try {
      const { expenseId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      // Validate expenseId
      const expenseIdInt = parseInt(expenseId);
      if (isNaN(expenseIdInt)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid expense ID'
        });
      }

      // Get the expense with its category and report information
      const expense = await prisma.expense.findUnique({
        where: { id: expenseIdInt },
        include: {
          category: {
            include: {
              report: true
            }
          }
        }
      });

      if (!expense) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Expense not found'
        });
      }

      let hasPermission = false;

      // Check if user is the report owner (report owners have full permissions)
      const isReportOwner = expense.category?.report?.owner_id === user.id;
      if (isReportOwner) {
        hasPermission = true;
      } else if (expense.category_id) {
        // Check if user has REVIEWER or ADMIN role on the expense's category
        hasPermission = await checkCategoryPermission(user.id, expense.category_id, 'REVIEWER');
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions. REVIEWER role required.'
        });
      }

      // Add user info to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking expense review permission:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if user has submit permission on a category
 * Submit permission is granted for SUBMITTER, REVIEWER, or ADMIN roles
 */
const checkSubmitPermission = () => {
  return checkPermissions('SUBMITTER');
};

/**
 * Middleware to check if user can create categories
 * Category creation is allowed for ADMIN users or REVIEWER users creating subcategories
 */
const checkCategoryCreationPermissions = () => {
  return async (req, res, next) => {
    try {
      const { reportId } = req.params;
      const userFirebaseUid = req.user.uid;

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

      let hasPermission = false;

      // Check if user is the owner of the report (for creating root categories)
      const reportIdInt = parseInt(reportId);
      if (isNaN(reportIdInt)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid report ID'
        });
      }

      const report = await prisma.report.findUnique({
        where: { id: reportIdInt }
      });

      if (!report) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Report not found'
        });
      }

      // Report owner has ADMIN privileges on all categories within their report
      hasPermission = report.owner_id === user.id;

      // If not report owner, check if creating a subcategory with parentCategoryId
      if (!hasPermission && req.body.parentCategoryId) {
        const parentCategoryId = parseInt(req.body.parentCategoryId);
        if (!isNaN(parentCategoryId)) {
          // Check if user has ADMIN or REVIEWER permission on the parent category
          // REVIEWER users can create subcategories
          hasPermission = await checkCategoryPermission(user.id, parentCategoryId, 'REVIEWER');
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message:
            'Insufficient permissions to create categories. ADMIN role required for root categories, or REVIEWER+ role on parent category for subcategories.'
        });
      }

      // Add user info to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Error checking category creation permissions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if user has view/review permission on a category
 * View/review permission is granted for REVIEWER or ADMIN roles only (not SUBMITTER)
 */
const checkReviewPermission = () => {
  return checkPermissions('REVIEWER');
};

module.exports = {
  checkPermissions,
  checkViewPermission,
  checkSubmitPermission,
  checkReviewPermission,
  checkExpenseReviewPermission,
  checkCategoryDeletionPermissions,
  checkCategoryEditPermissions,
  checkCategoryCreationPermissions
};

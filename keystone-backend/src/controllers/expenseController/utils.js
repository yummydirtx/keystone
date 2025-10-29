const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (uid) => {
  return await prisma.user.findUnique({
    where: { firebase_uid: uid }
  });
};

/**
 * Validate if user exists and return user or error response
 */
const validateUser = async (uid, res) => {
  const user = await getUserByFirebaseUid(uid);
  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found. Please sync your account first.'
    });
    return null;
  }
  return user;
};

/**
 * Validate expense ID parameter
 */
const validateExpenseId = (expenseId, res) => {
  const expenseIdInt = parseInt(expenseId);
  if (isNaN(expenseIdInt)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid expense ID'
    });
    return null;
  }
  return expenseIdInt;
};

/**
 * Recursively check if a user has the required permission on a category or any of its parents
 */
const checkCategoryPermissionRecursive = async (userId, categoryId, requiredRole) => {
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
      return await checkCategoryPermissionRecursive(
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
};

/**
 * Get user's role for a category (checking hierarchy)
 */
const getUserRoleForCategory = async (userId, categoryId) => {
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
};

/**
 * Validate category permissions for a user
 */
const checkCategoryPermissions = async (categoryId, userId, requiredRole = null) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      report: true,
      permissions: {
        where: { user_id: userId }
      }
    }
  });

  if (!category) {
    return { hasPermission: false, category: null, error: 'Category not found' };
  }

  const isReportOwner = category.report.owner_id === userId;
  let hasPermission = isReportOwner;
  let userRole = isReportOwner ? 'ADMIN' : null;

  if (!hasPermission) {
    // Get the user's role and check if it meets the required role
    userRole = await getUserRoleForCategory(userId, categoryId);
    if (userRole) {
      const roleToCheck = requiredRole || 'SUBMITTER';
      hasPermission = await checkCategoryPermissionRecursive(userId, categoryId, roleToCheck);
    }
  }

  const userPermission = category.permissions[0];
  return { hasPermission, category, isReportOwner, userPermission, userRole };
};

/**
 * Get all subcategory IDs recursively
 */
const getAllSubcategoryIds = async (parentId) => {
  const subcategories = await prisma.category.findMany({
    where: { parent_category_id: parentId },
    select: { id: true }
  });

  let allIds = [parentId];
  for (const subcat of subcategories) {
    const subIds = await getAllSubcategoryIds(subcat.id);
    allIds = allIds.concat(subIds);
  }

  return allIds;
};

/**
 * Format expense object for API response
 */
const formatExpenseResponse = (expense) => ({
  id: expense.id,
  description: expense.description,
  amount: parseFloat(expense.amount),
  status: expense.status,
  items: expense.items,
  notes: expense.notes,
  receipt_url: expense.receipt_url,
  transaction_date: expense.transaction_date,
  guest_name: expense.guest_name,
  guest_email: expense.guest_email,
  category: expense.category,
  submitter: expense.submitter,
  report: expense.report,
  approvals: expense.approvals,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

module.exports = {
  prisma,
  getUserByFirebaseUid,
  validateUser,
  validateExpenseId,
  checkCategoryPermissions,
  checkCategoryPermissionRecursive,
  getUserRoleForCategory,
  getAllSubcategoryIds,
  formatExpenseResponse
};

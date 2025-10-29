const prisma = require('../../config/database');

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (uid) => {
  return await prisma.user.findUnique({
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
};

/**
 * Validate category ID parameter
 */
const validateCategoryId = (categoryId, res) => {
  const categoryIdInt = parseInt(categoryId);
  if (isNaN(categoryIdInt)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid category ID'
    });
    return null;
  }
  return categoryIdInt;
};

/**
 * Validate report ID parameter
 */
const validateReportId = (reportId, res) => {
  const reportIdInt = parseInt(reportId);
  if (isNaN(reportIdInt)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid report ID'
    });
    return null;
  }
  return reportIdInt;
};

/**
 * Validate category name
 */
const validateCategoryName = (name, res) => {
  if (!name || !name.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Category name is required'
    });
    return null;
  }
  return name.trim();
};

/**
 * Calculate spending totals for a category including all subcategories recursively
 */
const calculateCategorySpending = async (categoryId) => {
  try {
    // Get all subcategory IDs recursively using the existing function from expense utils
    const { getAllSubcategoryIds } = require('../expenseController/utils');
    const allCategoryIds = await getAllSubcategoryIds(categoryId);

    // Calculate total spent amount for this category and all subcategories
    // APPROVED and REIMBURSED expenses count as "spent"
    const spentResult = await prisma.expense.aggregate({
      where: {
        category_id: { in: allCategoryIds },
        status: { in: ['APPROVED', 'REIMBURSED'] }
      },
      _sum: {
        amount: true
      }
    });

    const spentAmount = spentResult._sum.amount || 0;

    return parseFloat(spentAmount.toString());
  } catch (error) {
    console.error('Error calculating category spending:', error);
    return 0;
  }
};

/**
 * Format category object for API response
 */
const formatCategoryResponse = async (category) => {
  const spentAmount = await calculateCategorySpending(category.id);
  const budget = parseFloat((category.budget || 0).toString());
  const spentPercentage = budget > 0 ? Math.round((spentAmount / budget) * 100) : 0;

  return {
    id: category.id,
    name: category.name,
    budget: category.budget,
    spentAmount: spentAmount,
    spentPercentage: spentPercentage,
    require_receipt: category.require_receipt,
    allow_guest_submissions: category.allow_guest_submissions,
    allow_user_submissions: category.allow_user_submissions,
    parentCategory: category.parent_category,
    children: category.child_categories || [],
    report: category.report,
    expensesCount: category._count?.expenses,
    subcategoriesCount: category._count?.child_categories,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
};

/**
 * Build hierarchical category structure
 */
const buildCategoryHierarchy = async (categories) => {
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map of all categories with spending calculations
  for (const category of categories) {
    const spentAmount = await calculateCategorySpending(category.id);
    const budget = parseFloat((category.budget || 0).toString());
    const spentPercentage = budget > 0 ? Math.round((spentAmount / budget) * 100) : 0;

    const categoryData = {
      id: category.id,
      name: category.name,
      budget: category.budget,
      spentAmount: spentAmount,
      spentPercentage: spentPercentage,
      require_receipt: category.require_receipt,
      allow_guest_submissions: category.allow_guest_submissions,
      allow_user_submissions: category.allow_user_submissions,
      parentCategory: category.parent_category,
      children: [],
      expensesCount: category._count.expenses,
      subcategoriesCount: category._count.child_categories,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };
    categoryMap.set(category.id, categoryData);
  }

  // Second pass: build hierarchy
  categories.forEach((category) => {
    const categoryData = categoryMap.get(category.id);

    if (category.parent_category_id) {
      // This is a child category
      const parent = categoryMap.get(category.parent_category_id);
      if (parent) {
        parent.children.push(categoryData);
      }
    } else {
      // This is a root category
      rootCategories.push(categoryData);
    }
  });

  return rootCategories;
};

/**
 * Validate category exists and user has access to it
 */
const validateCategory = async (categoryId, firebaseUid) => {
  try {
    // First get the user's integer ID from their Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      select: { id: true }
    });

    if (!user) {
      return null;
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        report: {
          owner_id: user.id
        }
      },
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

    return category;
  } catch (error) {
    console.error('Error validating category:', error);
    return null;
  }
};

/**
 * Helper function to get user's role for a category by checking parent hierarchy
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

module.exports = {
  prisma,
  getUserByFirebaseUid,
  validateCategoryId,
  validateReportId,
  validateCategoryName,
  validateCategory,
  getUserRoleForCategory,
  formatCategoryResponse,
  buildCategoryHierarchy,
  calculateCategorySpending
};

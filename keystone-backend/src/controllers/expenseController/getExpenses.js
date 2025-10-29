const {
  prisma,
  validateUser,
  validateExpenseId,
  checkCategoryPermissions,
  getAllSubcategoryIds,
  formatExpenseResponse
} = require('./utils');

/**
 * Get expenses for a category and its sub-categories
 * GET /api/categories/:categoryId/expenses
 */
const getCategoryExpenses = async (req, res) => {
  try {
    const { uid } = req.user;
    const { categoryId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    // Validate categoryId
    const categoryIdInt = parseInt(categoryId);
    if (isNaN(categoryIdInt)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Check category permissions
    const { hasPermission, category, error } = await checkCategoryPermissions(
      categoryIdInt,
      user.id
    );

    if (!hasPermission) {
      return res.status(error === 'Category not found' ? 404 : 403).json({
        error: error === 'Category not found' ? 'Not Found' : 'Forbidden',
        message:
          error === 'Category not found'
            ? error
            : 'You do not have permission to view expenses for this category'
      });
    }

    // Get all subcategory IDs recursively
    const categoryIds = await getAllSubcategoryIds(categoryIdInt);

    // Build query filters
    const whereClause = {
      category_id: { in: categoryIds }
    };

    if (status) {
      whereClause.status = status;
    }

    // Get total count for pagination
    const totalExpenses = await prisma.expense.count({
      where: whereClause
    });

    // Calculate pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    const totalPages = Math.ceil(totalExpenses / limitInt);

    // Get expenses with pagination
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limitInt
    });

    res.status(200).json({
      expenses: expenses.map(formatExpenseResponse),
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalExpenses,
        totalPages,
        hasNextPage: pageInt < totalPages,
        hasPreviousPage: pageInt > 1
      },
      category: {
        id: category.id,
        name: category.name
      }
    });
  } catch (error) {
    console.error('Error fetching category expenses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch expenses'
    });
  }
};

/**
 * Get a specific expense by ID
 * GET /api/expenses/:expenseId
 */
const getExpense = async (req, res) => {
  try {
    const { uid } = req.user;
    const { expenseId } = req.params;

    // Validate expenseId
    const expenseIdInt = validateExpenseId(expenseId, res);
    if (!expenseIdInt) return;

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Get the expense with all related data
    const expense = await prisma.expense.findUnique({
      where: { id: expenseIdInt },
      include: {
        category: {
          include: {
            report: true
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        report: {
          select: {
            id: true,
            name: true
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

    // Check if user has permission to view this expense
    const isSubmitter = expense.submitter_id === user.id;

    let hasPermission = isSubmitter;

    // If user is not the submitter, check category permissions (only if category exists)
    if (!hasPermission && expense.category_id) {
      const { hasPermission: hasCategoryPermission } = await checkCategoryPermissions(
        expense.category_id,
        user.id,
        'SUBMITTER' // Minimum permission level needed to view expenses
      );
      hasPermission = hasCategoryPermission;
    }

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No permission to view this resource'
      });
    }

    res.status(200).json({
      message: 'Expense retrieved successfully',
      expense: {
        ...formatExpenseResponse(expense),
        category: expense.category
          ? {
              id: expense.category.id,
              name: expense.category.name
            }
          : null
      }
    });
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve expense'
    });
  }
};

module.exports = { getCategoryExpenses, getExpense };

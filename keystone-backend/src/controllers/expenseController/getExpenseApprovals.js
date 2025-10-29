const { prisma, validateUser, validateExpenseId, checkCategoryPermissions } = require('./utils');

/**
 * Get the approval history for a specific expense
 * GET /api/expenses/:expenseId/approvals
 */
const getExpenseApprovals = async (req, res) => {
  try {
    const { uid } = req.user;
    const { expenseId } = req.params;

    // Validate the incoming expense ID
    const expenseIdInt = validateExpenseId(expenseId, res);
    if (!expenseIdInt) return;

    // Get and validate the current user
    const user = await validateUser(uid, res);
    if (!user) return;

    // First, get the expense to find its category for permission checking
    const expense = await prisma.expense.findUnique({
      where: { id: expenseIdInt },
      select: {
        category_id: true,
        submitter_id: true
      }
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Expense not found'
      });
    }

    // Check if user has permission to view this expense (same logic as getExpense)
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
        message: 'You do not have permission to view this expense history'
      });
    }

    // Fetch all approval records for the given expense
    const approvals = await prisma.approval.findMany({
      where: {
        expense_id: expenseIdInt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Order chronologically for a clear history
      }
    });

    res.status(200).json({
      message: 'Approval history retrieved successfully',
      approvals: approvals
    });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve approval history'
    });
  }
};

module.exports = { getExpenseApprovals };

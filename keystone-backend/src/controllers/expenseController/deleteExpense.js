const { prisma, validateUser, validateExpenseId, checkCategoryPermissions } = require('./utils');
const { logDeletion } = require('../../utils/deletionLogger');

/**
 * Delete a specific expense
 * DELETE /api/expenses/:expenseId
 */
const deleteExpense = async (req, res) => {
  try {
    const { uid } = req.user;
    const { expenseId } = req.params;

    // Validate expenseId
    const expenseIdInt = validateExpenseId(expenseId, res);
    if (!expenseIdInt) return;

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Get the expense with category and report info
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

    // Check permissions
    const isSubmitter = expense.submitter_id === user.id;

    let hasReviewerPermission = false;

    // Check category permissions only if category exists
    if (expense.category_id) {
      const { hasPermission } = await checkCategoryPermissions(
        expense.category_id,
        user.id,
        'REVIEWER' // Need reviewer permission to delete others' expenses
      );
      hasReviewerPermission = hasPermission;
    }

    if (!isSubmitter && !hasReviewerPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this expense'
      });
    }

    // If user is submitter but not reviewer, only allow deletion if status is PENDING_REVIEW
    if (isSubmitter && !hasReviewerPermission && expense.status !== 'PENDING_REVIEW') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete expense after it has been reviewed'
      });
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id: expenseIdInt }
    });

    // Log the deletion for incremental updates
    await logDeletion('expense', expenseIdInt, user.id, {
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.category_id,
      reportId: expense.report_id
    });

    res.status(200).json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete expense'
    });
  }
};

module.exports = { deleteExpense };

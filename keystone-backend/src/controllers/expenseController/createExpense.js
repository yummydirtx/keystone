const {
  prisma,
  validateUser,
  checkCategoryPermissions,
  formatExpenseResponse
} = require('./utils');
const { notifyReportOwnerOnExpenseCreated } = require('../../services/notifications');

/**
 * Create a new expense
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
  try {
    const { uid } = req.user;
    const { description, amount, categoryId, items, notes, receiptUrl, transactionDate } = req.body;

    // Validate required fields
    if (!description || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Description and amount are required'
      });
    }

    // Validate amount is a positive number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Amount must be a positive number'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required'
      });
    }

    // Validate transaction date if provided
    let validTransactionDate = new Date();
    if (transactionDate) {
      const dateObj = new Date(transactionDate);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid date format'
        });
      }
      validTransactionDate = dateObj;
    }

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Check category permissions
    const { hasPermission, category, error, userRole } = await checkCategoryPermissions(
      parseInt(categoryId),
      user.id
    );

    if (!hasPermission) {
      return res.status(error === 'Category not found' ? 404 : 403).json({
        error: error === 'Category not found' ? 'Not Found' : 'Forbidden',
        message:
          error === 'Category not found'
            ? error
            : 'You do not have permission to submit expenses to this category'
      });
    }

    // Check if user submissions are allowed for this category
    if (!category.allow_user_submissions && userRole === 'SUBMITTER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User submissions are not allowed for this category'
      });
    }

    // Check receipt requirement for SUBMITTER users and guests
    if (category.require_receipt && (!receiptUrl || receiptUrl.trim() === '')) {
      // Only enforce receipt requirement for SUBMITTER users and guests
      if (userRole === 'SUBMITTER' || !user.id) { // guests don't have user.id
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This category requires a receipt to be uploaded for expense submission'
        });
      }
    }

    // Create the expense
    const newExpense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amount: numericAmount,
        category_id: parseInt(categoryId),
        report_id: category.report_id,
        submitter_id: user.id,
        items: items || null,
        notes: notes?.trim() || null,
        receipt_url: receiptUrl || null,
        transaction_date: validTransactionDate,
        status: 'PENDING_REVIEW'
      },
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
        report: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Fire-and-forget: notify reviewer+ (and not the actor)
    try {
      await notifyReportOwnerOnExpenseCreated(newExpense.report.id, {
        expenseId: newExpense.id,
        description: newExpense.description,
        amount: String(newExpense.amount),
        categoryName: newExpense.category?.name,
        submitterName: newExpense.submitter?.name || newExpense.submitter?.email || 'User',
        categoryId: newExpense.category?.id || newExpense.category_id || parseInt(categoryId),
        submitterUserId: newExpense.submitter?.id || newExpense.submitter_id || user.id
      });
    } catch (notifyErr) {
      console.warn('Notification (expense created) failed:', notifyErr?.message || notifyErr);
    }

    res.status(201).json({
      message: 'Expense created successfully',
      expense: formatExpenseResponse(newExpense)
    });
  } catch (error) {
    console.error('Error creating expense:', error);

    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category or report reference'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create expense'
    });
  }
};

module.exports = { createExpense };

const {
  prisma,
  validateUser,
  validateExpenseId,
  formatExpenseResponse,
  checkCategoryPermissions
} = require('./utils');
const { notifySubmitterOnStatusChange } = require('../../services/notifications');

/**
 * Update expense status (approval endpoint)
 * PUT /api/expenses/:expenseId/status
 */
const updateExpenseStatus = async (req, res) => {
  try {
    const { uid } = req.user;
    const { expenseId } = req.params;
    const { status, notes } = req.body;

    // Validate expenseId
    const expenseIdInt = validateExpenseId(expenseId, res);
    if (!expenseIdInt) return;

    // Validate status
    const validStatuses = ['PENDING_REVIEW', 'PENDING_ADMIN', 'APPROVED', 'DENIED', 'REIMBURSED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Get the expense and related data
    const expense = await prisma.expense.findUnique({
      where: { id: expenseIdInt },
      include: {
        category: {
          include: {
            report: true,
            permissions: {
              where: { user_id: user.id }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
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

    // Check if user has permission to update expense status
    let hasReviewerPermission = false;
    let hasAdminPermission = false;

    if (expense.category_id) {
      const { hasPermission: reviewerPerm } = await checkCategoryPermissions(
        expense.category_id,
        user.id,
        'REVIEWER'
      );
      hasReviewerPermission = reviewerPerm;

      const { hasPermission: adminPerm } = await checkCategoryPermissions(
        expense.category_id,
        user.id,
        'ADMIN'
      );
      hasAdminPermission = adminPerm;
    }

    // Prevent users from approving their own expenses (unless they're the report owner or have admin permissions)
    const isReportOwner = expense.category?.report?.owner_id === user.id;
    if (expense.submitter_id === user.id && !isReportOwner && !hasAdminPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot approve your own expenses'
      });
    }

    if (!hasReviewerPermission && !isReportOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this expense status'
      });
    }

    // Override status logic: REVIEWERs can only move expenses to PENDING_ADMIN, not APPROVED
    let finalStatus = status;
    if (status === 'APPROVED' && !hasAdminPermission && !isReportOwner) {
      finalStatus = 'PENDING_ADMIN';
    }

    // Update expense status and create approval record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id: expenseIdInt },
        data: {
          status: finalStatus,
          updatedAt: new Date()
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

      const approval = await tx.approval.create({
        data: {
          status_change: finalStatus,
          notes: notes?.trim() || null,
          expense_id: expenseIdInt,
          user_id: user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return { updatedExpense, approval };
    });

    // Fire-and-forget: notify submitter if status is APPROVED or DENIED
    try {
      const reviewerName =
        result.approval?.user?.name || result.approval?.user?.email || 'Reviewer';
      await notifySubmitterOnStatusChange(
        result.updatedExpense.submitter?.id || result.updatedExpense.submitter_id || null,
        {
          expenseId: result.updatedExpense.id,
          status: result.updatedExpense.status,
          description: result.updatedExpense.description,
          categoryName: result.updatedExpense.category?.name,
          reportId: result.updatedExpense.report?.id,
          reviewerName
        }
      );
    } catch (notifyErr) {
      console.warn('Notification (expense status change) failed:', notifyErr?.message || notifyErr);
    }

    res.status(200).json({
      message: 'Expense status updated successfully',
      expense: formatExpenseResponse(result.updatedExpense),
      approval: {
        id: result.approval.id,
        status_change: result.approval.status_change,
        notes: result.approval.notes,
        user: result.approval.user,
        createdAt: result.approval.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating expense status:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid expense reference'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update expense status'
    });
  }
};

/**
 * Update a specific expense
 * PUT /api/expenses/:expenseId
 */
const updateExpense = async (req, res) => {
  try {
    const { uid } = req.user;
    const { expenseId } = req.params;
    const { description, amount, notes, receiptUrl, transactionDate, categoryId } = req.body;

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
        'REVIEWER' // Need reviewer permission to update others' expenses
      );
      hasReviewerPermission = hasPermission;
    }

    // For category changes, need to check permissions on both old and new categories
    let canChangeCategory = false;
    if (categoryId !== undefined && categoryId !== expense.category_id) {
      // Check if user has ADMIN permissions on current category (to move from)
      let hasAdminOnCurrentCategory = false;
      if (expense.category_id) {
        const { hasPermission: hasAdminCurrent } = await checkCategoryPermissions(
          expense.category_id,
          user.id,
          'ADMIN'
        );
        hasAdminOnCurrentCategory = hasAdminCurrent;
      }

      // Check if user has SUBMITTER+ permissions on target category (to move to)
      let hasPermissionOnTargetCategory = false;
      if (categoryId) {
        const categoryIdInt = parseInt(categoryId);
        if (isNaN(categoryIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid category ID'
          });
        }
        
        // Verify target category exists and is in the same workspace
        const targetCategory = await prisma.category.findUnique({
          where: { id: categoryIdInt },
          include: { report: true }
        });

        if (!targetCategory) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Target category not found'
          });
        }

        // Check if target category is in the same workspace as the expense
        if (targetCategory.report_id !== expense.report_id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Cannot move expense to a category in a different workspace'
          });
        }

        // Check if target category allows expense submissions
        if (!targetCategory.allow_user_submissions) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Target category does not allow expense submissions'
          });
        }
        
        // Check permissions on target category
        const { hasPermission: hasTargetPermission } = await checkCategoryPermissions(
          categoryIdInt,
          user.id,
          'SUBMITTER' // Need at least submitter permission to move expense to this category
        );
        hasPermissionOnTargetCategory = hasTargetPermission;
      }

      // User can change category if:
      // 1. They are the submitter AND expense is PENDING_REVIEW AND they have permission on target category
      // 2. They have ADMIN permission on current category AND permission on target category
      if (isSubmitter && expense.status === 'PENDING_REVIEW' && hasPermissionOnTargetCategory) {
        canChangeCategory = true;
      } else if (hasAdminOnCurrentCategory && hasPermissionOnTargetCategory) {
        canChangeCategory = true;
      }

      if (!canChangeCategory) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to move this expense to the selected category'
        });
      }
    }

    if (!isSubmitter && !hasReviewerPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to update this expense'
      });
    }

    if (isSubmitter && !hasReviewerPermission && expense.status !== 'PENDING_REVIEW') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot update expense after it has been reviewed'
      });
    }

    // Prepare update data
    const updateData = {};

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (amount !== undefined) {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Amount must be a positive number'
        });
      }
      updateData.amount = numericAmount;
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    if (receiptUrl !== undefined) {
      updateData.receipt_url = receiptUrl || null;
    }

    if (transactionDate !== undefined) {
      if (transactionDate) {
        const dateObj = new Date(transactionDate);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid date format'
          });
        }
        updateData.transaction_date = dateObj;
      } else {
        updateData.transaction_date = new Date();
      }
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') {
        updateData.category_id = null;
      } else {
        const categoryIdInt = parseInt(categoryId);
        if (isNaN(categoryIdInt)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid category ID'
          });
        }
        updateData.category_id = categoryIdInt;
      }
    }

    // Update the expense
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseIdInt },
      data: updateData,
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

    res.status(200).json({
      message: 'Expense updated successfully',
      expense: formatExpenseResponse(updatedExpense)
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update expense'
    });
  }
};

module.exports = { updateExpenseStatus, updateExpense };

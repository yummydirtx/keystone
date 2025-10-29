const { createExpense } = require('./createExpense');
const { getCategoryExpenses, getExpense } = require('./getExpenses');
const { updateExpenseStatus, updateExpense } = require('./updateExpense');
const { deleteExpense } = require('./deleteExpense');
const { getUserExpenses } = require('./getUserExpenses');
const { getExpensesAwaitingReview } = require('./getExpensesAwaitingReview');
const { getExpenseApprovals } = require('./getExpenseApprovals');

/**
 * GET /api/expenses/receipt-url/:filePath
 * Generate a signed URL for a Firebase Storage receipt file
 * Requires authentication and appropriate permissions
 */
const getReceiptSignedUrl = async (req, res) => {
  try {
    const { uid } = req.user;
    const filePath = req.params.filePath;

    console.log('User signed URL request:', {
      filePath,
      uid
    });

    // Validate file path
    if (!filePath || !filePath.startsWith('receipts/')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid file path'
      });
    }

    // For regular users, check if they can access this file
    const isOwnFile = filePath.includes(`receipts/${uid}/`);
    const isGuestFile = filePath.includes('receipts/guest_user_system/');

    console.log('File access check:', {
      isOwnFile,
      isGuestFile,
      filePath,
      uid,
      expectedPath: `receipts/${uid}/`
    });

    // Always check category permissions for non-guest files
    // (This handles both own files and files from other users in shared categories)
    if (!isGuestFile) {
      const { prisma } = require('./utils');

      try {
        console.log(`Looking for expense with receipt_url: ${filePath}`);
        const expense = await prisma.expense.findFirst({
          where: {
            receipt_url: filePath
          },
          include: {
            category: true
          }
        });

        console.log(
          'Found expense:',
          expense
            ? {
                id: expense.id,
                category_id: expense.category_id,
                category_name: expense.category?.name
              }
            : null
        );

        if (!expense) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Receipt not found or not associated with any expense'
          });
        }

        // First get the user ID from Firebase UID
        const { getUserByFirebaseUid, checkCategoryPermissionRecursive } = require('./utils');
        const user = await getUserByFirebaseUid(uid);

        if (!user) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'User not found'
          });
        }

        // Use recursive permission checking for REVIEWER access (minimum required to view receipts)
        const hasPermission = await checkCategoryPermissionRecursive(
          user.id,
          expense.category_id,
          'REVIEWER'
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'No permission to access this file'
          });
        }
      } catch (error) {
        console.error('Error checking category permissions for receipt:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Unable to verify permissions'
        });
      }
    }

    // Get Firebase Storage bucket using Admin SDK
    const admin = require('../../config/firebase');
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Receipt file not found'
      });
    }

    // Generate signed URL with 1 hour expiration
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour from now
    });

    console.log('Generated signed URL for:', filePath);

    return res.json({
      signedUrl: signedUrl
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to generate signed URL'
    });
  }
};

// Keep the old endpoint for backward compatibility, but deprecate it
const getSecureFile = async (req, res) => {
  console.warn(
    'DEPRECATED: /api/expenses/file/:filePath endpoint is deprecated. Use /api/expenses/receipt-url/:filePath instead'
  );
  return getReceiptSignedUrl(req, res);
};

module.exports = {
  createExpense,
  getCategoryExpenses,
  getExpense,
  updateExpenseStatus,
  updateExpense,
  deleteExpense,
  getUserExpenses,
  getExpensesAwaitingReview,
  getExpenseApprovals,
  getSecureFile,
  getReceiptSignedUrl
};

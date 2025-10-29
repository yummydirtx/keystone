const express = require('express');
const router = express.Router();
const verifyAuth = require('../middleware/verifyAuth');
const {
  checkViewPermission,
  checkSubmitPermission,
  checkReviewPermission,
  checkExpenseReviewPermission
} = require('../middleware/checkPermissions');
const {
  createExpense,
  getCategoryExpenses,
  updateExpenseStatus,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseApprovals, // Import the new controller
  getSecureFile, // Import the secure file function (deprecated)
  getReceiptSignedUrl // Import the new signed URL function
} = require('../controllers/expenseController');

// All expense routes require authentication
router.use(verifyAuth);

// POST /api/expenses - Create a new expense (requires submit permission)
router.post('/', checkSubmitPermission(), createExpense);

// GET /api/expenses/:expenseId - Get a specific expense (permission checked in controller)
router.get('/:expenseId', getExpense);

// GET /api/expenses/:expenseId/approvals - Get the approval history for an expense
router.get('/:expenseId/approvals', getExpenseApprovals);

// PUT /api/expenses/:expenseId - Update a specific expense (permission checked in controller)
router.put('/:expenseId', updateExpense);

// DELETE /api/expenses/:expenseId - Delete a specific expense (permission checked in controller)
router.delete('/:expenseId', deleteExpense);

// PUT /api/expenses/:expenseId/status - Update expense status (requires review permission)
router.put('/:expenseId/status', verifyAuth, updateExpenseStatus);

// Generate signed URLs for receipt access (preferred method)
router.get('/receipt-url/:filePath', verifyAuth, getReceiptSignedUrl);

// Secure file access for authenticated users (deprecated - use receipt-url instead)
router.get('/file/:filePath', verifyAuth, getSecureFile);

module.exports = router;

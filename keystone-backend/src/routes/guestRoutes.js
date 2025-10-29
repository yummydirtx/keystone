const express = require('express');
const verifyGuestToken = require('../middleware/verifyGuestToken');
const guestController = require('../controllers/guestController');

const router = express.Router();

/**
 * GET /api/guest?token=...
 * Fetch data for a guest based on their permission level
 *
 * For SUBMIT_ONLY: Returns category info and submission form structure
 * For REVIEW_ONLY: Returns category info and pending expenses for review
 */
router.get('/', verifyGuestToken('SUBMIT_ONLY'), guestController.getGuestData);

/**
 * POST /api/guest?token=...
 * Submit expense data as a guest
 * Requires SUBMIT_ONLY or higher permission
 */
router.post('/', verifyGuestToken('SUBMIT_ONLY'), guestController.submitGuestExpense);

/**
 * POST /api/guest/signed-upload-url?token=...
 * Generate a signed URL for guest users to upload receipts directly to Firebase Storage
 * Requires SUBMIT_ONLY or higher permission
 */
router.post(
  '/signed-upload-url',
  verifyGuestToken('SUBMIT_ONLY'),
  guestController.getSignedUploadUrl
);

/**
 * GET /api/guest/receipt-url/:filePath?token=...
 * Generate a signed URL for a Firebase Storage receipt file
 * Requires REVIEW_ONLY or higher permission for guest users
 */
router.get(
  '/receipt-url/:filePath',
  verifyGuestToken('REVIEW_ONLY'),
  guestController.getGuestReceiptSignedUrl
);

/**
 * GET /api/guest/file/:filePath?token=... (DEPRECATED)
 * Securely access a Firebase Storage file if user has permissions
 * Requires REVIEW_ONLY or higher permission for guest users
 */
router.get('/file/:filePath', verifyGuestToken('REVIEW_ONLY'), guestController.getSecureFile);

/**
 * GET /api/guest/category/:categoryId?token=...
 * Get specific category data for guests with REVIEW_ONLY permission
 * Allows guests to navigate between categories within the same report
 */
router.get(
  '/category/:categoryId',
  verifyGuestToken('REVIEW_ONLY'),
  guestController.getGuestCategoryData
);

/**
 * GET /api/guest/expenses/:expenseId?token=...
 * Get specific expense details for guests with REVIEW_ONLY permission
 * Allows guests to view individual expense details within authorized categories
 */
router.get(
  '/expenses/:expenseId',
  verifyGuestToken('REVIEW_ONLY'),
  guestController.getGuestExpenseDetail
);

/**
 * PUT /api/guest/expenses/:expenseId?token=...
 * Update expense status as a guest reviewer
 * Requires REVIEW_ONLY permission
 */
router.put(
  '/expenses/:expenseId',
  verifyGuestToken('REVIEW_ONLY'),
  guestController.updateExpenseStatus
);

module.exports = router;

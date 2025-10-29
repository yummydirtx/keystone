const express = require('express');
const router = express.Router();
const verifyAuth = require('../middleware/verifyAuth');
const {
  checkPermissions,
  checkViewPermission,
  checkReviewPermission,
  checkCategoryDeletionPermissions,
  checkCategoryEditPermissions
} = require('../middleware/checkPermissions');
const {
  updateCategory,
  getCategory,
  deleteCategory,
  updateCategoryOptions
} = require('../controllers/categoryController');
const { getCategoryExpenses } = require('../controllers/expenseController');
const {
  grantPermission,
  revokePermission,
  createShareLink,
  getCategoryPermissions,
  getGuestLinksForCategory
} = require('../controllers/permissionsController');

// Apply authentication middleware to all category routes
router.use(verifyAuth);

// PUT /api/categories/:categoryId - Update a category (requires ADMIN role or REVIEWER for subcategories)
router.put('/:categoryId', checkCategoryEditPermissions(), updateCategory);

// DELETE /api/categories/:categoryId - Delete a category (requires ADMIN role or REVIEWER for empty subcategories)
router.delete('/:categoryId', checkCategoryDeletionPermissions(), deleteCategory);

// GET /api/categories/:categoryId - Get a specific category (requires view permission)
router.get('/:categoryId', checkViewPermission(), getCategory);

// GET /api/categories/:categoryId/expenses - Get expenses for a category (requires review permission - SUBMITTER users cannot view others' expenses)
router.get('/:categoryId/expenses', checkReviewPermission(), getCategoryExpenses);

// GET /api/categories/:categoryId/permissions - Get permissions for a category (requires ADMIN role)
router.get('/:categoryId/permissions', checkPermissions('ADMIN'), getCategoryPermissions);

// POST /api/categories/:categoryId/permissions - Grant permission on a category (requires ADMIN role)
router.post('/:categoryId/permissions', checkPermissions('ADMIN'), grantPermission);

// DELETE /api/categories/:categoryId/permissions/:userId - Revoke permission from a category (requires ADMIN role)
router.delete('/:categoryId/permissions/:userId', checkPermissions('ADMIN'), revokePermission);

// POST /api/categories/:categoryId/share-links - Create a shareable guest link (requires ADMIN role)
router.post('/:categoryId/share-links', checkPermissions('ADMIN'), createShareLink);

/**
 * @route GET /api/categories/:categoryId/guest-links
 * @description Get all active guest links for a specific category.
 * @access Private - Requires user to be authenticated and have at least REVIEWER permissions.
 */
router.get(
  '/:categoryId/guest-links',
  verifyAuth,
  checkPermissions('REVIEWER'), // Ensures only authorized users can see the links
  getGuestLinksForCategory
);

// PUT /api/categories/:categoryId/options - Update category options (requires ADMIN role)
router.put('/:categoryId/options', checkPermissions('ADMIN'), updateCategoryOptions);

module.exports = router;

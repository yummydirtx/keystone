const express = require('express');
const router = express.Router();
const verifyAuth = require('../middleware/verifyAuth');
const {
  syncUser,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser
} = require('../controllers/userController');
const { getUserExpenses, getExpensesAwaitingReview } = require('../controllers/expenseController');
const {
  getSharedCategories,
  getSubmitterCategories
} = require('../controllers/categoryController');

// All user routes require authentication
router.use(verifyAuth);

// POST /api/users/sync - Sync Firebase user to local database
router.post('/sync', syncUser);

// GET /api/users/me - Get current user profile
router.get('/me', getCurrentUser);

// GET /api/users/me/expenses - Get expenses for the current user
router.get('/me/expenses', getUserExpenses);

// GET /api/users/me/expenses/awaiting-review - Get expenses awaiting review that user can approve
router.get('/me/expenses/awaiting-review', getExpensesAwaitingReview);

// GET /api/users/me/categories - Get categories shared with the current user
router.get('/me/categories', getSharedCategories);

// GET /api/users/me/submitter-categories - Get all categories where user can submit (submitter+), expanded for subcategories
router.get('/me/submitter-categories', getSubmitterCategories);

// PUT /api/users/me - Update current user profile
router.put('/me', updateCurrentUser);

// DELETE /api/users/me - Delete current user account
router.delete('/me', deleteCurrentUser);

module.exports = router;

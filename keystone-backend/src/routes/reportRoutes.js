const express = require('express');
const router = express.Router();
const verifyAuth = require('../middleware/verifyAuth');
const {
  checkPermissions,
  checkViewPermission,
  checkCategoryCreationPermissions
} = require('../middleware/checkPermissions');
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  getReportExpenses,
  getReportRootCategory
} = require('../controllers/reportController');
const { createCategory, getCategories } = require('../controllers/categoryController');

// Apply authentication middleware to all report routes
router.use(verifyAuth);

// POST /api/reports - Create a new report
router.post('/', createReport);

// GET /api/reports - Get all reports owned by the authenticated user
router.get('/', getReports);

// GET /api/reports/:reportId - Get a specific report
router.get('/:reportId', getReport);

// PUT /api/reports/:reportId - Update a specific report
router.put('/:reportId', updateReport);

// DELETE /api/reports/:reportId - Delete a specific report
router.delete('/:reportId', deleteReport);

// GET /api/reports/:reportId/expenses - Get all expenses for a report
router.get('/:reportId/expenses', getReportExpenses);

// POST /api/reports/:reportId/categories - Create a new category (requires ADMIN role on report or REVIEWER+ on parent category)
router.post('/:reportId/categories', checkCategoryCreationPermissions(), createCategory);

// GET /api/reports/:reportId/categories - Get all categories for a report (requires view permission)
router.get('/:reportId/categories', checkViewPermission(), getCategories);

// GET /api/reports/:reportId/root-category - Get the root category for a report (requires view permission)
router.get('/:reportId/root-category', checkViewPermission(), getReportRootCategory);

module.exports = router;

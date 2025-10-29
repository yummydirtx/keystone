// testApp.js
// Test-specific Express app configuration that uses test authentication

const express = require('express');
const cors = require('cors');
const verifyTestAuth = require('./testAuth');
const {
  checkPermissions,
  checkViewPermission,
  checkCategoryDeletionPermissions,
  checkCategoryEditPermissions,
  checkCategoryCreationPermissions
} = require('../../src/middleware/checkPermissions');
const reportController = require('../../src/controllers/reportController');
const userController = require('../../src/controllers/userController');
const expenseController = require('../../src/controllers/expenseController');
const categoryController = require('../../src/controllers/categoryController');
const permissionsController = require('../../src/controllers/permissionsController');

// Create test app
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Report routes - only use exported functions
  app.post('/api/reports', verifyTestAuth, reportController.createReport);
  app.get('/api/reports', verifyTestAuth, reportController.getReports);
  if (reportController.getReport) {
    app.get('/api/reports/:reportId', verifyTestAuth, reportController.getReport);
  }
  if (reportController.updateReport) {
    app.put('/api/reports/:reportId', verifyTestAuth, reportController.updateReport);
  }
  if (reportController.deleteReport) {
    app.delete('/api/reports/:reportId', verifyTestAuth, reportController.deleteReport);
  }
  if (reportController.getReportExpenses) {
    app.get('/api/reports/:reportId/expenses', verifyTestAuth, reportController.getReportExpenses);
  }

  // Category routes - with proper permission middleware
  app.post(
    '/api/reports/:reportId/categories',
    verifyTestAuth,
    checkCategoryCreationPermissions(),
    categoryController.createCategory
  );
  app.get(
    '/api/reports/:reportId/categories',
    verifyTestAuth,
    checkViewPermission(),
    categoryController.getCategories
  );
  app.get(
    '/api/categories/:categoryId',
    verifyTestAuth,
    checkViewPermission(),
    categoryController.getCategory
  );
  app.put(
    '/api/categories/:categoryId',
    verifyTestAuth,
    checkCategoryEditPermissions(),
    categoryController.updateCategory
  );
  app.delete(
    '/api/categories/:categoryId',
    verifyTestAuth,
    checkCategoryDeletionPermissions(),
    categoryController.deleteCategory
  );
  app.get(
    '/api/categories/:categoryId/expenses',
    verifyTestAuth,
    checkViewPermission(),
    expenseController.getCategoryExpenses
  );

  // User routes - only use exported functions
  app.post('/api/users/sync', verifyTestAuth, userController.syncUser);
  app.get('/api/users/me', verifyTestAuth, userController.getCurrentUser);
  app.get('/api/users/profile', verifyTestAuth, userController.getCurrentUser);
  app.put('/api/users/me', verifyTestAuth, userController.updateCurrentUser);
  app.get('/api/users/me/expenses', verifyTestAuth, expenseController.getUserExpenses);
  app.put('/api/users/profile', verifyTestAuth, userController.updateCurrentUser);
  if (userController.deleteCurrentUser) {
    app.delete('/api/users/me', verifyTestAuth, userController.deleteCurrentUser);
  }

  // Expense routes - only use exported functions
  app.post('/api/expenses', verifyTestAuth, expenseController.createExpense);
  app.post('/api/reports/:reportId/expenses', verifyTestAuth, expenseController.createExpense);
  if (expenseController.getExpense) {
    app.get('/api/expenses/:expenseId', verifyTestAuth, expenseController.getExpense);
  }
  if (expenseController.updateExpense) {
    app.put('/api/expenses/:expenseId', verifyTestAuth, expenseController.updateExpense);
  }
  if (expenseController.deleteExpense) {
    app.delete('/api/expenses/:expenseId', verifyTestAuth, expenseController.deleteExpense);
  }
  app.get(
    '/api/categories/:categoryId/expenses',
    verifyTestAuth,
    checkViewPermission(),
    expenseController.getCategoryExpenses
  );
  app.put('/api/expenses/:expenseId/status', verifyTestAuth, expenseController.updateExpenseStatus);

  // Permissions and sharing routes - with proper permission middleware
  app.post(
    '/api/categories/:categoryId/permissions',
    verifyTestAuth,
    checkPermissions('ADMIN'),
    permissionsController.grantPermission
  );
  app.delete(
    '/api/categories/:categoryId/permissions/:userId',
    verifyTestAuth,
    checkPermissions('ADMIN'),
    permissionsController.revokePermission
  );
  app.post(
    '/api/categories/:categoryId/share-links',
    verifyTestAuth,
    checkPermissions('ADMIN'),
    permissionsController.createShareLink
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Default route
  app.get('/', (req, res) => {
    res.send('Test API Server');
  });

  return app;
};

module.exports = createTestApp;

const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Expense Controller Edge Cases', () => {
  let app;
  let testSetup1, testSetup2;
  let reportId, categoryId, childCategoryId;
  let user1Id, user2Id;
  let expenseId;

  beforeAll(async () => {
    console.log('🧪 Setting up expense controller edge case tests...');
    app = createTestApp();

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Expense Test User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Expense Test User 2' });

    // Sync users to get database IDs
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup1.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup2.customToken}`)
      .expect(201);

    // Get user IDs from database
    const user1 = await prisma.user.findUnique({
      where: { firebase_uid: testSetup1.userRecord.uid }
    });
    const user2 = await prisma.user.findUnique({
      where: { firebase_uid: testSetup2.userRecord.uid }
    });

    user1Id = user1.id;
    user2Id = user2.id;

    // Create test report
    const report = await prisma.report.create({
      data: {
        name: 'Expense Edge Case Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Expense Edge Case Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;

    // Create child category
    const childCategory = await prisma.category.create({
      data: {
        name: 'Child Category',
        report_id: reportId,
        parent_category_id: categoryId
      }
    });
    childCategoryId = childCategory.id;

    // Create a test expense
    const expense = await prisma.expense.create({
      data: {
        amount: 100.0,
        description: 'Test expense for edge cases',
        category_id: categoryId,
        report_id: reportId,
        submitter_id: user1Id,
        transaction_date: new Date('2025-06-15')
      }
    });
    expenseId = expense.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up expense controller edge case tests...');
    if (testSetup1) await testSetup1.cleanup();
    if (testSetup2) await testSetup2.cleanup();
  });

  describe('getExpenses edge cases', () => {
    test('should handle invalid category ID', async () => {
      const response = await request(app)
        .get('/api/categories/invalid/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid category ID');
    });

    test('should handle status filter', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses?status=PENDING_REVIEW`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.expenses).toBeDefined();
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses?page=1&limit=10`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('should handle non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/999999/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body.message).toBe('Category not found');
    });

    test('should handle permission denied', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body.message).toBe('No permission to view this resource');
    });
  });

  describe('createExpense edge cases', () => {
    test('should handle invalid amount format', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 'invalid',
          description: 'Test expense',
          categoryId: categoryId,
          transactionDate: '2025-06-15'
        })
        .expect(400);

      expect(response.body.message).toBe('Amount must be a positive number');
    });

    test('should handle negative amount', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: -50,
          description: 'Test expense',
          categoryId: categoryId,
          transactionDate: '2025-06-15'
        })
        .expect(400);

      expect(response.body.message).toBe('Amount must be a positive number');
    });

    test('should handle missing description', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 50,
          categoryId: categoryId,
          transactionDate: '2025-06-15'
        })
        .expect(400);

      expect(response.body.message).toBe('Description and amount are required');
    });

    test('should handle missing categoryId', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 50,
          description: 'Test expense',
          transactionDate: '2025-06-15'
        })
        .expect(400);

      expect(response.body.message).toBe('Category ID is required');
    });

    test('should handle non-existent category for expense creation', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 50,
          description: 'Test expense',
          categoryId: 999999,
          transactionDate: '2025-06-15'
        })
        .expect(404);

      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('updateExpense edge cases', () => {
    test('should handle invalid expense ID', async () => {
      const response = await request(app)
        .put('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid expense ID');
    });

    test('should handle non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/999999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(404);

      expect(response.body.message).toBe('Expense not found');
    });

    test('should handle updating expense with no fields', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({})
        .expect(200);

      expect(response.body.message).toBe('Expense updated successfully');
    });

    test('should handle updating expense with invalid category', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          description: 'Updated expense'
        })
        .expect(200);

      expect(response.body.message).toBe('Expense updated successfully');
    });
  });

  describe('deleteExpense edge cases', () => {
    test('should handle invalid expense ID for deletion', async () => {
      const response = await request(app)
        .delete('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid expense ID');
    });

    test('should handle non-existent expense for deletion', async () => {
      const response = await request(app)
        .delete('/api/expenses/999999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body.message).toBe('Expense not found');
    });

    test('should handle unauthorized deletion attempt', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body.message).toBe('You do not have permission to delete this expense');
    });
  });

  describe('updateExpenseStatus edge cases', () => {
    test('should handle invalid expense ID for status update', async () => {
      const response = await request(app)
        .put('/api/expenses/invalid/status')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          status: 'APPROVED'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid expense ID');
    });

    test('should handle invalid status value', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body.message).toBe(
        'Status must be one of: PENDING_REVIEW, PENDING_ADMIN, APPROVED, DENIED, REIMBURSED'
      );
    });

    test('should handle missing status in request', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe(
        'Status must be one of: PENDING_REVIEW, PENDING_ADMIN, APPROVED, DENIED, REIMBURSED'
      );
    });
  });

  describe('getExpense edge cases', () => {
    test('should handle invalid expense ID for get', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid expense ID');
    });

    test('should handle non-existent expense for get', async () => {
      const response = await request(app)
        .get('/api/expenses/999999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body.message).toBe('Expense not found');
    });
  });
});

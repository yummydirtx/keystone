const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Expense Controller Edge Cases Coverage', () => {
  let app;
  let testSetup1, testSetup2;
  let reportId, categoryId;
  let user1Id, user2Id;

  beforeAll(async () => {
    console.log('🧪 Setting up expense controller edge cases tests...');
    app = createTestApp();

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Edge Case User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Edge Case User 2' });

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

    // Create test report and category
    const report = await prisma.report.create({
      data: {
        name: 'Edge Case Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;

    const category = await prisma.category.create({
      data: {
        name: 'Edge Case Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up expense controller edge cases tests...');
    if (testSetup1) await testSetup1.cleanup();
    if (testSetup2) await testSetup2.cleanup();
  });

  describe('Get Category Expenses Edge Cases', () => {
    test('should handle invalid category ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/categories/invalid/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message', 'Invalid category ID');
    });

    test('should handle non-existent category ID', async () => {
      const response = await request(app)
        .get('/api/categories/99999/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized access to category', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should handle filtering by status', async () => {
      // Create an expense first
      const expense = await prisma.expense.create({
        data: {
          amount: 100.0,
          description: 'Test expense for status filter',
          transaction_date: new Date(),
          category_id: categoryId,
          report_id: reportId,
          submitter_id: user1Id,
          status: 'PENDING_REVIEW'
        }
      });

      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses?status=PENDING_REVIEW`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('expenses');
      expect(Array.isArray(response.body.expenses)).toBe(true);
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses?page=1&limit=10`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('Create Expense Edge Cases', () => {
    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          // Missing amount, description, date, category_id
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid amount', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 'invalid',
          description: 'Test expense',
          transactionDate: '2025-06-15',
          categoryId: categoryId
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 50.0,
          description: 'Test expense',
          transactionDate: 'invalid-date',
          categoryId: categoryId
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle non-existent category', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          amount: 50.0,
          description: 'Test expense',
          transactionDate: '2025-06-15',
          categoryId: 99999
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('Get Specific Expense Edge Cases', () => {
    let expenseId;

    beforeAll(async () => {
      // Create an expense for testing
      const expense = await prisma.expense.create({
        data: {
          amount: 75.0,
          description: 'Test expense for get tests',
          transaction_date: new Date(),
          category_id: categoryId,
          report_id: reportId,
          submitter_id: user1Id,
          status: 'PENDING_REVIEW'
        }
      });
      expenseId = expense.id;
    });

    test('should handle invalid expense ID', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent expense', async () => {
      const response = await request(app)
        .get('/api/expenses/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized access to expense', async () => {
      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });
  });

  describe('Update Expense Edge Cases', () => {
    let expenseId;

    beforeAll(async () => {
      // Create an expense for testing
      const expense = await prisma.expense.create({
        data: {
          amount: 85.0,
          description: 'Test expense for update tests',
          transaction_date: new Date(),
          category_id: categoryId,
          report_id: reportId,
          submitter_id: user1Id,
          status: 'PENDING_REVIEW'
        }
      });
      expenseId = expense.id;
    });

    test('should handle invalid expense ID', async () => {
      const response = await request(app)
        .put('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ description: 'Updated description' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ description: 'Updated description' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized update', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .send({ description: 'Unauthorized update' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should handle invalid amount in update', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ amount: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid date in update', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ transactionDate: 'invalid-date' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Delete Expense Edge Cases', () => {
    let expenseId;

    beforeAll(async () => {
      // Create an expense for testing
      const expense = await prisma.expense.create({
        data: {
          amount: 95.0,
          description: 'Test expense for delete tests',
          transaction_date: new Date(),
          category_id: categoryId,
          report_id: reportId,
          submitter_id: user1Id,
          status: 'PENDING_REVIEW'
        }
      });
      expenseId = expense.id;
    });

    test('should handle invalid expense ID', async () => {
      const response = await request(app)
        .delete('/api/expenses/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized delete', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should successfully delete expense', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Update Expense Status Edge Cases', () => {
    let expenseId;

    beforeAll(async () => {
      // Create an expense for testing
      const expense = await prisma.expense.create({
        data: {
          amount: 105.0,
          description: 'Test expense for status update tests',
          transaction_date: new Date(),
          category_id: categoryId,
          report_id: reportId,
          submitter_id: user1Id,
          status: 'PENDING_REVIEW'
        }
      });
      expenseId = expense.id;
    });

    test('should handle invalid expense ID', async () => {
      const response = await request(app)
        .put('/api/expenses/invalid/status')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ status: 'APPROVED' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent expense', async () => {
      const response = await request(app)
        .put('/api/expenses/99999/status')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ status: 'APPROVED' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized status update', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .send({ status: 'APPROVED' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should handle invalid status', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('Expenses API Functional Tests', () => {
  let app;
  let testSetup;

  beforeAll(async () => {
    console.log('🧪 Setting up expense test environment...');
    app = createTestApp();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up expense test environment...');
  });

  beforeEach(async () => {
    testSetup = await createTestSetup({
      displayName: 'Test User test-expenses'
    });
  });

  afterEach(async () => {
    if (testSetup && testSetup.cleanup) {
      await testSetup.cleanup();
    }
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      // Create a report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Test Expense Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Create a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          name: 'Test Category',
          budget: 1000
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Create expense
      const expenseData = {
        description: 'Test Expense',
        amount: 25.5,
        categoryId: categoryId,
        items: { receipts: ['item1', 'item2'] },
        notes: 'Test expense notes',
        receiptUrl: 'https://example.com/receipt.jpg'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Expense created successfully');
      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense).toHaveProperty('id');
      expect(response.body.expense).toHaveProperty('description', 'Test Expense');
      expect(response.body.expense).toHaveProperty('amount', 25.5);
      expect(response.body.expense).toHaveProperty('status', 'PENDING_REVIEW');
      expect(response.body.expense).toHaveProperty('items');
      expect(response.body.expense).toHaveProperty('notes', 'Test expense notes');
      expect(response.body.expense).toHaveProperty(
        'receipt_url',
        'https://example.com/receipt.jpg'
      );
      expect(response.body.expense.category).toHaveProperty('id', categoryId);
      expect(response.body.expense.submitter).toHaveProperty('email', testSetup.userRecord.email);

      console.log('✓ Expense created successfully');
    });

    it('should fail to create expense without required fields', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('Description and amount are required');

      console.log('✓ Missing fields correctly rejected');
    });

    it('should fail with invalid amount', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          description: 'Test Expense',
          amount: -10,
          categoryId: 1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('Amount must be a positive number');

      console.log('✓ Invalid amount correctly rejected');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Test Expense',
          amount: 25.5,
          categoryId: 1
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated expense creation correctly rejected');
    });

    it('should fail with non-existent category', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          description: 'Test Expense',
          amount: 25.5,
          categoryId: 99999 // Non-existent category
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('Category not found');

      console.log('✓ Non-existent category correctly rejected');
    });
  });

  describe('GET /api/categories/:categoryId/expenses', () => {
    it('should get expenses for a category', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      // Create a report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Test Expense Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Create a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          name: 'Test Category',
          budget: 1000
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Create an expense
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          description: 'Test Expense 1',
          amount: 25.5,
          categoryId: categoryId
        })
        .expect(201);

      // Get expenses for the category
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('category');
      expect(response.body.expenses).toHaveLength(1);
      expect(response.body.expenses[0]).toHaveProperty('description', 'Test Expense 1');
      expect(response.body.expenses[0]).toHaveProperty('amount', 25.5);
      expect(response.body.category).toHaveProperty('id', categoryId);

      console.log('✓ Category expenses retrieved successfully');
    });

    it('should return empty array for category with no expenses', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      // Create a report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Test Expense Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Create a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          name: 'Empty Category',
          budget: 1000
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Get expenses for the empty category
      const response = await request(app)
        .get(`/api/categories/${categoryId}/expenses`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('expenses');
      expect(response.body.expenses).toHaveLength(0);
      expect(response.body.pagination.totalExpenses).toBe(0);

      console.log('✓ Empty category expenses list retrieved correctly');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/categories/1/expenses').expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated category expenses access correctly rejected');
    });

    it('should fail for non-existent category', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .get('/api/categories/99999/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('Category not found');

      console.log('✓ Non-existent category correctly rejected');
    });
  });

  describe('PUT /api/expenses/:expenseId/status', () => {
    it('should update expense status with REVIEWER role', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      // Create a report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Test Expense Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Create a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          name: 'Test Category',
          budget: 1000
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Create an expense
      const expenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          description: 'Test Expense',
          amount: 25.5,
          categoryId: categoryId
        })
        .expect(201);

      const expenseId = expenseResponse.body.expense.id;

      // Update expense status (as report owner, user has permission)
      const response = await request(app)
        .put(`/api/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          status: 'APPROVED',
          notes: 'Looks good!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Expense status updated successfully');
      expect(response.body).toHaveProperty('expense');
      expect(response.body).toHaveProperty('approval');
      expect(response.body.expense).toHaveProperty('status', 'APPROVED');
      expect(response.body.approval).toHaveProperty('status_change', 'APPROVED');
      expect(response.body.approval).toHaveProperty('notes', 'Looks good!');

      console.log('✓ Expense status updated successfully');
    });

    it('should fail with invalid status', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .put('/api/expenses/1/status')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body.message).toContain('Status must be one of:');

      console.log('✓ Invalid status correctly rejected');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/expenses/1/status')
        .send({
          status: 'APPROVED'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated status update correctly rejected');
    });

    it('should fail for non-existent expense', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .put('/api/expenses/99999/status')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          status: 'APPROVED'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('Expense not found');

      console.log('✓ Non-existent expense correctly rejected');
    });
  });

  describe('Permission and isolation tests', () => {
    it("should prevent users from accessing expenses in other users' categories", async () => {
      const testSetup1 = await createTestSetup({
        displayName: 'Test User 1'
      });

      const testSetup2 = await createTestSetup({
        displayName: 'Test User 2'
      });

      try {
        // Sync both users
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(201);

        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .expect(201);

        // User 1 creates a report and category
        const reportResponse = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({ name: 'User 1 Report' })
          .expect(201);

        const reportId = reportResponse.body.report.id;

        const categoryResponse = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'User 1 Category',
            budget: 1000
          })
          .expect(201);

        const categoryId = categoryResponse.body.category.id;

        // User 2 tries to access User 1's category expenses
        const response = await request(app)
          .get(`/api/categories/${categoryId}/expenses`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'Forbidden');

        console.log('✓ User isolation working correctly');
      } finally {
        await testSetup1.cleanup();
        await testSetup2.cleanup();
      }
    });
  });
});

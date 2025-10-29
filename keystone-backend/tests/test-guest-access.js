const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const shareLinkService = require('../src/services/shareLinkService');

const prisma = new PrismaClient();

describe('Guest Access API Endpoints', () => {
  let testReport, testCategory, submitToken, reviewToken, testExpense;
  let guestUser;

  beforeAll(async () => {
    // Create a guest user for testing
    guestUser = await prisma.user.upsert({
      where: { email: 'guest@system.local' },
      update: {},
      create: {
        firebase_uid: 'guest_user_system',
        email: 'guest@system.local',
        name: 'Guest User'
      }
    });

    // Create test report and category
    testReport = await prisma.report.create({
      data: {
        name: 'Test Guest Report',
        owner_id: guestUser.id
      }
    });

    testCategory = await prisma.category.create({
      data: {
        name: 'Test Guest Category',
        budget: 1000.0,
        report_id: testReport.id
      }
    });

    // Create guest tokens
    const submitTokenData = await shareLinkService.createShareLink(testCategory.id, 'SUBMIT_ONLY');
    submitToken = submitTokenData.token;

    const reviewTokenData = await shareLinkService.createShareLink(testCategory.id, 'REVIEW_ONLY');
    reviewToken = reviewTokenData.token;

    // Create a test expense for review
    testExpense = await prisma.expense.create({
      data: {
        description: 'Test Expense for Review',
        amount: 50.0,
        status: 'PENDING_REVIEW',
        report_id: testReport.id,
        submitter_id: guestUser.id,
        category_id: testCategory.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data in correct order due to foreign key constraints

    // First, delete all approvals for expenses in this category
    await prisma.approval.deleteMany({
      where: {
        expense: {
          category_id: testCategory.id
        }
      }
    });

    // Then delete all expenses in this category
    await prisma.expense.deleteMany({
      where: {
        category_id: testCategory.id
      }
    });

    // Delete guest tokens
    await prisma.guestToken.deleteMany({
      where: {
        category_id: testCategory.id
      }
    });

    // Delete category
    await prisma.category.delete({
      where: { id: testCategory.id }
    });

    // Delete report
    await prisma.report.delete({
      where: { id: testReport.id }
    });

    // Delete guest user
    await prisma.user.delete({
      where: { id: guestUser.id }
    });

    await prisma.$disconnect();
  });

  describe('GET /api/guest', () => {
    test('should return guest data for SUBMIT_ONLY token', async () => {
      const response = await request(app).get(`/api/guest?token=${submitToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.id).toBe(testCategory.id);
      expect(response.body.data.permission_level).toBe('SUBMIT_ONLY');
      expect(response.body.data.canSubmit).toBe(true);
      expect(response.body.data.submissionFields).toBeDefined();
      expect(response.body.data.expenses).toBe([]);
    });

    test('should return guest data with expenses for REVIEW_ONLY token', async () => {
      const response = await request(app).get(`/api/guest?token=${reviewToken}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.id).toBe(testCategory.id);
      expect(response.body.data.permission_level).toBe('REVIEW_ONLY');
      expect(response.body.data.expenses).toBeDefined();
      expect(Array.isArray(response.body.data.expenses)).toBe(true);
      expect(response.body.data.expenses.length).toBeGreaterThan(0);
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app).get('/api/guest').expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Missing guest token parameter');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app).get('/api/guest?token=invalid_token').expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Invalid or expired guest token');
    });
  });

  describe('POST /api/guest', () => {
    test('should submit expense with valid SUBMIT_ONLY token', async () => {
      const expenseData = {
        description: 'Test Guest Expense Submission',
        amount: 75.5,
        notes: 'Test notes from guest'
      };

      const response = await request(app)
        .post(`/api/guest?token=${submitToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Expense submitted successfully');
      expect(response.body.data.expense.description).toBe(expenseData.description);
      expect(parseFloat(response.body.data.expense.amount)).toBe(expenseData.amount);
      expect(response.body.data.expense.status).toBe('PENDING_REVIEW');
    });

    test('should submit expense with valid REVIEW_ONLY token', async () => {
      const expenseData = {
        description: 'Test Review Token Submission',
        amount: 100.0
      };

      const response = await request(app)
        .post(`/api/guest?token=${reviewToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expense.description).toBe(expenseData.description);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post(`/api/guest?token=${submitToken}`)
        .send({ description: 'Missing amount' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Description and amount are required fields');
    });

    test('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post(`/api/guest?token=${submitToken}`)
        .send({
          description: 'Test',
          amount: -50
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Amount must be a positive number');
    });

    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/api/guest')
        .send({ description: 'Test', amount: 50 })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/guest/expenses/:expenseId', () => {
    test('should approve expense with REVIEW_ONLY token', async () => {
      const response = await request(app)
        .put(`/api/guest/expenses/${testExpense.id}?token=${reviewToken}`)
        .send({
          status: 'APPROVED',
          notes: 'Approved by guest reviewer'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Expense approved and forwarded to admin for final approval'
      );
      expect(response.body.data.expense.status).toBe('APPROVED');
      expect(response.body.data.expense.approvals.length).toBeGreaterThan(0);
    });

    test('should deny expense with REVIEW_ONLY token', async () => {
      // Create another test expense
      const anotherExpense = await prisma.expense.create({
        data: {
          description: 'Another Test Expense',
          amount: 25.0,
          status: 'PENDING_REVIEW',
          report_id: testReport.id,
          submitter_id: guestUser.id,
          category_id: testCategory.id
        }
      });

      const response = await request(app)
        .put(`/api/guest/expenses/${anotherExpense.id}?token=${reviewToken}`)
        .send({
          status: 'DENIED',
          notes: 'Insufficient documentation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Expense denied successfully');
      expect(response.body.data.expense.status).toBe('DENIED');
    });

    test('should return 403 for SUBMIT_ONLY token trying to review', async () => {
      const response = await request(app)
        .put(`/api/guest/expenses/${testExpense.id}?token=${submitToken}`)
        .send({ status: 'APPROVED' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toBe('Insufficient permissions for this action');
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/guest/expenses/${testExpense.id}?token=${reviewToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Status must be either APPROVED or DENIED');
    });

    test('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .put(`/api/guest/expenses/99999?token=${reviewToken}`)
        .send({ status: 'APPROVED' })
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Expense not found or cannot be updated');
    });
  });
});

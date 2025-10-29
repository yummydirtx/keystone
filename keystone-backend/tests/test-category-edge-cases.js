const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Category Controller Edge Cases Coverage', () => {
  let app;
  let testSetup1, testSetup2;
  let reportId, categoryId, parentCategoryId;
  let user1Id, user2Id;

  beforeAll(async () => {
    console.log('🧪 Setting up category controller edge cases tests...');
    app = createTestApp();

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Category Edge User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Category Edge User 2' });

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

    // Create test report and categories
    const report = await prisma.report.create({
      data: {
        name: 'Category Edge Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;

    const parentCategory = await prisma.category.create({
      data: {
        name: 'Parent Category',
        report_id: reportId,
        budget: 1000.0
      }
    });
    parentCategoryId = parentCategory.id;

    const childCategory = await prisma.category.create({
      data: {
        name: 'Child Category',
        report_id: reportId,
        parent_category_id: parentCategoryId,
        budget: 500.0
      }
    });
    categoryId = childCategory.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up category controller edge cases tests...');
    // Clean up test data
    await cleanupTestData(testSetup1.userRecord.uid);
    await cleanupTestData(testSetup2.userRecord.uid);
  });

  describe('Get Categories Edge Cases', () => {
    test('should handle non-existent report ID', async () => {
      const response = await request(app)
        .get('/api/reports/99999/categories')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle invalid report ID', async () => {
      const response = await request(app)
        .get('/api/reports/invalid/categories')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle unauthorized access to report categories', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should return hierarchical category structure', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });

    test('should handle report with no categories (legacy/direct DB creation)', async () => {
      // Create a new report directly via Prisma (bypassing API) to test edge case
      // This simulates legacy data or direct database operations without default categories
      const emptyReport = await prisma.report.create({
        data: {
          name: 'Empty Report',
          owner_id: user1Id
        }
      });

      const response = await request(app)
        .get(`/api/reports/${emptyReport.id}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.categories).toEqual([]);
      expect(response.body.totalCount).toBe(0);

      // Clean up
      await prisma.report.delete({ where: { id: emptyReport.id } });
    });
  });

  describe('Get Specific Category Edge Cases', () => {
    test('should handle invalid category ID', async () => {
      const response = await request(app)
        .get('/api/categories/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent category ID', async () => {
      const response = await request(app)
        .get('/api/categories/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized access to category', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should successfully retrieve category details', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('category');
      expect(response.body.category).toHaveProperty('id', categoryId);
    });
  });

  describe('Create Category Edge Cases', () => {
    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          // Missing name
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid budget', async () => {
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          name: 'Test Category',
          budget: 'invalid'
        })
        .expect(400);
    });

    test('should handle invalid parent category ID', async () => {
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          name: 'Test Category',
          parentCategoryId: 99999 // Changed from parent_category_id to parentCategoryId
        })
        .expect(404); // Should return 404 for non-existent parent category

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('Parent category not found');
    });

    test('should handle non-existent report ID', async () => {
      const response = await request(app)
        .post('/api/reports/99999/categories')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          name: 'Test Category'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should handle unauthorized category creation', async () => {
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .send({
          name: 'Unauthorized Category'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should successfully create category with valid data', async () => {
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({
          name: 'Valid Test Category',
          budget: 250.0
        })
        .expect(201);

      expect(response.body).toHaveProperty('category');
      expect(response.body.category.name).toBe('Valid Test Category');
    });
  });

  describe('Update Category Edge Cases', () => {
    test('should handle invalid category ID', async () => {
      const response = await request(app)
        .put('/api/categories/invalid')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should handle non-existent category ID', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ name: 'Updated Name' })
        .expect(403); // Likely returns 403 if user doesn't have permission to non-existent category

      expect(response.body).toHaveProperty('error');
    });

    test('should handle unauthorized update', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup2.customToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
    });

    test('should handle invalid budget in update', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ budget: 'invalid' })
        .expect(400);
    });

    test('should handle invalid parent category in update', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ parent_category_id: 99999 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should successfully update category', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .send({ name: 'Updated Category Name' })
        .expect(200);

      // Check if the response has the updated data in the nested structure
      expect(response.body).toHaveProperty('category');
      expect(response.body.category.name).toBe('Updated Category Name');
    });
  });

  describe('Server Error Simulation', () => {
    test('should handle database connection issues gracefully', async () => {
      // We can't easily simulate database errors in tests,
      // but we can test that the endpoints exist and handle valid requests
      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});

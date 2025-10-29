const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Simple Routes Tests', () => {
  let app;
  let testSetup;
  let reportId, categoryId;

  beforeAll(async () => {
    console.log('🧪 Setting up simple routes test...');
    app = createTestApp();

    // Set up test user
    testSetup = await createTestSetup({ displayName: 'Simple Routes Test User' });

    // Sync user to get database ID
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { firebase_uid: testSetup.userRecord.uid }
    });

    console.log('🔧 User ID:', user.id, 'Firebase UID:', testSetup.userRecord.uid);

    // Create test report using the API
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Simple Routes Test Report',
        description: 'Test report'
      })
      .expect(201);

    reportId = reportResponse.body.report.id;
    console.log('🔧 Created report:', reportId);

    // Create test category using the API
    const categoryResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Simple Routes Test Category',
        budget: 1000
      })
      .expect(201);

    categoryId = categoryResponse.body.category.id;
    console.log('🔧 Created category:', categoryId);
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up simple routes test...');
    if (testSetup) {
      await testSetup.cleanup();
    }
  });

  describe('Basic Category Operations', () => {
    it('should get category when user is owner', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body.category).toBeDefined();
      expect(response.body.category.id).toBe(categoryId);
      expect(response.body.category.name).toBe('Simple Routes Test Category');
    });

    it('should update category when user is owner', async () => {
      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          name: 'Updated Simple Category',
          budget: 2000
        })
        .expect(200);

      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe('Updated Simple Category');
      expect(response.body.category.budget).toBe('2000');
    });
  });

  describe('Basic Report Operations', () => {
    it('should get report when user is owner', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body.report).toBeDefined();
      expect(response.body.report.id).toBe(reportId);
      expect(response.body.report.name).toBe('Updated Simple Category');
    });

    it('should get report categories when user is owner', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Basic User Operations', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.firebase_uid).toBe(testSetup.userRecord.uid);
    });
  });
});

// test-reports.js
// Functional tests for the reports API endpoints using Firebase Admin SDK

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('Reports API Functional Tests', () => {
  let testSetup;
  let app;

  beforeAll(async () => {
    // Create test app with test authentication middleware
    app = createTestApp();
    console.log('Setting up test environment...');
  });

  beforeEach(async () => {
    // Create a fresh test setup for each test
    testSetup = await createTestSetup({
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User for Reports'
    });

    console.log('Created test user:', testSetup.userRecord.uid);
  });

  afterEach(async () => {
    // Clean up after each test
    if (testSetup && testSetup.cleanup) {
      await testSetup.cleanup();
      console.log('Cleaned up test user:', testSetup.userRecord.uid);
    }
  });

  describe('POST /api/reports', () => {
    test('should create a new report with valid token', async () => {
      const reportData = {
        name: 'My Test Report'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Report created successfully',
        report: {
          id: expect.any(Number),
          name: reportData.name,
          owner: {
            id: expect.any(Number),
            email: testSetup.userRecord.email,
            name: testSetup.userRecord.displayName
          },
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });

      console.log('✓ Successfully created report:', response.body.report.name);
    });

    test('should fail to create report without name', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        message: 'Report name is required'
      });

      console.log('✓ Correctly rejected request without name');
    });

    test('should fail to create report without authentication', async () => {
      const reportData = {
        name: 'Unauthorized Report'
      };

      const response = await request(app).post('/api/reports').send(reportData).expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });

      console.log('✓ Correctly rejected unauthenticated request');
    });

    test('should fail with invalid token', async () => {
      const reportData = {
        name: 'Invalid Token Report'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', 'Bearer invalid-token')
        .send(reportData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });

      console.log('✓ Correctly rejected invalid token');
    });
  });

  describe('GET /api/reports', () => {
    test('should get empty reports list for new user', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Reports retrieved successfully',
        reports: []
      });

      console.log('✓ Successfully retrieved empty reports list');
    });

    test('should get reports list after creating reports', async () => {
      // Create a few reports first
      const report1 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'First Report' })
        .expect(201);

      const report2 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Second Report' })
        .expect(201);

      // Now get all reports
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Reports retrieved successfully',
        reports: expect.arrayContaining([
          expect.objectContaining({
            id: report1.body.report.id,
            name: 'First Report',
            owner: expect.objectContaining({
              email: testSetup.userRecord.email
            }),
            categoriesCount: 1, // Now has default root category
            expensesCount: 0
          }),
          expect.objectContaining({
            id: report2.body.report.id,
            name: 'Second Report',
            owner: expect.objectContaining({
              email: testSetup.userRecord.email
            }),
            categoriesCount: 1, // Now has default root category
            expensesCount: 0
          })
        ])
      });

      expect(response.body.reports).toHaveLength(2);
      console.log(
        '✓ Successfully retrieved reports list with',
        response.body.reports.length,
        'reports'
      );
    });

    test('should fail to get reports without authentication', async () => {
      const response = await request(app).get('/api/reports').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });

      console.log('✓ Correctly rejected unauthenticated request');
    });
  });

  describe('User isolation', () => {
    test('should only see own reports', async () => {
      // Create a second test user
      const secondTestSetup = await createTestSetup({
        email: `test-second-${Date.now()}@example.com`,
        displayName: 'Second Test User'
      });

      try {
        // First user creates a report
        await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({ name: 'First User Report' })
          .expect(201);

        // Second user creates a report
        await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
          .send({ name: 'Second User Report' })
          .expect(201);

        // First user should only see their own report
        const firstUserReports = await request(app)
          .get('/api/reports')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(200);

        expect(firstUserReports.body.reports).toHaveLength(1);
        expect(firstUserReports.body.reports[0].name).toBe('First User Report');

        // Second user should only see their own report
        const secondUserReports = await request(app)
          .get('/api/reports')
          .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
          .expect(200);

        expect(secondUserReports.body.reports).toHaveLength(1);
        expect(secondUserReports.body.reports[0].name).toBe('Second User Report');

        console.log('✓ User isolation working correctly');
      } finally {
        // Clean up second test user
        if (secondTestSetup && secondTestSetup.cleanup) {
          await secondTestSetup.cleanup();
        }
      }
    });
  });

  describe('DELETE /api/reports/:reportId', () => {
    test('should delete a report with valid ownership', async () => {
      // First create a report
      const createResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Report to Delete' })
        .expect(201);

      const reportId = createResponse.body.report.id;

      // Delete the report
      const deleteResponse = await request(app)
        .delete(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        message: 'Report deleted successfully'
      });

      // Verify the report is gone
      await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(404);

      console.log('✓ Successfully deleted report:', reportId);
    });

    test('should delete report with all related data (cascade test)', async () => {
      // Create a report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Report with Related Data' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Create a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Test Category', budget: 1000 })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Create an expense
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({
          description: 'Test Expense',
          amount: 50.0,
          categoryId: categoryId
        })
        .expect(201);

      // Delete the report (should cascade delete all related data)
      await request(app)
        .delete(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      // Verify all related data is gone
      await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(404);

      await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(404);

      console.log('✓ Successfully cascade deleted report and all related data');
    });

    test('should fail to delete report owned by another user', async () => {
      // Create second test user
      const secondTestSetup = await createTestSetup({
        email: `test-second-delete-${Date.now()}@example.com`,
        displayName: 'Second User for Delete Test'
      });

      try {
        // Sync the second user with the backend
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
          .expect(201);

        // First user creates a report
        const createResponse = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({ name: 'First User Report' })
          .expect(201);

        const reportId = createResponse.body.report.id;

        // Second user tries to delete first user's report
        const deleteResponse = await request(app)
          .delete(`/api/reports/${reportId}`)
          .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
          .expect(403);

        expect(deleteResponse.body).toMatchObject({
          error: 'Forbidden',
          message: 'Only the report owner can delete the report'
        });

        console.log('✓ Correctly prevented unauthorized deletion');
      } finally {
        // Clean up second test user
        if (secondTestSetup && secondTestSetup.cleanup) {
          await secondTestSetup.cleanup();
        }
      }
    });

    test('should fail to delete non-existent report', async () => {
      // Sync the user first so we can access the endpoint
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(201);

      const response = await request(app)
        .delete('/api/reports/99999')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Report not found'
      });

      console.log('✓ Correctly handled non-existent report deletion');
    });

    test('should fail to delete report without authentication', async () => {
      const response = await request(app).delete('/api/reports/1').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized'
      });

      console.log('✓ Correctly rejected unauthenticated deletion request');
    });
  });
});

// Manual test runner if not using Jest
if (require.main === module) {
  console.log('Running functional tests manually...');
  console.log('Note: For best results, use "npm test" to run with Jest');

  const runManualTests = async () => {
    try {
      console.log('Creating test setup...');
      const setup = await createTestSetup();

      console.log('Testing basic token validation...');
      console.log('Custom token preview:', setup.customToken.substring(0, 50) + '...');

      console.log('Cleaning up...');
      await setup.cleanup();

      console.log('Manual test completed successfully!');
    } catch (error) {
      console.error('Manual test failed:', error);
      process.exit(1);
    }
  };

  runManualTests();
}

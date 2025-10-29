// test-auth-functional.js
// Functional tests for Firebase authentication middleware

const request = require('supertest');
const { createTestSetup, createMockDecodedToken } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('Firebase Authentication Functional Tests', () => {
  let testSetup;
  let app;

  beforeAll(async () => {
    // Create test app with test authentication middleware
    app = createTestApp();

    console.log('Setting up Firebase auth test environment...');
  });

  beforeEach(async () => {
    // Create a fresh test setup for each test
    testSetup = await createTestSetup({
      email: `auth-test-${Date.now()}@example.com`,
      displayName: 'Auth Test User'
    });

    console.log('Created auth test user:', testSetup.userRecord.uid);
  });

  afterEach(async () => {
    // Clean up after each test
    if (testSetup && testSetup.cleanup) {
      await testSetup.cleanup();
      console.log('Cleaned up auth test user:', testSetup.userRecord.uid);
    }
  });

  describe('Authentication Middleware', () => {
    test('should allow access with valid Firebase custom token', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('reports');
      console.log('✓ Valid token accepted');
    });

    test('should reject request without authorization header', async () => {
      const response = await request(app).get('/api/reports').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });
      console.log('✓ Missing authorization header rejected');
    });

    test('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });
      console.log('✓ Malformed authorization header rejected');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });
      console.log('✓ Invalid token rejected');
    });

    test('should reject request with expired token format', async () => {
      // This is a mock expired token - in real scenarios you'd need to wait for actual expiration
      const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.expired';

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.any(String)
      });
      console.log('✓ Expired token format rejected');
    });
  });

  describe('Token Validation', () => {
    test('should extract correct user information from token', async () => {
      // First create a report to test user context
      const reportData = { name: 'User Context Test Report' };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send(reportData)
        .expect(201);

      // Verify the user information matches what we created
      expect(response.body.report.owner).toMatchObject({
        email: testSetup.userRecord.email,
        name: testSetup.userRecord.displayName
      });
      console.log('✓ User information correctly extracted from token');
    });

    test('should handle user creation from valid token', async () => {
      // The first API call should create the user in our database
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${testSetup.customToken}`)
        .send({ name: 'Auto User Creation Test' })
        .expect(201);

      expect(response.body.report.owner).toMatchObject({
        id: expect.any(Number),
        email: testSetup.userRecord.email,
        name: testSetup.userRecord.displayName
      });
      console.log('✓ User automatically created from valid token');
    });
  });

  describe('Multiple Users Isolation', () => {
    test('should maintain separate contexts for different users', async () => {
      // Create a second user
      const secondSetup = await createTestSetup({
        email: `auth-test-second-${Date.now()}@example.com`,
        displayName: 'Second Auth Test User'
      });

      try {
        // Each user creates a report
        const firstUserReport = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({ name: 'First User Report' })
          .expect(201);

        const secondUserReport = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${secondSetup.customToken}`)
          .send({ name: 'Second User Report' })
          .expect(201);

        // Verify different user IDs
        expect(firstUserReport.body.report.owner.id).not.toBe(
          secondUserReport.body.report.owner.id
        );

        expect(firstUserReport.body.report.owner.email).toBe(testSetup.userRecord.email);

        expect(secondUserReport.body.report.owner.email).toBe(secondSetup.userRecord.email);

        console.log('✓ Multiple user contexts properly isolated');
      } finally {
        // Clean up second user
        if (secondSetup && secondSetup.cleanup) {
          await secondSetup.cleanup();
        }
      }
    });
  });
});

// Manual test runner
if (require.main === module) {
  console.log('Running Firebase auth functional tests manually...');

  const runManualTests = async () => {
    try {
      console.log('Testing Firebase Admin SDK integration...');
      const setup = await createTestSetup();

      console.log('Created user:', setup.userRecord.email);
      console.log('Token preview:', setup.customToken.substring(0, 50) + '...');

      await setup.cleanup();
      console.log('Auth functional tests completed successfully!');
    } catch (error) {
      console.error('Auth functional tests failed:', error);
      process.exit(1);
    }
  };

  runManualTests();
}

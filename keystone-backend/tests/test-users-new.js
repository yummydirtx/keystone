// test-users.js
// Functional tests for the users API endpoints using Firebase Admin SDK

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('Users API Functional Tests', () => {
  let testSetup;
  let app;

  beforeAll(async () => {
    // Create test app with test authentication middleware
    app = createTestApp();
    console.log('🧪 Setting up user test environment...');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up user test environment...');
  });

  beforeEach(async () => {
    // Create a fresh test setup for each test
    testSetup = await createTestSetup({
      generateUserId: () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userProperties: { displayName: 'Test User new' }
    });
  });

  afterEach(async () => {
    // Clean up test user after each test
    if (testSetup && testSetup.cleanup) {
      await testSetup.cleanup();
    }
  });

  describe('POST /api/users/sync', () => {
    it('should sync new Firebase user to local database', async () => {
      const response = await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('uid', testSetup.userId);
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).toHaveProperty('created_at');

      console.log('✓ New user synced successfully');
    });

    it('should return existing user if already synced', async () => {
      // First sync
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(201);

      // Second sync should return existing user
      const response = await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('uid', testSetup.userId);

      console.log('✓ Existing user returned correctly');
    });

    it('should fail to sync without authentication', async () => {
      const response = await request(app).post('/api/users/sync').expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated sync correctly rejected');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/users/sync')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Invalid token correctly rejected');
    });
  });

  describe('GET /api/users/me', () => {
    it('should get current user profile', async () => {
      // First sync the user
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(201);

      // Then get the profile
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('uid', testSetup.userId);
      expect(response.body.user).toHaveProperty('name', 'Test User');

      console.log('✓ User profile retrieved successfully');
    });

    it('should fail to get profile without authentication', async () => {
      const response = await request(app).get('/api/users/me').expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated profile access correctly rejected');
    });

    it('should fail if user not synced', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');

      console.log('✓ Non-synced user correctly rejected');
    });
  });

  describe('PUT /api/users/me', () => {
    beforeEach(async () => {
      // Sync user before each update test
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .expect(201);
    });

    it('should update user name', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({ name: 'Updated User Name' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', 'Updated User Name');

      console.log('✓ User name updated successfully');
    });

    it('should update user avatar URL', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({ avatar_url: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('avatar_url', 'https://example.com/avatar.jpg');

      console.log('✓ User avatar URL updated successfully');
    });

    it('should update both name and avatar URL', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({
          name: 'Updated Name',
          avatar_url: 'https://example.com/new-avatar.jpg'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('name', 'Updated Name');
      expect(response.body.user).toHaveProperty('avatar_url', 'https://example.com/new-avatar.jpg');

      console.log('✓ Both name and avatar URL updated successfully');
    });

    it('should fail with empty name', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');

      console.log('✓ Empty name correctly rejected');
    });

    it('should fail with invalid name type', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({ name: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');

      console.log('✓ Invalid name type correctly rejected');
    });

    it('should fail with invalid avatar URL type', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({ avatar_url: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');

      console.log('✓ Invalid avatar URL type correctly rejected');
    });

    it('should fail with no update fields', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${testSetup.token}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');

      console.log('✓ Empty update correctly rejected');
    });

    it('should fail to update without authentication', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');

      console.log('✓ Unauthenticated update correctly rejected');
    });

    it('should fail if user not synced', async () => {
      // Create a new test setup that hasn't been synced
      const newTestSetup = await createTestSetup({
        generateUserId: () =>
          `test-user-new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userProperties: { displayName: 'New Test User' }
      });

      try {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${newTestSetup.token}`)
          .send({ name: 'New Name' })
          .expect(404);

        expect(response.body).toHaveProperty('error', 'User not found');

        console.log('✓ Non-synced user update correctly rejected');
      } finally {
        await newTestSetup.cleanup();
      }
    });
  });

  describe('User isolation and data integrity', () => {
    it('should maintain user isolation in profile access', async () => {
      // Create two test setups
      const testSetup1 = await createTestSetup({
        generateUserId: () =>
          `test-user-1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userProperties: { displayName: 'Test User 1' }
      });

      const testSetup2 = await createTestSetup({
        generateUserId: () =>
          `test-user-2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userProperties: { displayName: 'Test User 2' }
      });

      try {
        // Sync both users
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup1.token}`)
          .expect(201);

        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup2.token}`)
          .expect(201);

        // User 1 should only see their own profile
        const user1Response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${testSetup1.token}`)
          .expect(200);

        expect(user1Response.body.user).toHaveProperty('uid', testSetup1.userId);
        expect(user1Response.body.user).toHaveProperty('name', 'Test User 1');

        // User 2 should only see their own profile
        const user2Response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${testSetup2.token}`)
          .expect(200);

        expect(user2Response.body.user).toHaveProperty('uid', testSetup2.userId);
        expect(user2Response.body.user).toHaveProperty('name', 'Test User 2');

        console.log('✓ User isolation working correctly');
      } finally {
        await testSetup1.cleanup();
        await testSetup2.cleanup();
      }
    });
  });
});

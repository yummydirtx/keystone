const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup } = require('./utils/testHelper');

/**
 * Functional tests for the permissions and sharing API endpoints.
 *
 * This file uses `beforeEach` and `afterEach` hooks to create and clean up
 * test users and their associated data (reports, categories, etc.).
 * This ensures that each test runs in an isolated environment without
 * interfering with other tests, and that all test data is reliably removed.
 */
describe('Permissions & Sharing API Functional Tests', () => {
  let app;

  // Initialize the test application once for all tests in this suite.
  beforeAll(async () => {
    console.log('🧪 Setting up permissions test environment...');
    app = createTestApp();
  });

  // Log a message when the entire test suite is finished.
  afterAll(async () => {
    console.log('🧹 Cleaning up permissions test environment...');
  });

  // Test suite for granting and updating permissions.
  describe('POST /api/categories/:categoryId/permissions', () => {
    let adminSetup, targetSetup;
    let categoryId;

    // Before each test, create an admin user, a target user, and a category owned by the admin.
    beforeEach(async () => {
      adminSetup = await createTestSetup({ displayName: 'Admin User' });
      targetSetup = await createTestSetup({ displayName: 'Target User' });

      // Sync both users to the database.
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .expect(201);

      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${targetSetup.customToken}`)
        .expect(201);

      // Admin user creates a report and a category.
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Report' })
        .expect(201);

      const categoryResponse = await request(app)
        .post(`/api/reports/${reportResponse.body.report.id}/categories`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Category' })
        .expect(201);

      categoryId = categoryResponse.body.category.id;
    });

    // After each test, clean up the created users and all their associated data.
    afterEach(async () => {
      if (adminSetup) await adminSetup.cleanup();
      if (targetSetup) await targetSetup.cleanup();
    });

    it('should grant permission to a user with ADMIN role', async () => {
      // Grant REVIEWER permission to the target user.
      const response = await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({
          userId: targetSetup.userRecord.uid, // Use Firebase UID for the request.
          role: 'REVIEWER'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Permission granted successfully');
      expect(response.body.permission).toHaveProperty('role', 'REVIEWER');
      expect(response.body.permission.user).toHaveProperty('name', 'Target User');

      console.log('✓ Permission granted successfully');
    });

    it('should update an existing permission', async () => {
      // First, grant REVIEWER permission.
      await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ userId: targetSetup.userRecord.uid, role: 'REVIEWER' })
        .expect(201);

      // Then, update the permission to ADMIN.
      const response = await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ userId: targetSetup.userRecord.uid, role: 'ADMIN' })
        .expect(200); // Expect 200 for an update.

      expect(response.body).toHaveProperty('message', 'Permission updated successfully');
      expect(response.body.permission).toHaveProperty('role', 'ADMIN');

      console.log('✓ Permission updated successfully');
    });

    it('should fail with an invalid role', async () => {
      const response = await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({
          userId: targetSetup.userRecord.uid,
          role: 'INVALID_ROLE'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
      console.log('✓ Invalid role correctly rejected');
    });
  });

  // Test suite for revoking permissions.
  describe('DELETE /api/categories/:categoryId/permissions/:userId', () => {
    let adminSetup, targetSetup;
    let categoryId;

    // Setup is similar to the grant tests.
    beforeEach(async () => {
      adminSetup = await createTestSetup({ displayName: 'Admin User' });
      targetSetup = await createTestSetup({ displayName: 'Target User' });
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .expect(201);
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${targetSetup.customToken}`)
        .expect(201);
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Report' })
        .expect(201);
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportResponse.body.report.id}/categories`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Category' })
        .expect(201);
      categoryId = categoryResponse.body.category.id;
    });

    afterEach(async () => {
      if (adminSetup) await adminSetup.cleanup();
      if (targetSetup) await targetSetup.cleanup();
    });

    it('should revoke permission from a user', async () => {
      // First, grant permission.
      await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ userId: targetSetup.userRecord.uid, role: 'REVIEWER' })
        .expect(201);

      // Then, revoke it.
      const response = await request(app)
        .delete(`/api/categories/${categoryId}/permissions/${targetSetup.userRecord.uid}`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Permission revoked successfully');
      expect(response.body.revokedPermission.user).toHaveProperty('name', 'Target User');
      console.log('✓ Permission revoked successfully');
    });

    it('should fail to revoke a non-existent permission', async () => {
      const response = await request(app)
        .delete(`/api/categories/${categoryId}/permissions/non-existent-uid`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      console.log('✓ Non-existent permission correctly rejected');
    });
  });

  // Test suite for creating share links.
  describe('POST /api/categories/:categoryId/share-links', () => {
    let adminSetup;
    let categoryId;

    beforeEach(async () => {
      adminSetup = await createTestSetup({ displayName: 'Admin User' });
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .expect(201);
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Report' })
        .expect(201);
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportResponse.body.report.id}/categories`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({ name: 'Test Category' })
        .expect(201);
      categoryId = categoryResponse.body.category.id;
    });

    afterEach(async () => {
      if (adminSetup) await adminSetup.cleanup();
    });

    it('should create a share link with SUBMIT_ONLY permission', async () => {
      const response = await request(app)
        .post(`/api/categories/${categoryId}/share-links`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({
          permission_level: 'SUBMIT_ONLY',
          description: 'Test submission link'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Share link created successfully');
      expect(response.body.shareLink).toHaveProperty('permission_level', 'SUBMIT_ONLY');
      expect(response.body.shareLink).toHaveProperty('token');
      expect(response.body.shareLink).toHaveProperty('url');
      console.log('✓ Share link created successfully');
    });

    it('should create a share link with an expiration date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      const response = await request(app)
        .post(`/api/categories/${categoryId}/share-links`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({
          permission_level: 'REVIEW_ONLY',
          expires_at: futureDate.toISOString()
        })
        .expect(201);

      expect(response.body.shareLink).toHaveProperty('expires_at');
      expect(new Date(response.body.shareLink.expires_at)).toEqual(futureDate);
      console.log('✓ Share link with expiration created successfully');
    });

    it('should fail with a past expiration date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const response = await request(app)
        .post(`/api/categories/${categoryId}/share-links`)
        .set('Authorization', `Bearer ${adminSetup.customToken}`)
        .send({
          permission_level: 'SUBMIT_ONLY',
          expires_at: pastDate.toISOString()
        })
        .expect(400);

      expect(response.body.message).toContain('must be in the future');
      console.log('✓ Past expiration date correctly rejected');
    });
  });

  // Test suite for authorization enforcement.
  describe('Authorization and permission isolation', () => {
    let ownerSetup, regularUserSetup, targetUserSetup;
    let categoryId;

    beforeEach(async () => {
      ownerSetup = await createTestSetup({ displayName: 'Owner User' });
      regularUserSetup = await createTestSetup({ displayName: 'Regular User' });
      targetUserSetup = await createTestSetup({ displayName: 'Target User' });

      // Sync all users
      for (const setup of [ownerSetup, regularUserSetup, targetUserSetup]) {
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${setup.customToken}`)
          .expect(201);
      }

      // Owner creates resources
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ name: 'Test Report' })
        .expect(201);
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportResponse.body.report.id}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ name: 'Test Category' })
        .expect(201);
      categoryId = categoryResponse.body.category.id;

      // Owner grants REVIEWER permission to the regular user
      await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ userId: regularUserSetup.userRecord.uid, role: 'REVIEWER' })
        .expect(201);
    });

    afterEach(async () => {
      if (ownerSetup) await ownerSetup.cleanup();
      if (regularUserSetup) await regularUserSetup.cleanup();
      if (targetUserSetup) await targetUserSetup.cleanup();
    });

    it('should prevent non-admin users from managing permissions', async () => {
      // The regular user (who has REVIEWER role) tries to grant permission to the target user. This should fail.
      const response = await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${regularUserSetup.customToken}`)
        .send({
          userId: targetUserSetup.userRecord.uid,
          role: 'REVIEWER'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
      console.log('✓ Permission isolation working correctly');
    });
  });

  // Test for unauthenticated access. This test doesn't need any setup.
  it('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/categories/1/permissions')
      .send({ userId: 'some-user', role: 'REVIEWER' })
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Unauthorized');
    console.log('✓ Unauthenticated access correctly rejected');
  });

  // Test for shared admin subcategory creation
  describe('Shared Admin Category Creation', () => {
    let reportOwnerSetup, sharedAdminSetup;
    let reportId, parentCategoryId;

    beforeEach(async () => {
      reportOwnerSetup = await createTestSetup({ displayName: 'Report Owner' });
      sharedAdminSetup = await createTestSetup({ displayName: 'Shared Admin' });

      // Sync both users
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${reportOwnerSetup.customToken}`)
        .expect(201);
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${sharedAdminSetup.customToken}`)
        .expect(201);

      // Report owner creates a report and parent category
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${reportOwnerSetup.customToken}`)
        .send({ name: 'Shared Admin Test Report' })
        .expect(201);
      reportId = reportResponse.body.report.id;

      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${reportOwnerSetup.customToken}`)
        .send({ name: 'Parent Category' })
        .expect(201);
      parentCategoryId = categoryResponse.body.category.id;

      // Grant ADMIN permission to shared admin on the parent category
      await request(app)
        .post(`/api/categories/${parentCategoryId}/permissions`)
        .set('Authorization', `Bearer ${reportOwnerSetup.customToken}`)
        .send({ userId: sharedAdminSetup.userRecord.uid, role: 'ADMIN' })
        .expect(201);
    });

    afterEach(async () => {
      if (reportOwnerSetup) await reportOwnerSetup.cleanup();
      if (sharedAdminSetup) await sharedAdminSetup.cleanup();
    });

    it('should allow shared admin to create subcategories', async () => {
      // Shared admin should be able to create a subcategory in the parent category they have admin access to
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${sharedAdminSetup.customToken}`)
        .send({
          name: 'Subcategory by Shared Admin',
          budget: 1000,
          parentCategoryId: parentCategoryId
        })
        .expect(201);

      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.category.name).toBe('Subcategory by Shared Admin');
      expect(response.body.category.parentCategory.id).toBe(parentCategoryId);
      console.log('✓ Shared admin successfully created subcategory');
    });

    it('should prevent shared admin from creating root categories in the report', async () => {
      // Shared admin should NOT be able to create root categories (without parentCategoryId) since they're not the report owner
      const response = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${sharedAdminSetup.customToken}`)
        .send({
          name: 'Root Category by Shared Admin',
          budget: 1000
        })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');
      console.log('✓ Shared admin correctly prevented from creating root category');
    });
  });
});

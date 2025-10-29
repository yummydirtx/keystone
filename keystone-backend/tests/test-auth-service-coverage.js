const AuthService = require('../src/services/authService');
const prisma = require('../src/config/database');
const { createTestSetup } = require('./utils/testHelper');

describe('AuthService Coverage Tests', () => {
  let testUser1, testUser2;
  let reportId, categoryId;
  let testSetup1, testSetup2;

  beforeAll(async () => {
    console.log('🧪 Setting up AuthService coverage tests...');

    // Create test users that will be shared across all tests in this suite.
    testSetup1 = await createTestSetup({ displayName: 'Auth Test User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Auth Test User 2' });

    console.log('🔧 Test setup 1 userRecord:', testSetup1.userRecord.uid);
    console.log('🔧 Test setup 2 userRecord:', testSetup2.userRecord.uid);

    // Create users in the database.
    try {
      testUser1 = await AuthService.getOrCreateUser({
        uid: testSetup1.userRecord.uid,
        email: testSetup1.userRecord.email,
        name: 'Auth Test User 1',
        picture: 'https://example.com/avatar1.jpg'
      });
      console.log('🔧 Created testUser1:', testUser1?.id);

      testUser2 = await AuthService.getOrCreateUser({
        uid: testSetup2.userRecord.uid,
        email: testSetup2.userRecord.email,
        name: 'Auth Test User 2',
        picture: null
      });
      console.log('🔧 Created testUser2:', testUser2?.id);
    } catch (error) {
      console.error('❌ Error creating users:', error);
      throw error;
    }

    // Validate users were created properly.
    if (!testUser1 || !testUser1.id) {
      throw new Error(`testUser1 is invalid: ${JSON.stringify(testUser1)}`);
    }
    if (!testUser2 || !testUser2.id) {
      throw new Error(`testUser2 is invalid: ${JSON.stringify(testUser2)}`);
    }

    // Create a test report and category for use in tests.
    const report = await prisma.report.create({
      data: {
        name: 'AuthService Test Report',
        owner_id: testUser1.id
      }
    });
    reportId = report.id;
    console.log('🔧 Created report:', reportId);

    const category = await prisma.category.create({
      data: {
        name: 'AuthService Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;
    console.log('🔧 Created category:', categoryId);
  });

  // After all tests in this suite are complete, clean up the shared users.
  afterAll(async () => {
    console.log('🧹 Cleaning up AuthService tests...');
    if (testSetup1) await testSetup1.cleanup();
    if (testSetup2) await testSetup2.cleanup();
  });

  describe('getOrCreateUser', () => {
    it('should return existing user if found', async () => {
      const result = await AuthService.getOrCreateUser({
        uid: testUser1.firebase_uid,
        email: testUser1.email,
        name: 'Different Name',
        picture: 'https://example.com/different.jpg'
      });

      expect(result.id).toBe(testUser1.id);
      expect(result.firebase_uid).toBe(testUser1.firebase_uid);
      expect(result.email).toBe(testUser1.email);
      // Should return existing user data, not update it.
      expect(result.name).toBe(testUser1.name);
    });

    it('should create new user if not found and then clean up', async () => {
      const newTestSetup = await createTestSetup({ displayName: 'New Auth User' });

      const result = await AuthService.getOrCreateUser({
        uid: newTestSetup.userRecord.uid,
        email: newTestSetup.userRecord.email,
        name: 'New Auth User',
        picture: 'https://example.com/new.jpg'
      });

      expect(result.firebase_uid).toBe(newTestSetup.userRecord.uid);
      expect(result.email).toBe(newTestSetup.userRecord.email);
      expect(result.name).toBe('New Auth User');

      // *** FIX: Call the full cleanup function for the new user. ***
      await newTestSetup.cleanup();
    });

    it('should handle user with null name and picture and then clean up', async () => {
      const nullTestSetup = await createTestSetup({ displayName: 'Null User' });

      const result = await AuthService.getOrCreateUser({
        uid: nullTestSetup.userRecord.uid,
        email: nullTestSetup.userRecord.email,
        name: null,
        picture: null
      });

      expect(result.name).toBeNull();
      expect(result.avatar_url).toBeNull();

      // *** FIX: Add cleanup for the temporary user. ***
      await nullTestSetup.cleanup();
    });

    it('should handle user with undefined name and picture and then clean up', async () => {
      const undefinedTestSetup = await createTestSetup({ displayName: 'Undefined User' });

      const result = await AuthService.getOrCreateUser({
        uid: undefinedTestSetup.userRecord.uid,
        email: undefinedTestSetup.userRecord.email
      });

      expect(result.name).toBeNull();
      expect(result.avatar_url).toBeNull();

      // *** FIX: Add cleanup for the temporary user. ***
      await undefinedTestSetup.cleanup();
    });

    it('should return proper user selection fields', async () => {
      const result = await AuthService.getOrCreateUser({
        uid: testUser1.firebase_uid,
        email: testUser1.email,
        name: testUser1.name
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('firebase_uid');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });
  });

  // ... (rest of the tests remain the same)

  describe('hasAdminPermission', () => {
    it('should return true for report owner', async () => {
      const result = await AuthService.hasAdminPermission(testUser1.id, categoryId);
      expect(result).toBe(true);
    });

    it('should return false for non-owner without permissions', async () => {
      const result = await AuthService.hasAdminPermission(testUser2.id, categoryId);
      expect(result).toBe(false);
    });

    it('should return false for non-existent category', async () => {
      const result = await AuthService.hasAdminPermission(testUser1.id, 99999);
      expect(result).toBe(false);
    });

    it('should return true for user with explicit ADMIN permission', async () => {
      await prisma.categoryPermission.create({
        data: {
          user_id: testUser2.id,
          category_id: categoryId,
          role: 'ADMIN'
        }
      });

      const result = await AuthService.hasAdminPermission(testUser2.id, categoryId);
      expect(result).toBe(true);

      await prisma.categoryPermission.deleteMany({
        where: { user_id: testUser2.id, category_id: categoryId }
      });
    });
  });

  describe('getUserPermission', () => {
    it('should return ADMIN with source "owner" for report owner', async () => {
      const result = await AuthService.getUserPermission(testUser1.id, categoryId);
      expect(result).toEqual({ role: 'ADMIN', source: 'owner' });
    });

    it('should return null for user with no permissions', async () => {
      const result = await AuthService.getUserPermission(testUser2.id, categoryId);
      expect(result).toBeNull();
    });

    it('should return explicit permission with source "permission"', async () => {
      await prisma.categoryPermission.create({
        data: {
          user_id: testUser2.id,
          category_id: categoryId,
          role: 'REVIEWER'
        }
      });

      const result = await AuthService.getUserPermission(testUser2.id, categoryId);
      expect(result).toEqual({ role: 'REVIEWER', source: 'permission' });

      await prisma.categoryPermission.deleteMany({
        where: { user_id: testUser2.id, category_id: categoryId }
      });
    });
  });

  describe('validateCategory', () => {
    it('should return category with report details for valid category', async () => {
      const result = await AuthService.validateCategory(categoryId);
      expect(result.id).toBe(categoryId);
      expect(result.report).toBeDefined();
    });

    it('should throw error for non-existent category', async () => {
      await expect(AuthService.validateCategory(99999)).rejects.toThrow('Category not found');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors in getOrCreateUser', async () => {
      await expect(AuthService.getOrCreateUser({ uid: null, email: null })).rejects.toThrow();
    });
  });
});

const PermissionService = require('../src/services/permissionService');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('PermissionService Coverage Tests', () => {
  let testSetup1, testSetup2, testSetup3;
  let reportId, categoryId;
  let user1Id, user2Id, user3Id;

  beforeAll(async () => {
    console.log('🧪 Setting up PermissionService coverage tests...');

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Permission Test User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Permission Test User 2' });
    testSetup3 = await createTestSetup({ displayName: 'Permission Test User 3' });

    // Create users in database
    const user1 = await prisma.user.create({
      data: {
        firebase_uid: testSetup1.userRecord.uid,
        email: testSetup1.userRecord.email,
        name: testSetup1.userRecord.displayName
      }
    });

    const user2 = await prisma.user.create({
      data: {
        firebase_uid: testSetup2.userRecord.uid,
        email: testSetup2.userRecord.email,
        name: testSetup2.userRecord.displayName
      }
    });

    const user3 = await prisma.user.create({
      data: {
        firebase_uid: testSetup3.userRecord.uid,
        email: testSetup3.userRecord.email,
        name: testSetup3.userRecord.displayName
      }
    });

    user1Id = user1.id;
    user2Id = user2.id;
    user3Id = user3.id;

    // Create test report and category
    const report = await prisma.report.create({
      data: {
        name: 'Permission Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;

    const category = await prisma.category.create({
      data: {
        name: 'Permission Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up PermissionService coverage tests...');
    await testSetup1.cleanup();
    await testSetup2.cleanup();
    await testSetup3.cleanup();
  });

  describe('hasAdminPermission', () => {
    test('should return true for report owner', async () => {
      const hasPermission = await PermissionService.hasAdminPermission(user1Id, categoryId);
      expect(hasPermission).toBe(true);
    });

    test('should return false for non-owner with no permissions', async () => {
      const hasPermission = await PermissionService.hasAdminPermission(user2Id, categoryId);
      expect(hasPermission).toBe(false);
    });

    test('should return true for user with ADMIN role', async () => {
      // Grant ADMIN permission to user2
      await prisma.categoryPermission.create({
        data: {
          category_id: categoryId,
          user_id: user2Id,
          role: 'ADMIN'
        }
      });

      const hasPermission = await PermissionService.hasAdminPermission(user2Id, categoryId);
      expect(hasPermission).toBe(true);

      // Clean up
      await prisma.categoryPermission.deleteMany({
        where: { category_id: categoryId, user_id: user2Id }
      });
    });

    test('should throw error for non-existent category', async () => {
      await expect(PermissionService.hasAdminPermission(user1Id, 99999)).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('grantPermission', () => {
    test('should grant permission using database ID', async () => {
      const permission = await PermissionService.grantPermission(categoryId, user2Id, 'REVIEWER');

      expect(permission).toHaveProperty('id');
      expect(permission.role).toBe('REVIEWER');
      expect(permission.user.id).toBe(user2Id);
    });

    test('should grant permission using email', async () => {
      const permission = await PermissionService.grantPermission(
        categoryId,
        testSetup3.userRecord.email,
        'REVIEWER'
      );

      expect(permission).toHaveProperty('id');
      expect(permission.role).toBe('REVIEWER');
      expect(permission.user.id).toBe(user3Id);
    });

    test('should grant permission using Firebase UID', async () => {
      // First clean up existing permission for user3
      await prisma.categoryPermission.deleteMany({
        where: { category_id: categoryId, user_id: user3Id }
      });

      const permission = await PermissionService.grantPermission(
        categoryId,
        testSetup3.userRecord.uid,
        'ADMIN'
      );

      expect(permission).toHaveProperty('id');
      expect(permission.role).toBe('ADMIN');
      expect(permission.user.id).toBe(user3Id);
    });

    test('should update existing permission', async () => {
      // user3 already has ADMIN permission from previous test
      const permission = await PermissionService.grantPermission(categoryId, user3Id, 'REVIEWER');

      expect(permission.role).toBe('REVIEWER');
      expect(permission.user.id).toBe(user3Id);
    });

    test('should throw error for non-existent user with database ID', async () => {
      await expect(
        PermissionService.grantPermission(categoryId, 99999, 'REVIEWER')
      ).rejects.toThrow('User not found');
    });

    test('should throw error for non-existent user with email', async () => {
      await expect(
        PermissionService.grantPermission(categoryId, 'nonexistent@example.com', 'REVIEWER')
      ).rejects.toThrow('User not found');
    });

    test('should throw error for non-existent user with Firebase UID', async () => {
      await expect(
        PermissionService.grantPermission(categoryId, 'nonexistent-uid', 'REVIEWER')
      ).rejects.toThrow('User not found');
    });
  });

  describe('revokePermission', () => {
    test('should revoke existing permission', async () => {
      // Ensure user2 has a permission
      await PermissionService.grantPermission(categoryId, user2Id, 'REVIEWER');

      const revokedPermission = await PermissionService.revokePermission(categoryId, user2Id);

      expect(revokedPermission).toHaveProperty('id');
      expect(revokedPermission.user.id).toBe(user2Id);
    });

    test('should throw error when permission does not exist', async () => {
      await expect(PermissionService.revokePermission(categoryId, user2Id)).rejects.toThrow(
        'Permission not found'
      );
    });
  });

  describe('getCategoryPermissions', () => {
    test('should return list of permissions for category', async () => {
      // Grant permissions to multiple users
      await PermissionService.grantPermission(categoryId, user2Id, 'REVIEWER');
      await PermissionService.grantPermission(categoryId, user3Id, 'ADMIN');

      const permissions = await PermissionService.getCategoryPermissions(categoryId);

      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThanOrEqual(2);

      // Verify permissions contain user information
      permissions.forEach((permission) => {
        expect(permission).toHaveProperty('user');
        expect(permission.user).toHaveProperty('id');
        expect(permission.user).toHaveProperty('name');
        expect(permission.user).toHaveProperty('email');
      });
    });

    test('should return empty array for category with no permissions', async () => {
      // Create a new category without permissions
      const newCategory = await prisma.category.create({
        data: {
          name: 'Empty Category',
          report_id: reportId
        }
      });

      const permissions = await PermissionService.getCategoryPermissions(newCategory.id);

      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBe(0);

      // Clean up
      await prisma.category.delete({ where: { id: newCategory.id } });
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle non-numeric string that looks like a number', async () => {
      await expect(
        PermissionService.grantPermission(categoryId, '123abc', 'REVIEWER')
      ).rejects.toThrow('User not found');
    });

    test('should handle very large numeric strings', async () => {
      await expect(
        PermissionService.grantPermission(categoryId, '999999999999999', 'REVIEWER')
      ).rejects.toThrow(); // Just expect it to throw any error (database constraint)
    });

    test('should handle empty string user identifier', async () => {
      await expect(PermissionService.grantPermission(categoryId, '', 'REVIEWER')).rejects.toThrow(
        'User not found'
      );
    });
  });
});

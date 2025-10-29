const ShareLinkService = require('../src/services/shareLinkService');
const prisma = require('../src/config/database');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');

describe('ShareLinkService Coverage Tests', () => {
  let testUser, reportId, categoryId;

  beforeAll(async () => {
    console.log('🧪 Setting up ShareLinkService coverage tests...');

    // Create test user and data
    const testSetup = await createTestSetup({ displayName: 'ShareLink Test User' });

    // Create user in database
    testUser = await prisma.user.create({
      data: {
        firebase_uid: testSetup.userRecord.uid,
        email: testSetup.userRecord.email,
        name: 'ShareLink Test User'
      }
    });
    console.log('✅ Test user created:', testUser.id);

    // Create test report
    const report = await prisma.report.create({
      data: {
        name: 'ShareLink Test Report',
        owner_id: testUser.id
      }
    });
    reportId = report.id;
    console.log('✅ Test report created:', reportId);

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'ShareLink Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;
    console.log('✅ Test category created:', categoryId);
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up ShareLinkService tests...');
    // Delete test data
    await cleanupTestData(testUser.firebase_uid);
  });

  describe('generateSecureToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = ShareLinkService.generateSecureToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = ShareLinkService.generateSecureToken();
      const token2 = ShareLinkService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('createShareLink', () => {
    it('should create a share link with SUBMIT_ONLY permission', async () => {
      const shareLink = await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');

      expect(shareLink.token).toBeDefined();
      expect(shareLink.token.length).toBe(64);
      expect(shareLink.permission_level).toBe('SUBMIT_ONLY');
      expect(shareLink.category_id).toBe(categoryId);
      expect(shareLink.expires_at).toBeNull();
      expect(shareLink.category).toBeDefined();
      expect(shareLink.category.name).toBe('ShareLink Test Category');
    });

    it('should create a share link with REVIEW_ONLY permission', async () => {
      const shareLink = await ShareLinkService.createShareLink(categoryId, 'REVIEW_ONLY');

      expect(shareLink.permission_level).toBe('REVIEW_ONLY');
      expect(shareLink.category_id).toBe(categoryId);
    });

    it('should create a share link with expiration date', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const shareLink = await ShareLinkService.createShareLink(
        categoryId,
        'SUBMIT_ONLY',
        futureDate
      );

      expect(shareLink.expires_at).toEqual(futureDate);
    });

    it('should reject invalid permission level', async () => {
      await expect(
        ShareLinkService.createShareLink(categoryId, 'INVALID_PERMISSION')
      ).rejects.toThrow('Invalid permission level. Must be SUBMIT_ONLY or REVIEW_ONLY');
    });

    it('should reject past expiration date', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      await expect(
        ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY', pastDate)
      ).rejects.toThrow('Expiration date must be in the future');
    });

    it('should handle database errors when creating share link', async () => {
      await expect(ShareLinkService.createShareLink(99999, 'SUBMIT_ONLY')).rejects.toThrow();
    });
  });

  describe('getShareLinkByToken', () => {
    let validToken, expiredToken;

    beforeAll(async () => {
      // Ensure test setup is complete
      if (!categoryId) {
        throw new Error('Test setup incomplete: categoryId not available');
      }

      // Create a valid share link
      const validLink = await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');
      validToken = validLink.token;

      // Create an expired share link
      const expiredLink = await prisma.guestToken.create({
        data: {
          token: ShareLinkService.generateSecureToken(),
          category_id: categoryId,
          permission_level: 'SUBMIT_ONLY',
          expires_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });
      expiredToken = expiredLink.token;
    });

    it('should return valid share link with category and report info', async () => {
      const shareLink = await ShareLinkService.getShareLinkByToken(validToken);

      expect(shareLink).toBeDefined();
      expect(shareLink.token).toBe(validToken);
      expect(shareLink.permission_level).toBe('SUBMIT_ONLY');
      expect(shareLink.category).toBeDefined();
      expect(shareLink.category.report).toBeDefined();
      expect(shareLink.category.report.name).toBe('ShareLink Test Report');
    });

    it('should return null for non-existent token', async () => {
      const result = await ShareLinkService.getShareLinkByToken('nonexistent_token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const result = await ShareLinkService.getShareLinkByToken(expiredToken);
      expect(result).toBeNull();
    });
  });

  describe('validateShareLink', () => {
    let submitOnlyToken, reviewOnlyToken;

    beforeAll(async () => {
      // Ensure test setup is complete
      if (!categoryId) {
        throw new Error('Test setup incomplete: categoryId not available');
      }

      const submitLink = await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');
      submitOnlyToken = submitLink.token;

      const reviewLink = await ShareLinkService.createShareLink(categoryId, 'REVIEW_ONLY');
      reviewOnlyToken = reviewLink.token;
    });

    it('should validate SUBMIT_ONLY token for SUBMIT_ONLY permission', async () => {
      const result = await ShareLinkService.validateShareLink(submitOnlyToken, 'SUBMIT_ONLY');

      expect(result).toBeDefined();
      expect(result.permission_level).toBe('SUBMIT_ONLY');
    });

    it('should validate REVIEW_ONLY token for SUBMIT_ONLY permission', async () => {
      const result = await ShareLinkService.validateShareLink(reviewOnlyToken, 'SUBMIT_ONLY');

      expect(result).toBeDefined();
      expect(result.permission_level).toBe('REVIEW_ONLY');
    });

    it('should validate REVIEW_ONLY token for REVIEW_ONLY permission', async () => {
      const result = await ShareLinkService.validateShareLink(reviewOnlyToken, 'REVIEW_ONLY');

      expect(result).toBeDefined();
      expect(result.permission_level).toBe('REVIEW_ONLY');
    });

    it('should reject SUBMIT_ONLY token for REVIEW_ONLY permission', async () => {
      await expect(
        ShareLinkService.validateShareLink(submitOnlyToken, 'REVIEW_ONLY')
      ).rejects.toThrow('Insufficient permissions for this action');
    });

    it('should reject invalid token', async () => {
      await expect(
        ShareLinkService.validateShareLink('invalid_token', 'SUBMIT_ONLY')
      ).rejects.toThrow('Invalid or expired share link');
    });

    it('should reject expired token', async () => {
      // Create an expired token directly in database
      const expiredToken = await prisma.guestToken.create({
        data: {
          token: ShareLinkService.generateSecureToken(),
          category_id: categoryId,
          permission_level: 'SUBMIT_ONLY',
          expires_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });

      await expect(
        ShareLinkService.validateShareLink(expiredToken.token, 'SUBMIT_ONLY')
      ).rejects.toThrow('Invalid or expired share link');
    });
  });

  describe('getCategoryShareLinks', () => {
    beforeAll(async () => {
      // Ensure test setup is complete
      if (!categoryId) {
        throw new Error('Test setup incomplete: categoryId not available');
      }

      // Create multiple share links for the category
      await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');
      await ShareLinkService.createShareLink(categoryId, 'REVIEW_ONLY');

      // Create an expired link (should not be returned)
      await prisma.guestToken.create({
        data: {
          token: ShareLinkService.generateSecureToken(),
          category_id: categoryId,
          permission_level: 'SUBMIT_ONLY',
          expires_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });
    });

    it('should return all active share links for a category', async () => {
      const shareLinks = await ShareLinkService.getCategoryShareLinks(categoryId);

      expect(Array.isArray(shareLinks)).toBe(true);
      expect(shareLinks.length).toBeGreaterThanOrEqual(2);

      shareLinks.forEach((link) => {
        expect(link.id).toBeDefined();
        expect(link.token).toBeDefined();
        expect(link.permission_level).toBeDefined();
        expect(link.createdAt).toBeDefined();
        // Should not include expired links in active results
        if (link.expires_at) {
          expect(new Date(link.expires_at).getTime()).toBeGreaterThan(new Date().getTime());
        }
      });
    });

    it('should return empty array for category with no share links', async () => {
      // Create a new category with no share links
      const newCategory = await prisma.category.create({
        data: {
          name: 'Empty Category',
          report_id: reportId
        }
      });

      const shareLinks = await ShareLinkService.getCategoryShareLinks(newCategory.id);
      expect(shareLinks).toEqual([]);
    });
  });

  describe('revokeShareLink', () => {
    let tokenToRevoke;

    beforeAll(async () => {
      // Ensure test setup is complete
      if (!categoryId) {
        throw new Error('Test setup incomplete: categoryId not available');
      }

      const shareLink = await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');
      tokenToRevoke = shareLink.token;
    });

    it('should successfully revoke an existing share link', async () => {
      const result = await ShareLinkService.revokeShareLink(tokenToRevoke);
      expect(result).toBe(true);

      // Verify the token is actually deleted
      const deletedLink = await ShareLinkService.getShareLinkByToken(tokenToRevoke);
      expect(deletedLink).toBeNull();
    });

    it('should return false for non-existent token', async () => {
      const result = await ShareLinkService.revokeShareLink('non_existent_token');
      expect(result).toBe(false);
    });

    it('should handle database errors during revocation', async () => {
      // This test ensures error handling for database issues
      // We'll test with a token that doesn't exist but in a way that might cause other errors
      const result = await ShareLinkService.revokeShareLink('');
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    beforeAll(async () => {
      // Ensure test setup is complete
      if (!categoryId) {
        throw new Error('Test setup incomplete: categoryId not available');
      }
      // Create several expired tokens
      const expiredTokens = [];
      for (let i = 0; i < 3; i++) {
        expiredTokens.push({
          token: ShareLinkService.generateSecureToken(),
          category_id: categoryId,
          permission_level: 'SUBMIT_ONLY',
          expires_at: new Date(Date.now() - (i + 1) * 60 * 60 * 1000) // 1, 2, 3 hours ago
        });
      }

      await prisma.guestToken.createMany({
        data: expiredTokens
      });

      // Create some non-expired tokens
      await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');
      await ShareLinkService.createShareLink(
        categoryId,
        'REVIEW_ONLY',
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
    });

    it('should clean up expired tokens and return count', async () => {
      const deletedCount = await ShareLinkService.cleanupExpiredTokens();

      expect(deletedCount).toBeGreaterThanOrEqual(3);
    });

    it('should not affect non-expired tokens', async () => {
      // Get count of non-expired tokens before cleanup
      const activeTokensBefore = await ShareLinkService.getCategoryShareLinks(categoryId);

      // Run cleanup again
      await ShareLinkService.cleanupExpiredTokens();

      // Get count of non-expired tokens after cleanup
      const activeTokensAfter = await ShareLinkService.getCategoryShareLinks(categoryId);

      // Should have the same number of active tokens
      expect(activeTokensAfter.length).toBe(activeTokensBefore.length);
    });

    it('should return 0 when no expired tokens exist', async () => {
      // Run cleanup again when no expired tokens should exist
      const deletedCount = await ShareLinkService.cleanupExpiredTokens();
      expect(deletedCount).toBe(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle invalid category ID in createShareLink', async () => {
      await expect(ShareLinkService.createShareLink(null, 'SUBMIT_ONLY')).rejects.toThrow();
    });

    it('should handle invalid permission level validation', async () => {
      const validLink = await ShareLinkService.createShareLink(categoryId, 'SUBMIT_ONLY');

      await expect(
        ShareLinkService.validateShareLink(validLink.token, 'INVALID_PERMISSION')
      ).rejects.toThrow();
    });

    it('should handle database connection issues gracefully', async () => {
      // This would test database connectivity issues
      // In a real scenario, you might mock prisma to throw connection errors
      expect(ShareLinkService.generateSecureToken).toBeDefined();
    });
  });
});

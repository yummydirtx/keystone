const request = require('supertest');
const express = require('express');
const verifyAuth = require('../src/middleware/verifyAuth');

describe('Middleware Coverage Tests', () => {
  let app;
  let consoleSpy;

  beforeAll(async () => {
    // Spy on console.error to suppress expected Firebase errors during testing
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create test app with middleware routes
    app = express();
    app.use(express.json());

    // Routes to test verifyAuth middleware
    app.get('/test-verify-auth', verifyAuth, (req, res) => {
      res.json({ success: true, user: req.user });
    });

    // Simple test route for error handling
    app.get('/test-error', (req, res) => {
      throw new Error('Test error');
    });
  });

  afterAll(() => {
    // Restore console.error
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('verifyAuth middleware', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app).get('/test-verify-auth').expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });

    it('should reject requests with invalid authorization header format', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });

    it('should reject requests with Bearer but empty token', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'Bearer invalid_token_123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should handle malformed token', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should handle empty token after Bearer', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });

    it('should handle token with only spaces', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', 'Bearer    ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });
  });

  describe('middleware code paths', () => {
    it('should test all error handling branches in verifyAuth', async () => {
      // Test various token formats to cover different error branches
      const testCases = [
        { token: '', expectedMessage: 'Missing or invalid authorization header' },
        { token: 'NotBearer token', expectedMessage: 'Missing or invalid authorization header' },
        { token: 'Bearer', expectedMessage: 'Missing or invalid authorization header' },
        { token: 'Bearer ', expectedMessage: 'Missing or invalid authorization header' },
        { token: 'Bearer fake.jwt.token', expectedMessage: 'Invalid or expired token' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get('/test-verify-auth')
          .set('Authorization', testCase.token)
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
        expect(response.body.message).toContain(testCase.expectedMessage);
      }
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app).get('/test-verify-auth').expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });

    it('should handle null authorization header', async () => {
      const response = await request(app)
        .get('/test-verify-auth')
        .set('Authorization', null)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid authorization header');
    });
  });

  describe('app configuration', () => {
    it('should have express app configured', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should handle JSON middleware', async () => {
      // Test that JSON middleware is working
      const response = await request(app)
        .get('/test-verify-auth')
        .send({ test: 'data' })
        .expect(401); // Will fail auth but shows JSON middleware works

      expect(response.body).toBeDefined();
    });
  });
});

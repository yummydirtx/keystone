// test-firebase-tokens.js
// Simple test to verify Firebase Admin SDK token generation

const { createTestSetup } = require('./utils/testHelper');

describe('Firebase Token Generation Tests', () => {
  describe('Firebase Admin SDK', () => {
    test('should create test user and generate custom token', async () => {
      let testSetup;

      try {
        // Create test setup
        testSetup = await createTestSetup({
          email: `token-test-${Date.now()}@example.com`,
          displayName: 'Token Test User'
        });

        // Verify user was created
        expect(testSetup.userRecord).toBeDefined();
        expect(testSetup.userRecord.uid).toBeTruthy();
        expect(testSetup.userRecord.email).toBeTruthy();
        expect(testSetup.userRecord.displayName).toBe('Token Test User');

        // Verify custom token was generated
        expect(testSetup.customToken).toBeDefined();
        expect(typeof testSetup.customToken).toBe('string');
        expect(testSetup.customToken.length).toBeGreaterThan(100); // JWT tokens are long

        // Verify cleanup function exists
        expect(testSetup.cleanup).toBeDefined();
        expect(typeof testSetup.cleanup).toBe('function');

        console.log('✓ Successfully created Firebase user and token');
        console.log(`  User UID: ${testSetup.userRecord.uid}`);
        console.log(`  Token length: ${testSetup.customToken.length} characters`);
      } finally {
        // Clean up
        if (testSetup && testSetup.cleanup) {
          await testSetup.cleanup();
          console.log('✓ Cleaned up test user');
        }
      }
    }, 15000); // Longer timeout for Firebase operations

    test('should generate unique tokens for different users', async () => {
      const testSetups = [];

      try {
        // Create two different users
        const setup1 = await createTestSetup({
          email: `unique-test-1-${Date.now()}@example.com`,
          displayName: 'User One'
        });
        testSetups.push(setup1);

        const setup2 = await createTestSetup({
          email: `unique-test-2-${Date.now()}@example.com`,
          displayName: 'User Two'
        });
        testSetups.push(setup2);

        // Verify different UIDs
        expect(setup1.userRecord.uid).not.toBe(setup2.userRecord.uid);

        // Verify different tokens
        expect(setup1.customToken).not.toBe(setup2.customToken);

        // Verify different emails
        expect(setup1.userRecord.email).not.toBe(setup2.userRecord.email);

        console.log('✓ Successfully created unique users and tokens');
        console.log(`  User 1 UID: ${setup1.userRecord.uid}`);
        console.log(`  User 2 UID: ${setup2.userRecord.uid}`);
      } finally {
        // Clean up all test setups
        for (const setup of testSetups) {
          if (setup && setup.cleanup) {
            await setup.cleanup();
          }
        }
        console.log(`✓ Cleaned up ${testSetups.length} test users`);
      }
    }, 20000);

    test('should handle custom user properties', async () => {
      let testSetup;

      try {
        // Create user with custom properties
        testSetup = await createTestSetup({
          email: `custom-props-${Date.now()}@example.com`,
          displayName: 'Custom Props User',
          uid: `custom-uid-${Date.now()}`
        });

        // Verify custom properties were set
        expect(testSetup.userRecord.email).toContain('custom-props-');
        expect(testSetup.userRecord.displayName).toBe('Custom Props User');
        expect(testSetup.userRecord.uid).toContain('custom-uid-');

        console.log('✓ Successfully created user with custom properties');
      } finally {
        if (testSetup && testSetup.cleanup) {
          await testSetup.cleanup();
        }
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    test('should handle Firebase Admin SDK availability', async () => {
      // This test verifies our Firebase configuration is working
      expect(() => require('../src/config/firebase')).not.toThrow();
      console.log('✓ Firebase Admin SDK is properly configured');
    });

    test('should handle invalid user data gracefully', async () => {
      // Test with minimal user data
      let testSetup;

      try {
        testSetup = await createTestSetup({
          email: `minimal-${Date.now()}@example.com`
          // No displayName provided
        });

        expect(testSetup.userRecord).toBeDefined();
        expect(testSetup.customToken).toBeDefined();

        console.log('✓ Handled minimal user data gracefully');
      } finally {
        if (testSetup && testSetup.cleanup) {
          await testSetup.cleanup();
        }
      }
    });
  });
});

// Manual test runner
if (require.main === module) {
  console.log('Running Firebase token tests manually...');

  const runManualTest = async () => {
    try {
      console.log('Creating test user...');
      const setup = await createTestSetup({
        email: `manual-test-${Date.now()}@example.com`,
        displayName: 'Manual Test User'
      });

      console.log('User created:', setup.userRecord.uid);
      console.log('Token generated (first 50 chars):', setup.customToken.substring(0, 50) + '...');

      await setup.cleanup();
      console.log('Manual test completed successfully!');
    } catch (error) {
      console.error('Manual test failed:', error);
      process.exit(1);
    }
  };

  runManualTest();
}

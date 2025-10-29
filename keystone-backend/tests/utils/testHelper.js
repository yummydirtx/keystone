// testHelper.js
// Utility functions for testing with Firebase Admin SDK

const admin = require('../../src/config/firebase');

// Use the main Prisma client since we have proper database credentials now
const prisma = require('../../src/config/database');

/**
 * Create a custom Firebase token for testing
 * @param {string} uid - The user ID
 * @param {Object} claims - Additional claims to include in the token
 * @returns {Promise<string>} The custom token
 */
const createTestToken = async (uid, claims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
};

/**
 * Create a test user in Firebase Auth for testing
 * @param {Object} userData - User data
 * @returns {Promise<Object>} The created user record
 */
const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    uid: `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    email: `test-${Date.now()}@example.com`,
    displayName: 'Test User',
    ...userData
  };

  try {
    const userRecord = await admin.auth().createUser(defaultUserData);
    return userRecord;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

/**
 * Delete a test user from Firebase Auth
 * @param {string} uid - The user ID to delete
 */
const deleteTestUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    console.error('Error deleting test user:', error);
    // Don't throw here as this is cleanup
  }
};

/**
 * Clean up test data from the database
 * @param {string} firebaseUid - The Firebase UID to clean up data for
 */
const cleanupTestData = async (firebaseUid) => {
  try {
    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { firebase_uid: firebaseUid }
    });

    if (user) {
      // Delete in proper order to avoid foreign key constraints

      // First, delete all approvals for expenses in categories owned by this user
      await prisma.approval.deleteMany({
        where: {
          OR: [
            { user_id: user.id },
            {
              expense: {
                category: {
                  report: { owner_id: user.id }
                }
              }
            }
          ]
        }
      });

      // Then delete all expenses for categories owned by this user
      await prisma.expense.deleteMany({
        where: {
          OR: [
            { submitter_id: user.id },
            {
              category: {
                report: { owner_id: user.id }
              }
            }
          ]
        }
      });

      // Delete ALL category permissions for categories owned by this user (not just this user's permissions)
      await prisma.categoryPermission.deleteMany({
        where: {
          category: {
            report: { owner_id: user.id }
          }
        }
      });

      // Delete all guest tokens for categories owned by this user
      await prisma.guestToken.deleteMany({
        where: {
          category: {
            report: { owner_id: user.id }
          }
        }
      });

      // Delete all categories in reports owned by this user
      await prisma.category.deleteMany({
        where: {
          report: { owner_id: user.id }
        }
      });

      // Delete all reports owned by this user
      await prisma.report.deleteMany({
        where: { owner_id: user.id }
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error.message);
    // Don't throw here as this is cleanup
  }
};

/**
 * Clean up a test user by Firebase UID
 * @param {string} firebaseUid - The Firebase UID to clean up
 */
const cleanupTestUser = async (firebaseUid) => {
  await cleanupTestData(firebaseUid);
  await deleteTestUser(firebaseUid);
};

/**
 * Create a complete test setup with user and token
 * @param {Object} userData - Optional user data override
 * @returns {Promise<Object>} Object containing userRecord, customToken, and cleanup function
 */
const createTestSetup = async (userData = {}) => {
  const userRecord = await createTestUser(userData);
  const customToken = await createTestToken(userRecord.uid);

  const cleanup = async () => {
    await cleanupTestData(userRecord.uid);
    await deleteTestUser(userRecord.uid);
  };

  return {
    userRecord,
    customToken,
    cleanup
  };
};

/**
 * Mock Firebase decoded token for unit tests
 * @param {Object} tokenData - Token data to include
 * @returns {Object} Mock decoded token
 */
const createMockDecodedToken = (tokenData = {}) => {
  return {
    uid: `test-user-${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    iss: 'https://securetoken.google.com/keystone-a4799',
    aud: 'keystone-a4799',
    auth_time: Math.floor(Date.now() / 1000),
    user_id: `test-user-${Date.now()}`,
    sub: `test-user-${Date.now()}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    firebase: {
      identities: {},
      sign_in_provider: 'custom'
    },
    ...tokenData
  };
};

module.exports = {
  createTestToken,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  cleanupTestUser,
  createTestSetup,
  createMockDecodedToken
};

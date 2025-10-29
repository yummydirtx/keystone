const admin = require('firebase-admin');

describe('Firebase Config Tests', () => {
  test('should initialize Firebase Admin SDK when no app exists', () => {
    // This test ensures the firebase config module can be required
    // and that the initialization logic is covered
    const firebaseModule = require('../src/config/firebase');
    expect(firebaseModule).toBeDefined();
    expect(firebaseModule.apps.length).toBeGreaterThan(0);
  });

  test('should not reinitialize when app already exists', () => {
    // Since Firebase is already initialized from the previous test,
    // requiring it again should hit the else branch of the if condition
    const initialAppsCount = admin.apps.length;

    // Clear the module cache to force re-evaluation
    delete require.cache[require.resolve('../src/config/firebase')];

    // Mock admin.apps.length to return a truthy value
    const originalAppsLength = admin.apps.length;

    // Re-require the module - since admin.apps.length > 0, it won't reinitialize
    const firebaseModule = require('../src/config/firebase');

    expect(firebaseModule).toBeDefined();
    expect(admin.apps.length).toBe(originalAppsLength);
  });

  test('should handle Firebase initialization with correct configuration', () => {
    const firebaseModule = require('../src/config/firebase');

    // Verify the Firebase app is configured correctly
    expect(firebaseModule.apps[0]).toBeDefined();
    expect(firebaseModule.apps[0].options.projectId).toBe('keystone-a4799');
  });
});

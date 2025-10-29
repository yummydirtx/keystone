// Jest setup file
// This runs before all tests

require('dotenv').config({ path: '.env.test' });
const { disconnectTestDatabase } = require('./utils/testDatabase');

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  // Suppress console.warn during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      // Only show database and Firebase warnings if they're not expected
      const message = args.join(' ');
      if (!message.includes('No valid database URL') && !message.includes('Using mock client')) {
        originalWarn(...args);
      }
    };
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // Clean up database connections
  await disconnectTestDatabase();

  // Give Jest some time to clean up
  await new Promise((resolve) => setTimeout(resolve, 100));
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// testDatabase.js
// Test-specific database configuration with better error handling

const { PrismaClient } = require('@prisma/client');

let prisma;

// Create a singleton Prisma client for tests
const createTestPrismaClient = () => {
  if (!prisma) {
    try {
      // Use test database URL if available, otherwise skip database operations
      const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

      if (!databaseUrl || databaseUrl.includes('username:password')) {
        console.warn(
          '⚠️  No valid database URL found for tests. Database operations will be mocked.'
        );
        return createMockPrismaClient();
      }

      prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        },
        log: process.env.NODE_ENV === 'test' ? [] : ['error'] // Reduce logging in tests
      });
    } catch (error) {
      console.warn('⚠️  Failed to create Prisma client. Using mock client for tests.');
      return createMockPrismaClient();
    }
  }
  return prisma;
};

// Create a mock Prisma client for when database is not available
const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 1,
        firebase_uid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 })
    },
    report: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test Report',
        owner_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User'
        }
      }),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 })
    },
    $disconnect: jest.fn().mockResolvedValue(undefined)
  };
};

// Cleanup function for tests
const disconnectTestDatabase = async () => {
  if (prisma && typeof prisma.$disconnect === 'function') {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.warn('Warning: Error disconnecting from test database:', error.message);
    }
  }
};

module.exports = {
  createTestPrismaClient,
  disconnectTestDatabase
};

const { PrismaClient } = require('@prisma/client');

// Create a singleton instance of Prisma Client
const prisma = new PrismaClient();

module.exports = prisma;

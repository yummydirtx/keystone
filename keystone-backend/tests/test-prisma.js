// test-prisma.js
// This script verifies that the Prisma schema and client are working correctly.

// Import the PrismaClient class from the generated client library
const { PrismaClient } = require('@prisma/client');

// Create a new instance of the Prisma Client
const prisma = new PrismaClient();

// We wrap our test in an async function to use await
async function testPrismaConnection() {
  console.log('--- Testing Prisma Client Connection ---');
  try {
    // The .connect() method explicitly opens a connection.
    // This is a great way to test the initial connection.
    await prisma.$connect();
    console.log('✅ Prisma Client successfully connected to the database.');

    // Now, let's try a simple query to ensure the models are mapped correctly.
    // We'll try to find a user, which will return null but won't error if the query is valid.
    console.log('   -> Performing a test query on the "User" model...');
    const user = await prisma.user.findFirst();

    // If we get here, the query was successful, even if no user was found.
    console.log('✅ Test query executed successfully. The schema is working!');
    if (user === null) {
      console.log('   -> (As expected, no users were found in the new database)');
    }
  } catch (error) {
    console.error('❌ FAILED the Prisma connection test.');
    console.error('   Error:', error.message);
    console.error('   -> Check your DATABASE_URL in the .env file.');
    console.error('   -> Ensure the `prisma generate` command ran after the migration.');
  } finally {
    // IMPORTANT: Always disconnect the client when you're done.
    await prisma.$disconnect();
    console.log('   -> Prisma Client disconnected.');
  }
  console.log('\n--- Test Complete ---');
}

// --- Run the test ---
testPrismaConnection();

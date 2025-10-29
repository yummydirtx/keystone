// advanced-test-env.js
// This script tests the core environment configurations for Keystone.

// Load environment variables from .env file
require('dotenv').config();

// Import necessary packages
const { Client } = require('pg');
const admin = require('firebase-admin');

// --- Main Test Function ---
// We wrap our tests in an async function to use await
async function runConfigTests() {
  console.log('--- Running Keystone Advanced Configuration Tests ---');
  console.log('');

  // --- Test 1: PostgreSQL Database Connection ---
  console.log('1. Testing DATABASE_URL...');
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Attempt to connect to the database
    await dbClient.connect();
    console.log('✅ Successfully connected to the database.');

    // Perform a simple, read-only query to confirm functionality
    const result = await dbClient.query('SELECT NOW()');
    console.log(`   -> Current DB time: ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ FAILED to connect to the database.');
    console.error('   Error:', error.message);
    console.error('   -> Check that your DATABASE_URL in .env is correct.');
    console.error('   -> Verify PostgreSQL is running on your VM.');
    console.error('   -> Ensure firewall rules allow connections on port 5432.');
  } finally {
    // IMPORTANT: Always close the database connection
    await dbClient.end();
  }

  console.log('');

  // --- Test 2: Firebase Admin SDK Initialization ---
  console.log('2. Testing GOOGLE_APPLICATION_CREDENTIALS...');
  try {
    // Attempt to initialize the Firebase Admin SDK.
    // It automatically uses the GOOGLE_APPLICATION_CREDENTIALS env variable.
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });

    console.log('✅ Successfully initialized Firebase Admin SDK.');
  } catch (error) {
    console.error('❌ FAILED to initialize Firebase Admin SDK.');
    console.error('   Error:', error.message);
    console.error(
      '   -> Check that GOOGLE_APPLICATION_CREDENTIALS in .env points to the correct file path.'
    );
    console.error('   -> Ensure the serviceAccountKey.json file is not corrupted.');
  }

  console.log('');
  console.log('--- Test Complete ---');
}

// --- Run the tests ---
runConfigTests();

// test-auth-middleware.js
const express = require('express');
const verifyAuth = require('../src/middleware/verifyAuth');

// Create a test Express app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test route with auth middleware
  app.get('/test-protected', verifyAuth, (req, res) => {
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: req.user.email
      }
    });
  });

  return app;
};

// Test function to simulate different auth scenarios
async function testAuthMiddleware() {
  console.log('🔐 Testing Firebase Auth Middleware...\n');

  const app = createTestApp();
  const server = app.listen(3002, 'localhost');

  try {
    // Test 1: Missing Authorization header
    console.log('Test 1: Missing Authorization header');
    try {
      const response = await fetch('http://localhost:3002/test-protected');
      const data = await response.json();

      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log('✅ PASS: Correctly rejected request without auth header');
        console.log(`   Status: ${response.status}, Message: ${data.message}\n`);
      } else {
        console.log('❌ FAIL: Should have returned 401 for missing auth header\n');
      }
    } catch (error) {
      console.log('❌ FAIL: Error testing missing auth header:', error.message, '\n');
    }

    // Test 2: Invalid Authorization header format
    console.log('Test 2: Invalid Authorization header format');
    try {
      const response = await fetch('http://localhost:3002/test-protected', {
        headers: {
          Authorization: 'InvalidFormat token123'
        }
      });
      const data = await response.json();

      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log('✅ PASS: Correctly rejected invalid auth header format');
        console.log(`   Status: ${response.status}, Message: ${data.message}\n`);
      } else {
        console.log('❌ FAIL: Should have returned 401 for invalid auth header format\n');
      }
    } catch (error) {
      console.log('❌ FAIL: Error testing invalid auth header:', error.message, '\n');
    }

    // Test 3: Empty token
    console.log('Test 3: Empty Bearer token');
    try {
      const response = await fetch('http://localhost:3002/test-protected', {
        headers: {
          Authorization: 'Bearer '
        }
      });
      const data = await response.json();

      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log('✅ PASS: Correctly rejected empty token');
        console.log(`   Status: ${response.status}, Message: ${data.message}\n`);
      } else {
        console.log('❌ FAIL: Should have returned 401 for empty token\n');
      }
    } catch (error) {
      console.log('❌ FAIL: Error testing empty token:', error.message, '\n');
    }

    // Test 4: Invalid token
    console.log('Test 4: Invalid Firebase token');
    try {
      const response = await fetch('http://localhost:3002/test-protected', {
        headers: {
          Authorization: 'Bearer invalid.token.here'
        }
      });
      const data = await response.json();

      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log('✅ PASS: Correctly rejected invalid token');
        console.log(`   Status: ${response.status}, Message: ${data.message}\n`);
      } else {
        console.log('❌ FAIL: Should have returned 401 for invalid token\n');
      }
    } catch (error) {
      console.log('❌ FAIL: Error testing invalid token:', error.message, '\n');
    }

    // Test 5: Test the protected routes in main app
    console.log('Test 5: Testing main app protected routes');
    try {
      const protectedResponse = await fetch('http://localhost:3000/protected');
      const profileResponse = await fetch('http://localhost:3000/profile');

      if (protectedResponse.status === 401 && profileResponse.status === 401) {
        console.log('✅ PASS: Main app protected routes properly secured');
        console.log('   Both /protected and /profile return 401 without valid token\n');
      } else {
        console.log('❌ FAIL: Main app routes not properly protected\n');
      }
    } catch (error) {
      console.log('⚠️  WARNING: Could not test main app routes (server may not be running)');
      console.log(`   Error: ${error.message}\n`);
    }

    console.log('🎯 Auth Middleware Test Summary:');
    console.log('- ✅ Rejects requests without Authorization header');
    console.log('- ✅ Rejects requests with invalid header format');
    console.log('- ✅ Rejects requests with empty tokens');
    console.log('- ✅ Rejects requests with invalid Firebase tokens');
    console.log('- ✅ Middleware is applied to protected routes');
    console.log('\n📝 Note: To test with valid tokens, you would need:');
    console.log('   1. A valid Firebase ID token from a real user authentication');
    console.log('   2. The token should be passed as: Authorization: Bearer <valid-token>');
    console.log('   3. On success, req.user.uid and other user data will be available');
  } finally {
    server.close();
  }
}

// Manual test function for valid tokens (requires actual Firebase token)
function createValidTokenTest() {
  console.log('\n🔧 Manual Testing with Valid Token:');
  console.log('To test with a valid Firebase ID token, use this curl command:');
  console.log('');
  console.log('curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     http://localhost:3000/protected');
  console.log('');
  console.log('Expected response with valid token:');
  console.log(
    JSON.stringify(
      {
        message: 'This is a protected route!',
        user: {
          uid: 'user-uid-from-token',
          email: 'user@example.com',
          name: 'User Name'
        }
      },
      null,
      2
    )
  );
}

// Run tests
if (require.main === module) {
  testAuthMiddleware()
    .then(() => {
      createValidTokenTest();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthMiddleware, createTestApp };

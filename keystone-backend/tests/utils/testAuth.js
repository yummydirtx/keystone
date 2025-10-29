// testAuth.js
// Test-specific authentication middleware that can handle custom tokens

const admin = require('../../src/config/firebase');

/**
 * Test authentication middleware that can verify both ID tokens and custom tokens
 * For production, use the regular verifyAuth middleware
 */
const verifyTestAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // In test environment, handle custom tokens differently
    if (process.env.NODE_ENV === 'test') {
      try {
        // Try to verify as ID token first
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          emailVerified: decodedToken.email_verified
        };

        return next();
      } catch (idTokenError) {
        // If ID token fails, try to handle as custom token
        try {
          const customTokenDecoded = await verifyCustomToken(token);

          // Get the user record from Firebase Auth
          const userRecord = await admin.auth().getUser(customTokenDecoded.uid);

          req.user = {
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
            picture: userRecord.photoURL,
            emailVerified: userRecord.emailVerified
          };

          return next();
        } catch (customTokenError) {
          console.error('Custom token verification error:', customTokenError);
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
          });
        }
      }
    } else {
      // Production behavior - only verify ID tokens
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          emailVerified: decodedToken.email_verified
        };

        return next();
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Verify a custom token and extract the UID
 * This is a simplified version for testing purposes
 */
const verifyCustomToken = async (customToken) => {
  try {
    // Custom tokens are JWTs, we need to decode them to extract the UID
    const parts = customToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Firebase custom tokens have the UID in the 'uid' field
    if (!payload.uid) {
      throw new Error('No UID found in custom token');
    }

    return { uid: payload.uid };
  } catch (error) {
    throw new Error('Failed to decode custom token: ' + error.message);
  }
};

module.exports = verifyTestAuth;

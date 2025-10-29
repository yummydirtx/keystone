# Firebase Authentication Middleware for Express

This project implements a reusable Express middleware function (`verifyAuth`) that protects API endpoints by validating Firebase ID Tokens from the Authorization header.

## Features

✅ **Token Validation**: Successfully decodes and validates Firebase ID tokens  
✅ **User Data Attachment**: Decoded user payload (especially `uid`) is attached to the request object  
✅ **Security**: Returns 401 Unauthorized error for missing or invalid tokens  
✅ **Testing**: Comprehensive tests verify all functionality  
✅ **Demo Routes**: Protected dummy routes demonstrate real-world usage

## Installation

The required dependencies are already included in `package.json`:

```bash
npm install
```

Key dependencies:

- `firebase-admin`: Firebase Admin SDK for token verification
- `express`: Web framework
- `dotenv`: Environment variable management

## Usage

### Basic Implementation

```javascript
const express = require('express');
const verifyAuth = require('./src/middleware/verifyAuth');

const app = express();
app.use(express.json());

// Protected route
app.get('/protected', verifyAuth, (req, res) => {
  res.json({
    message: 'This is a protected route!',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    }
  });
});
```

### Request Format

Protected endpoints require an Authorization header with a valid Firebase ID token:

```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
     -H "Content-Type: application/json" \
     http://localhost:3000/protected
```

### Available User Data

After successful authentication, `req.user` contains:

```javascript
{
  uid: "user-unique-id",
  email: "user@example.com",
  emailVerified: true,
  name: "User Display Name",
  picture: "profile-picture-url",
  // ...other Firebase token claims
}
```

## API Endpoints

### Public Endpoints

- `GET /` - Public hello world endpoint
- `GET /health` - Health check endpoint

### Protected Endpoints (require authentication)

- `GET /protected` - Basic protected route demo
- `GET /profile` - User profile information

## Testing

### Run All Tests

```bash
npm test
```

### Manual Testing

1. **Start the server:**

```bash
npm start
```

2. **Test public endpoint:**

```bash
curl http://localhost:3000/
# Expected: "Hello, world!"
```

3. **Test protected endpoint without token:**

```bash
curl http://localhost:3000/protected
# Expected: {"error":"Unauthorized","message":"Missing or invalid authorization header..."}
```

4. **Test with invalid token:**

```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/protected
# Expected: {"error":"Unauthorized","message":"Invalid or expired token"}
```

5. **Test with valid Firebase token:**

```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" http://localhost:3000/protected
# Expected: User data and success message
```

## Error Handling

The middleware provides specific error messages for different scenarios:

| Scenario                     | Status Code | Error Message                           |
| ---------------------------- | ----------- | --------------------------------------- |
| Missing Authorization header | 401         | Missing or invalid authorization header |
| Invalid header format        | 401         | Missing or invalid authorization header |
| Empty token                  | 401         | No token provided                       |
| Expired token                | 401         | Token has expired                       |
| Revoked token                | 401         | Token has been revoked                  |
| Invalid token format         | 401         | Invalid token format                    |
| Other auth errors            | 401         | Invalid or expired token                |

## Advanced Usage

### Multiple Middlewares

```javascript
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required'
    });
  }
  next();
};

app.post('/sensitive-action', verifyAuth, requireEmailVerification, (req, res) => {
  // Handler code
});
```

### Router-level Protection

```javascript
const protectedRouter = express.Router();
protectedRouter.use(verifyAuth); // Apply to all routes

protectedRouter.get('/profile', (req, res) => {
  /* handler */
});
protectedRouter.get('/orders', (req, res) => {
  /* handler */
});

app.use('/api/user', protectedRouter);
```

## Firebase Configuration

The middleware uses Firebase Admin SDK with service account authentication. The configuration is in `src/config/firebase.js` and uses the service account key file `firebase-service-account.json`.

## File Structure

```
src/
├── config/
│   └── firebase.js          # Firebase Admin SDK configuration
├── middleware/
│   └── verifyAuth.js         # Main authentication middleware
└── index.js                  # Express app with demo routes

tests/
└── test-auth-middleware.js   # Comprehensive middleware tests

demo-auth-usage.js            # Advanced usage examples
```

## Getting Firebase ID Tokens

To obtain Firebase ID tokens for testing:

1. **Frontend Authentication**: Use Firebase Auth SDK in your frontend
2. **Manual Testing**: Use Firebase Admin SDK or Firebase CLI
3. **Postman/Testing**: Use Firebase Auth REST API

Example frontend code:

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
  const idToken = await userCredential.user.getIdToken();
  // Use idToken in Authorization header
});
```

## Security Notes

- ID tokens expire after 1 hour by default
- Tokens are verified against Firebase's public keys
- The middleware validates token signature, expiration, and issuer
- Always use HTTPS in production
- Consider implementing token refresh logic in your frontend

## Troubleshooting

### Common Issues

1. **"Token verification error"**: Check that Firebase Admin SDK is properly initialized
2. **"Invalid token format"**: Ensure token is a valid JWT format
3. **"Token has expired"**: Refresh the token in your frontend
4. **Connection errors**: Verify Firebase service account configuration

### Debug Mode

Enable detailed logging by checking the console output when token verification fails.

## Production Considerations

- Use environment variables for Firebase configuration
- Implement proper error logging
- Consider rate limiting for authentication endpoints
- Monitor failed authentication attempts
- Use HTTPS for all communications
- Implement token refresh mechanisms

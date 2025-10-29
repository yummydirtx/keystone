const express = require('express');
const { parseReceipt } = require('../controllers/aiController');
const verifyAuth = require('../middleware/verifyAuth');
const verifyGuestToken = require('../middleware/verifyGuestToken');

const router = express.Router();

/**
 * POST /api/ai/parse-receipt
 * Parse a receipt using AI
 *
 * For authenticated users:
 *   Headers: Authorization: Bearer <firebase_id_token>
 *
 * For guest users:
 *   Query params: token=<guest_token>
 *
 * Request body:
 * {
 *   "gsUri": "gs://bucket/path/to/receipt.jpg",
 *   "mimeType": "image/jpeg"
 * }
 */
// Allow both authenticated users and guest users to access this endpoint
// We'll check for either auth token or guest token in the middleware
router.post(
  '/parse-receipt',
  (req, res, next) => {
    // Check if this is a guest request (has token query param)
    if (req.query.token) {
      // Use guest token verification middleware
      return verifyGuestToken('SUBMIT_ONLY')(req, res, next);
    }

    // Check if this is an authenticated user request (has Authorization header)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use Firebase ID token verification middleware
      return verifyAuth(req, res, next);
    }

    // If neither, return error
    return res.status(401).json({
      error: 'Unauthorized',
      message:
        'Missing authentication. Please provide either a Firebase ID token (Authorization header) or guest token (token query parameter).'
    });
  },
  parseReceipt
);

module.exports = router;

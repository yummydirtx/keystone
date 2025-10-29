const shareLinkService = require('../services/shareLinkService');

/**
 * Express middleware to verify guest token
 * Validates the token from query parameters and attaches guest info to req.guest
 *
 * @param {string} requiredPermission - Required permission level ('SUBMIT_ONLY' or 'REVIEW_ONLY')
 * @returns {Function} Express middleware function
 */
const verifyGuestToken = (requiredPermission = 'SUBMIT_ONLY') => {
  return async (req, res, next) => {
    try {
      // Get the token from query parameters
      const token = req.query.token;

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing guest token parameter'
        });
      }

      // Validate the token
      const guestToken = await shareLinkService.validateShareLink(token, requiredPermission);

      // Attach the guest token information to the request object
      req.guest = {
        token: guestToken.token,
        permission_level: guestToken.permission_level,
        category_id: guestToken.category_id,
        category: guestToken.category,
        expires_at: guestToken.expires_at
      };

      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error('Guest token verification error:', error);

      if (error.message === 'Invalid or expired share link') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired guest token'
        });
      }

      if (error.message === 'Insufficient permissions for this action') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions for this action'
        });
      }

      // Generic error for any other issues
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Unable to verify guest token'
      });
    }
  };
};

module.exports = verifyGuestToken;

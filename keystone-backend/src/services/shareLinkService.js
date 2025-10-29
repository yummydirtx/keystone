const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

/**
 * Service for managing guest share links
 */
class ShareLinkService {
  /**
   * Generate a secure random token
   * @returns {string} - 64-character hex token
   */
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new share link for a category
   * @param {number} categoryId - Category ID
   * @param {string} permissionLevel - SUBMIT_ONLY or REVIEW_ONLY
   * @param {Date|null} expiresAt - Optional expiration date
   * @param {string|null} description - Optional description for the share link
   * @returns {Promise<Object>} - Created share link
   */
  async createShareLink(categoryId, permissionLevel, expiresAt = null, description = null) {
    if (!categoryId || !permissionLevel) {
      throw new Error('Category ID and permission level are required.');
    }

    // Validate permission level
    const validPermissions = ['SUBMIT_ONLY', 'REVIEW_ONLY'];
    if (!validPermissions.includes(permissionLevel)) {
      throw new Error('Invalid permission level. Must be SUBMIT_ONLY or REVIEW_ONLY');
    }

    // **FIX**: Convert the expiresAt string to a Date object if it exists.
    const expiryDate = expiresAt ? new Date(expiresAt) : null;

    // Validate expiration date
    if (expiryDate && expiryDate <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    // Generate secure token
    const token = this.generateSecureToken();

    // Create the guest token
    const guestToken = await prisma.guestToken.create({
      data: {
        token,
        category_id: parseInt(categoryId), // Ensure categoryId is an integer
        permission_level: permissionLevel,
        expires_at: expiryDate,
        description: description,
        status: 'active' // Set initial status
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return guestToken;
  }

  /**
   * Get a share link by token
   * @param {string} token - Token string
   * @returns {Promise<Object|null>} - Share link details or null if not found/expired/revoked
   */
  async getShareLinkByToken(token) {
    const guestToken = await prisma.guestToken.findUnique({
      where: { token },
      include: {
        category: {
          include: {
            report: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!guestToken) {
      return null;
    }

    // Check if token has been revoked
    if (guestToken.status !== 'active') {
      return null;
    }

    // Check if token has expired
    if (guestToken.expires_at && new Date() > guestToken.expires_at) {
      return null;
    }

    return guestToken;
  }

  /**
   * Validate a share link token
   * @param {string} token - Token string
   * @param {string} requiredPermission - Required permission level
   * @returns {Promise<Object>} - Validated token details
   */
  async validateShareLink(token, requiredPermission) {
    const link = await prisma.guestToken.findUnique({
      where: { token },
      include: {
        category: {
          include: {
            report: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!link) {
      throw new Error('Invalid or expired share link'); // Link doesn't exist
    }

    // Check 1: Has the link been revoked?
    if (link.status !== 'active') {
      throw new Error('Invalid or expired share link');
    }

    // Check 2: Has the link expired?
    if (link.expires_at && new Date() > new Date(link.expires_at)) {
      // Optional: Update the status to 'expired' in the database
      await prisma.guestToken.update({
        where: { id: link.id },
        data: { status: 'expired' }
      });
      throw new Error('Invalid or expired share link');
    }

    if (requiredPermission) {
      // Check if token has the required permission level
      const permissionHierarchy = {
        SUBMIT_ONLY: 1,
        REVIEW_ONLY: 2
      };

      const tokenLevel = permissionHierarchy[link.permission_level];
      const requiredLevel = permissionHierarchy[requiredPermission];

      // Validate that the required permission is valid
      if (requiredLevel === undefined) {
        throw new Error('Invalid permission level');
      }

      if (tokenLevel < requiredLevel) {
        throw new Error('Insufficient permissions for this action');
      }
    }

    return link; // Link is valid
  }

  /**
   * Get all share links for a category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>} - List of active share links
   */
  async getCategoryShareLinks(categoryId) {
    return await prisma.guestToken.findMany({
      where: {
        category_id: categoryId,
        status: 'active', // Only get active links
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }]
      },
      select: {
        id: true,
        token: true,
        permission_level: true,
        expires_at: true,
        description: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Revoke a share link
   * @param {string} token - Token to revoke
   * @returns {Promise<boolean>} - Whether the token was found and deleted
   */
  async revokeShareLink(token) {
    try {
      await prisma.guestToken.delete({
        where: { token }
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        // Record not found
        return false;
      }
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} - Number of tokens deleted
   */
  async cleanupExpiredTokens() {
    const now = new Date();
    const result = await prisma.guestToken.deleteMany({
      where: {
        OR: [{ status: 'expired' }, { expires_at: { lt: now } }]
      }
    });

    return result.count;
  }
}

module.exports = new ShareLinkService();

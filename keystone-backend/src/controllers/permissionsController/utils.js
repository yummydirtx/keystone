const { PrismaClient } = require('@prisma/client');
const authService = require('../../services/authService');
const prisma = new PrismaClient();

/**
 * Get current user from request (middleware or Firebase lookup)
 */
const getCurrentUser = async (req) => {
  let currentUser = req.dbUser;
  if (!currentUser && req.user) {
    currentUser = await authService.getOrCreateUser(req.user);
  }
  return currentUser;
};

/**
 * Validate category ID parameter
 */
const validateCategoryId = (categoryId, res) => {
  const categoryIdInt = parseInt(categoryId);
  if (isNaN(categoryIdInt)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid categoryId'
    });
    return null;
  }
  return categoryIdInt;
};

/**
 * Validate permission role
 */
const validateRole = (role, res) => {
  if (!role) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'role is required'
    });
    return null;
  }

  if (!['SUBMITTER', 'REVIEWER', 'ADMIN'].includes(role)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'role must be either SUBMITTER, REVIEWER or ADMIN'
    });
    return null;
  }

  return role;
};

/**
 * Validate share link permission level
 */
const validatePermissionLevel = (permissionLevel, res) => {
  if (!permissionLevel) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'permission_level is required'
    });
    return null;
  }

  if (!['SUBMIT_ONLY', 'REVIEW_ONLY'].includes(permissionLevel)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'permission_level must be either SUBMIT_ONLY or REVIEW_ONLY'
    });
    return null;
  }

  return permissionLevel;
};

/**
 * Validate and parse expiration date
 */
const validateExpirationDate = (expiresAt, res) => {
  if (!expiresAt) {
    return null;
  }

  const parsedDate = new Date(expiresAt);
  if (isNaN(parsedDate.getTime())) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid expires_at date format'
    });
    return false;
  }

  if (parsedDate <= new Date()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'expires_at must be in the future'
    });
    return false;
  }

  return parsedDate;
};

/**
 * Check if user has admin permission and validate category
 */
const validateAdminPermission = async (userId, categoryId, res) => {
  try {
    // Validate category exists
    await authService.validateCategory(categoryId);

    // Check if current user has ADMIN permission on this category
    const hasAdminPermission = await authService.hasAdminPermission(userId, categoryId);
    if (!hasAdminPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'ADMIN role required to manage permissions'
      });
      return false;
    }

    return true;
  } catch (error) {
    if (error.message === 'Category not found') {
      res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
      return false;
    }
    throw error;
  }
};

/**
 * Convert userId (could be Firebase UID or DB ID) to database ID
 */
const getUserDatabaseId = async (userId) => {
  if (!isNaN(parseInt(userId))) {
    return parseInt(userId);
  } else {
    // If not a number, treat as Firebase UID - find the user first
    const user = await prisma.user.findUnique({
      where: { firebase_uid: userId },
      select: { id: true }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  }
};

module.exports = {
  prisma,
  getCurrentUser,
  validateCategoryId,
  validateRole,
  validatePermissionLevel,
  validateExpirationDate,
  validateAdminPermission,
  getUserDatabaseId
};

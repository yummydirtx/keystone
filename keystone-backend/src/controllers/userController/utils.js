const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (uid) => {
  return await prisma.user.findUnique({
    where: { firebase_uid: uid },
    select: {
      id: true,
      firebase_uid: true,
      email: true,
      name: true,
      avatar_url: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

/**
 * Validate user input data
 */
const validateUserInput = (name, avatar_url) => {
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('Name must be a non-empty string');
  }

  if (avatar_url !== undefined && typeof avatar_url !== 'string') {
    errors.push('Avatar URL must be a string');
  }

  return errors;
};

/**
 * Prepare user update data
 */
const prepareUpdateData = (name, avatar_url) => {
  const updateData = {};

  if (name !== undefined) {
    updateData.name = name.trim() || null;
  }

  if (avatar_url !== undefined) {
    updateData.avatar_url = avatar_url.trim() || null;
  }

  return updateData;
};

/**
 * Format user object for API response
 */
const formatUserResponse = (user) => ({
  id: user.id,
  firebase_uid: user.firebase_uid,
  email: user.email,
  name: user.name,
  avatar_url: user.avatar_url,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

/**
 * Handle Prisma unique constraint errors
 */
const handleUniqueConstraintError = (error, res) => {
  if (error.code === 'P2002') {
    if (error.meta?.target?.includes('email')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email already exists'
      });
    }
    if (error.meta?.target?.includes('firebase_uid')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this Firebase UID already exists'
      });
    }
  }
  return null;
};

module.exports = {
  prisma,
  getUserByFirebaseUid,
  validateUserInput,
  prepareUpdateData,
  formatUserResponse,
  handleUniqueConstraintError
};

const { prisma, formatUserResponse, handleUniqueConstraintError } = require('./utils');

/**
 * Sync user from Firebase to local database
 * POST /api/users/sync
 */
const syncUser = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;

    if (!uid || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required user information (uid or email)'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { firebase_uid: uid }
    });

    if (existingUser) {
      // User already exists, return their profile
      return res.status(200).json({
        message: 'User already exists',
        user: formatUserResponse(existingUser)
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firebase_uid: uid,
        email: email ? email.toLowerCase() : email,
        name: name || null,
        avatar_url: picture || null
      }
    });

    res.status(201).json({
      message: 'User synced successfully',
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Error syncing user:', error);

    // Handle unique constraint violations
    const constraintError = handleUniqueConstraintError(error, res);
    if (constraintError) return;

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync user to database'
    });
  }
};

module.exports = { syncUser };

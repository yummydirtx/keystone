const { getUserByFirebaseUid } = require('./utils');

/**
 * Get current user profile
 * GET /api/users/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;

    const user = await getUserByFirebaseUid(uid);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    res.status(200).json({
      user: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile'
    });
  }
};

module.exports = { getCurrentUser };

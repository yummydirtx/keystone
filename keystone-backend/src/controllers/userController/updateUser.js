const { prisma, validateUserInput, prepareUpdateData, formatUserResponse } = require('./utils');

/**
 * Update current user profile
 * PUT /api/users/me
 */
const updateCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, avatar_url } = req.body;

    // Validate input
    const validationErrors = validateUserInput(name, avatar_url);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validationErrors[0]
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { firebase_uid: uid }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    // Prepare update data
    const updateData = prepareUpdateData(name, avatar_url);

    // If no valid updates provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid update fields provided (name, avatar_url)'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { firebase_uid: uid },
      data: updateData,
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

    res.status(200).json({
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user profile'
    });
  }
};

module.exports = { updateCurrentUser };

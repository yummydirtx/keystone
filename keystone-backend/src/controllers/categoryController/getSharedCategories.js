const { prisma, getUserByFirebaseUid } = require('./utils');
const { getDeletedEntitiesSince } = require('../../utils/deletionLogger');

/**
 * Get all categories shared with the current user
 * GET /api/users/me/categories
 */
const getSharedCategories = async (req, res) => {
  try {
    const { uid } = req.user;
    const { since } = req.query;

    // Get the user record
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    // Build where clause for permissions
    const whereClause = {
      user_id: user.id
    };

    let deletedSharedCategoryIds = [];

    // Add timestamp filter for incremental fetching
    if (since) {
      const sinceDate = new Date(parseInt(since));
      if (!isNaN(sinceDate.getTime())) {
        whereClause.updatedAt = {
          gt: sinceDate
        };

        // Get deleted shared category IDs since the timestamp
        deletedSharedCategoryIds = getDeletedEntitiesSince('shared_category', user.id, sinceDate);
      }
    }

    // Get all category permissions for the user
    const permissions = await prisma.categoryPermission.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        category: {
          include: {
            report: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar_url: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Format the response - only include categories explicitly shared with the user
    const sharedCategories = permissions.map((permission) => ({
      role: permission.role,
      category: {
        id: permission.category.id,
        name: permission.category.name,
        report: permission.category.report
      }
    }));

    const response = {
      message: 'Shared categories retrieved successfully',
      sharedCategories
    };

    // Include deleted IDs if this is an incremental request
    if (since && deletedSharedCategoryIds.length > 0) {
      response.deletedIds = deletedSharedCategoryIds;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting shared categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve shared categories'
    });
  }
};

module.exports = { getSharedCategories };

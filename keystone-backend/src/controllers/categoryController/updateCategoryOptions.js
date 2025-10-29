const { prisma, getUserByFirebaseUid } = require('./utils');

/**
 * Update category options
 * PUT /api/categories/:categoryId/options
 */
const updateCategoryOptions = async (req, res) => {
  try {
    const { uid } = req.user;
    const categoryId = parseInt(req.params.categoryId);
    const { requireReceiptForApproval } = req.body;

    // Validate categoryId
    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }

    // Get user from Firebase UID
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if category exists and user has ADMIN permission
    // The middleware already handles permission checking, but let's verify the category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        report: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Update category options
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        require_receipt: requireReceiptForApproval ?? false,
        // Add other options here as they get implemented
      },
      include: {
        report: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Category options updated successfully',
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        require_receipt: updatedCategory.require_receipt,
        report: updatedCategory.report
      }
    });
  } catch (error) {
    console.error('Error updating category options:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category options'
    });
  }
};

module.exports = { updateCategoryOptions };

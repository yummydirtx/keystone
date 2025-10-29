const prisma = require('../../config/database');
const { getUserByFirebaseUid } = require('./utils');
const { logDeletion } = require('../../utils/deletionLogger');

/**
 * Delete a category
 * DELETE /api/categories/:categoryId
 *
 * Deletes a category and all related data (expenses, permissions, guest tokens).
 * Child categories will also be deleted (cascade).
 * If this is the root category (no parent), the associated report will be deleted.
 * Requires ADMIN permission on the category.
 */
async function deleteCategory(req, res) {
  const { categoryId } = req.params;
  const userId = req.user.uid;

  try {
    // Convert categoryId to integer
    const categoryIdInt = parseInt(categoryId);
    if (isNaN(categoryIdInt)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }

    // Get current user
    const user = await getUserByFirebaseUid(userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Fetch the category - permission checking is already done by middleware
    const category = await prisma.category.findUnique({
      where: { id: categoryIdInt },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            owner_id: true
          }
        },
        permissions: {
          select: {
            user_id: true,
            role: true
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

    // Get all users who had permissions on this category (for shared category deletion logging)
    const usersWithPermissions = category.permissions.map((p) => p.user_id);

    // If this is the root category (no parent), delete the entire report
    if (!category.parent_category_id) {
      await prisma.report.delete({
        where: {
          id: category.report_id
        }
      });

      // Log report deletion for the owner
      await logDeletion('report', category.report_id, user.id, {
        name: category.report.name,
        ownerId: category.report.owner_id
      });

      res.status(200).json({
        message: 'Root category and associated report deleted successfully',
        categoryId: categoryIdInt,
        reportId: category.report_id
      });
    } else {
      // Delete just the category (cascade deletes will handle child categories)
      await prisma.category.delete({
        where: {
          id: categoryIdInt
        }
      });

      res.status(200).json({
        message: 'Category deleted successfully',
        categoryId: categoryIdInt
      });
    }

    // Log shared category deletion for all users who had permissions
    for (const permittedUserId of usersWithPermissions) {
      await logDeletion('shared_category', categoryIdInt, permittedUserId, {
        categoryName: category.name,
        reportId: category.report_id,
        reportName: category.report.name
      });
    }
  } catch (error) {
    console.error('Error deleting category:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category'
    });
  }
}

module.exports = { deleteCategory };

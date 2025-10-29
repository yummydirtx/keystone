const {
  prisma,
  validateCategoryId,
  formatCategoryResponse,
  getUserByFirebaseUid,
  getUserRoleForCategory
} = require('./utils');

/**
 * Update a category's name or budget
 * PUT /api/categories/:categoryId
 */
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, budget, require_receipt, allow_guest_submissions, allow_user_submissions } = req.body;

    // Validate categoryId
    const categoryIdInt = validateCategoryId(categoryId, res);
    if (!categoryIdInt) return;

    // Get current user
    const user = await getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Check user permissions for this category
    const userRole = await getUserRoleForCategory(user.id, categoryIdInt);
    if (!userRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this category'
      });
    }

    // Check if user is trying to update name and has appropriate permissions
    // ADMIN users can edit any category, REVIEWER users can edit subcategories
    if (name && userRole !== 'ADMIN') {
      // For REVIEWER users, check if this is a subcategory they have permission to edit
      if (userRole === 'REVIEWER') {
        const category = await prisma.category.findUnique({
          where: { id: categoryIdInt },
          include: {
            parent_category: true
          }
        });

        // REVIEWER can only edit subcategories (categories with a parent)
        if (!category || !category.parent_category) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Only users with ADMIN permissions can edit category names'
          });
        }
      } else {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only users with ADMIN permissions can edit category names'
        });
      }
    }

    // Validate that at least one field is being updated
    if ((!name || !name.trim()) && budget === undefined && require_receipt === undefined && 
        allow_guest_submissions === undefined && allow_user_submissions === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field must be provided for update'
      });
    }

    // Validate name if provided
    if (name && !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category name cannot be empty'
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryIdInt },
      include: {
        report: {
          select: {
            id: true,
            name: true
          }
        },
        parent_category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // If updating name and this is a root category (no parent), also update the report name
    if (name && !existingCategory.parent_category) {
      try {
        await prisma.report.update({
          where: { id: existingCategory.report.id },
          data: { name: name.trim() }
        });
      } catch (error) {
        console.error('Error updating report name:', error);
        // Continue with category update even if report update fails
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) {
      updateData.name = name.trim();
    }
    if (budget !== undefined) {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Budget must be a non-negative number'
        });
      }
      updateData.budget = budgetNum;
    }
    if (require_receipt !== undefined) {
      updateData.require_receipt = Boolean(require_receipt);
    }
    if (allow_guest_submissions !== undefined) {
      updateData.allow_guest_submissions = Boolean(allow_guest_submissions);
    }
    if (allow_user_submissions !== undefined) {
      updateData.allow_user_submissions = Boolean(allow_user_submissions);
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryIdInt },
      data: updateData,
      include: {
        parent_category: {
          select: {
            id: true,
            name: true
          }
        },
        report: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            expenses: true,
            child_categories: true
          }
        }
      }
    });

    res.json({
      message: 'Category updated successfully',
      category: formatCategoryResponse(updatedCategory)
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category'
    });
  }
};

module.exports = { updateCategory };

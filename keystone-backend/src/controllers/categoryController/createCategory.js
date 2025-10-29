const {
  prisma,
  validateReportId,
  validateCategoryName,
  formatCategoryResponse
} = require('./utils');

/**
 * Create a new category within a report
 * POST /api/reports/:reportId/categories
 */
const createCategory = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { name, budget, parentCategoryId } = req.body;

    // Validate reportId
    const reportIdInt = validateReportId(reportId, res);
    if (!reportIdInt) return;

    // Validate name
    const validName = validateCategoryName(name, res);
    if (!validName) return;

    // Validate that the report exists
    const report = await prisma.report.findUnique({
      where: { id: reportIdInt }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    // If parentCategoryId is provided, validate it exists and belongs to the same report
    if (parentCategoryId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parseInt(parentCategoryId) }
      });

      if (!parentCategory) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Parent category not found'
        });
      }

      if (parentCategory.report_id !== reportIdInt) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Parent category must belong to the same report'
        });
      }
    }

    // Validate budget if provided
    if (budget !== undefined && budget !== null) {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Budget must be a non-negative number'
        });
      }
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: validName,
        budget: budget ? parseFloat(budget) : 0.0,
        report_id: reportIdInt,
        parent_category_id: parentCategoryId ? parseInt(parentCategoryId) : null
      },
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
        }
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category: formatCategoryResponse(category)
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category'
    });
  }
};

module.exports = { createCategory };

const { prisma, getOrCreateUser, formatReportResponse } = require('./utils');

/**
 * Create a new report for the authenticated user
 * POST /api/reports
 */
const createReport = async (req, res) => {
  try {
    const { name, budget } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Report name is required'
      });
    }

    // Validate budget if provided
    if (budget !== undefined && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Budget must be a non-negative number'
      });
    }

    // Find or create user in database based on Firebase UID
    const user = await getOrCreateUser(req.user);

    // Use a transaction to create both report and default category
    const result = await prisma.$transaction(async (tx) => {
      // Create the report
      const report = await tx.report.create({
        data: {
          name: name,
          owner_id: user.id
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create the default root category with the same name as the report
      const defaultCategory = await tx.category.create({
        data: {
          name: name, // Same name as the report
          report_id: report.id,
          parent_category_id: null, // Root category has no parent
          budget: budget !== undefined ? parseFloat(budget) : 0.0 // Use provided budget or default to 0.00
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

      return { report, defaultCategory };
    });

    res.status(201).json({
      message: 'Report created successfully',
      report: formatReportResponse(result.report),
      defaultCategory: {
        id: result.defaultCategory.id,
        name: result.defaultCategory.name,
        budget: result.defaultCategory.budget.toString(),
        parentCategory: null,
        report: result.defaultCategory.report,
        createdAt: result.defaultCategory.createdAt,
        updatedAt: result.defaultCategory.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create report'
    });
  }
};

module.exports = { createReport };

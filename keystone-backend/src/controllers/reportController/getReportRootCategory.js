const { prisma, validateReportId, checkReportViewPermission } = require('./utils');

/**
 * Get the root category for a specific report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Root category for the report
 */
async function getReportRootCategory(req, res) {
  try {
    const { reportId } = req.params;
    const userId = req.dbUser.id;

    // Validate reportId
    const reportIdInt = validateReportId(reportId, res);
    if (!reportIdInt) return;

    // Check if user has permission to view this report
    const { hasPermission, report } = await checkReportViewPermission(reportIdInt, userId);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Get the root category for this report (category with the same name as the report and no parent)
    const rootCategory = await prisma.category.findFirst({
      where: {
        report_id: reportIdInt,
        name: report.name,
        parent_category_id: null
      },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            owner_id: true
          }
        }
      }
    });

    if (!rootCategory) {
      return res.status(404).json({
        status: 'error',
        message: 'Root category not found for this report'
      });
    }

    // Format the response to match the original structure
    const formattedCategory = {
      id: rootCategory.id,
      name: rootCategory.name,
      budget: rootCategory.budget,
      parent_category_id: rootCategory.parent_category_id,
      report_id: rootCategory.report_id,
      created_at: rootCategory.createdAt,
      updated_at: rootCategory.updatedAt,
      report_name: rootCategory.report.name,
      report_owner_id: rootCategory.report.owner_id
    };

    res.json({
      status: 'success',
      message: 'Root category retrieved successfully',
      data: {
        category: formattedCategory
      }
    });
  } catch (error) {
    console.error('Error getting report root category:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

module.exports = { getReportRootCategory };

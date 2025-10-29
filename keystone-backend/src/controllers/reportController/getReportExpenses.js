const {
  prisma,
  validateReportId,
  getUserByFirebaseUid,
  checkReportViewPermission,
  formatExpenseResponse
} = require('./utils');

/**
 * Get all expenses for a specific report
 * GET /api/reports/:reportId/expenses
 */
const getReportExpenses = async (req, res) => {
  try {
    const { uid } = req.user;
    const { reportId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    // Validate reportId
    const reportIdInt = validateReportId(reportId, res);
    if (!reportIdInt) return;

    // Get the user record
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    // Check permissions
    const { hasPermission, report } = await checkReportViewPermission(reportIdInt, user.id);

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view expenses for this report'
      });
    }

    // Build where clause
    const whereClause = {
      report_id: reportIdInt
    };

    if (status) {
      whereClause.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get expenses with pagination
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        transaction_date: 'desc'
      },
      skip,
      take
    });

    // Get total count for pagination
    const totalCount = await prisma.expense.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalCount / take);

    res.status(200).json({
      message: 'Report expenses retrieved successfully',
      expenses: expenses.map(formatExpenseResponse),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting report expenses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve report expenses'
    });
  }
};

module.exports = { getReportExpenses };

const {
  prisma,
  getOrCreateUser,
  validateReportId,
  getUserByFirebaseUid,
  checkReportViewPermission,
  formatReportResponse
} = require('./utils');

/**
 * Get all reports owned by the authenticated user
 * GET /api/reports
 */
const getReports = async (req, res) => {
  try {
    // Find user in database
    const user = await getOrCreateUser(req.user);

    // Get all reports owned by the user
    const reports = await prisma.report.findMany({
      where: {
        owner_id: user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            categories: true,
            expenses: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      message: 'Reports retrieved successfully',
      reports: reports.map(formatReportResponse)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve reports'
    });
  }
};

/**
 * Get a specific report by ID
 * GET /api/reports/:reportId
 */
const getReport = async (req, res) => {
  try {
    const { uid } = req.user;
    const { reportId } = req.params;

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

    // Check permissions and get report
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
        message: 'You do not have permission to view this report'
      });
    }

    // Get the report with detailed information
    const detailedReport = await prisma.report.findUnique({
      where: { id: reportIdInt },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: {
          include: {
            _count: {
              select: {
                expenses: true
              }
            }
          }
        },
        _count: {
          select: {
            categories: true,
            expenses: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Report retrieved successfully',
      report: formatReportResponse(detailedReport)
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve report'
    });
  }
};

module.exports = { getReports, getReport };

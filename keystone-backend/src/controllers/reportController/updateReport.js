const { prisma, validateReportId, getUserByFirebaseUid, formatReportResponse } = require('./utils');

/**
 * Update a specific report
 * PUT /api/reports/:reportId
 */
const updateReport = async (req, res) => {
  try {
    const { uid } = req.user;
    const { reportId } = req.params;
    const { name } = req.body;

    // Validate reportId
    const reportIdInt = validateReportId(reportId, res);
    if (!reportIdInt) return;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Report name is required'
      });
    }

    // Get the user record
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    // Get the report
    const report = await prisma.report.findUnique({
      where: { id: reportIdInt }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    // Check if user is the owner
    if (report.owner_id !== user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the report owner can update the report'
      });
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id: reportIdInt },
      data: {
        name: name.trim()
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
      }
    });

    res.status(200).json({
      message: 'Report updated successfully',
      report: formatReportResponse(updatedReport)
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update report'
    });
  }
};

module.exports = { updateReport };

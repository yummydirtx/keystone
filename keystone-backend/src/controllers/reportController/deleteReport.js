const { prisma, validateReportId, getUserByFirebaseUid } = require('./utils');
const { logDeletion } = require('../../utils/deletionLogger');

/**
 * Delete a specific report
 * DELETE /api/reports/:reportId
 */
const deleteReport = async (req, res) => {
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
        message: 'Only the report owner can delete the report'
      });
    }

    // Delete the report - cascade deletes will handle all related records
    await prisma.report.delete({
      where: { id: reportIdInt }
    });

    // Log the deletion for incremental updates
    await logDeletion('report', reportIdInt, user.id, {
      name: report.name,
      ownerId: report.owner_id
    });

    res.status(200).json({
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete report'
    });
  }
};

module.exports = { deleteReport };

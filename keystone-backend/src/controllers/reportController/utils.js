const prisma = require('../../config/database');

/**
 * Get user by Firebase UID or create if doesn't exist
 */
const getOrCreateUser = async (firebaseUser) => {
  let user = await prisma.user.findUnique({
    where: { firebase_uid: firebaseUser.uid }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email ? firebaseUser.email.toLowerCase() : firebaseUser.email,
        name: firebaseUser.name || null,
        avatar_url: firebaseUser.picture || null
      }
    });
  }

  return user;
};

/**
 * Validate report ID parameter
 */
const validateReportId = (reportId, res) => {
  const reportIdInt = parseInt(reportId);
  if (isNaN(reportIdInt)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid report ID'
    });
    return null;
  }
  return reportIdInt;
};

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (uid) => {
  return await prisma.user.findUnique({
    where: { firebase_uid: uid }
  });
};

/**
 * Check if user has permission to view a report
 */
const checkReportViewPermission = async (reportId, userId) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId }
  });

  if (!report) {
    return { hasPermission: false, report: null };
  }

  // User can view if they own the report
  const isOwner = report.owner_id === userId;

  let hasPermission = isOwner;
  if (!hasPermission) {
    // Check if user has permission on any category in the report
    const categoryPermission = await prisma.categoryPermission.findFirst({
      where: {
        category: {
          report_id: reportId
        },
        user_id: userId
      }
    });
    hasPermission = !!categoryPermission;
  }

  return { hasPermission, report, isOwner };
};

/**
 * Format report object for API response
 */
const formatReportResponse = (report) => ({
  id: report.id,
  name: report.name,
  owner: report.owner,
  categories: report.categories?.map((category) => ({
    id: category.id,
    name: category.name,
    expensesCount: category._count?.expenses,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  })),
  categoriesCount: report._count?.categories,
  expensesCount: report._count?.expenses,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt
});

/**
 * Format expense object for API response
 */
const formatExpenseResponse = (expense) => ({
  id: expense.id,
  description: expense.description,
  amount: parseFloat(expense.amount),
  status: expense.status,
  transaction_date: expense.transaction_date,
  category: expense.category,
  submitter: expense.submitter,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

module.exports = {
  prisma,
  getOrCreateUser,
  validateReportId,
  getUserByFirebaseUid,
  checkReportViewPermission,
  formatReportResponse,
  formatExpenseResponse
};

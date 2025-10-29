const { prisma, validateUser, formatExpenseResponse } = require('./utils');
const { getDeletedEntitiesSince } = require('../../utils/deletionLogger');

/**
 * Get all expenses submitted by the current user
 * GET /api/users/me/expenses
 */
const getUserExpenses = async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 50, status, since } = req.query;

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Build where clause
    const whereClause = {
      submitter_id: user.id
    };

    if (status) {
      whereClause.status = status;
    }

    let deletedExpenseIds = [];

    // Add timestamp filter for incremental fetching
    if (since) {
      const sinceDate = new Date(parseInt(since));
      if (!isNaN(sinceDate.getTime())) {
        whereClause.updatedAt = {
          gt: sinceDate
        };

        // Get deleted expense IDs since the timestamp
        deletedExpenseIds = getDeletedEntitiesSince('expense', user.id, sinceDate);
      }
    }

    // Calculate pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    const totalExpenses = await prisma.expense.count({ where: whereClause });
    const totalPages = Math.ceil(totalExpenses / limitInt);

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
        },
        report: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        transaction_date: 'desc'
      },
      skip: skip,
      take: limitInt
    });

    const response = {
      message: 'User expenses retrieved successfully',
      expenses: expenses.map(formatExpenseResponse),
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalExpenses,
        totalPages,
        hasNextPage: pageInt < totalPages,
        hasPreviousPage: pageInt > 1
      }
    };

    // Include deleted IDs if this is an incremental request
    if (since && deletedExpenseIds.length > 0) {
      response.deletedIds = deletedExpenseIds;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user expenses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user expenses'
    });
  }
};

module.exports = { getUserExpenses };

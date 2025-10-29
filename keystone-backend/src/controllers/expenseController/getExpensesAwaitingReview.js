const { prisma, validateUser, formatExpenseResponse } = require('./utils');
const { getDeletedEntitiesSince } = require('../../utils/deletionLogger');

/**
 * Get expenses awaiting review that the current user can approve
 * GET /api/users/me/expenses/awaiting-review
 */
const getExpensesAwaitingReview = async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 5, since } = req.query;

    // Get and validate user
    const user = await validateUser(uid, res);
    if (!user) return;

    // Calculate pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Find categories with user permissions - need to distinguish between REVIEWER and ADMIN
    const categoriesWithPermissions = await prisma.category.findMany({
      where: {
        OR: [
          // User has explicit permission on category
          {
            permissions: {
              some: {
                user_id: user.id,
                role: {
                  in: ['REVIEWER', 'ADMIN']
                }
              }
            }
          },
          // User owns the report containing this category (report owners have full permissions)
          {
            report: {
              owner_id: user.id
            }
          }
        ]
      },
      select: {
        id: true,
        permissions: {
          where: { user_id: user.id },
          select: { role: true }
        },
        report: {
          select: {
            owner_id: true
          }
        }
      }
    });

    // Separate categories by permission level
    const reviewerCategoryIds = [];
    const adminCategoryIds = [];

    categoriesWithPermissions.forEach((category) => {
      const isReportOwner = category.report.owner_id === user.id;
      const userPermission = category.permissions[0]?.role;

      if (isReportOwner || userPermission === 'ADMIN') {
        adminCategoryIds.push(category.id);
      } else if (userPermission === 'REVIEWER') {
        reviewerCategoryIds.push(category.id);
      }
    });

    const allCategoryIds = [...reviewerCategoryIds, ...adminCategoryIds];

    if (allCategoryIds.length === 0) {
      // User has no review permissions on any categories
      return res.status(200).json({
        message: 'No expenses awaiting review',
        expenses: [],
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalExpenses: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    }

    // Build where clause for expenses awaiting review based on user permissions
    const whereConditions = [];

    // REVIEWER can see PENDING_REVIEW expenses in their categories
    if (reviewerCategoryIds.length > 0) {
      whereConditions.push({
        category_id: { in: reviewerCategoryIds },
        status: 'PENDING_REVIEW'
      });
    }

    // ADMIN can see both PENDING_REVIEW and PENDING_ADMIN expenses in their categories
    if (adminCategoryIds.length > 0) {
      whereConditions.push({
        category_id: { in: adminCategoryIds },
        status: { in: ['PENDING_REVIEW', 'PENDING_ADMIN'] }
      });
    }

    const whereClause = {
      OR: whereConditions,
      // Exclude expenses submitted by the current user (can't approve own expenses)
      // unless they're the report owner
      NOT: {
        AND: [
          { submitter_id: user.id },
          {
            category: {
              report: {
                owner_id: {
                  not: user.id
                }
              }
            }
          }
        ]
      }
    };

    let deletedExpenseIds = [];

    // Add timestamp filter for incremental fetching
    if (since) {
      const sinceDate = new Date(parseInt(since));
      if (!isNaN(sinceDate.getTime())) {
        whereClause.updatedAt = {
          gt: sinceDate
        };

        // Get deleted expense IDs since the timestamp (for awaiting review expenses)
        deletedExpenseIds = getDeletedEntitiesSince('expense', user.id, sinceDate);
      }
    }

    // Get total count for pagination
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
      message: 'Expenses awaiting review retrieved successfully',
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
    console.error('Error fetching expenses awaiting review:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch expenses awaiting review'
    });
  }
};

module.exports = { getExpensesAwaitingReview };

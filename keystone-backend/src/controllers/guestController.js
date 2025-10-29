const { PrismaClient } = require('@prisma/client');
const shareLinkService = require('../services/shareLinkService');
const { formatExpenseResponse, getAllSubcategoryIds } = require('./expenseController/utils');
const { calculateCategorySpending } = require('./categoryController/utils');
const { isValidEmail } = require('../utils/emailValidation');

const prisma = new PrismaClient();

/**
 * Helper function to check if a category is a descendant of another category
 * @param {number} categoryId - The category ID to check
 * @param {number} ancestorId - The potential ancestor category ID
 * @returns {Promise<boolean>} - True if categoryId is a descendant of ancestorId
 */
async function isCategoryDescendantOf(categoryId, ancestorId) {
  // If they're the same, it's technically a descendant (self)
  if (categoryId === ancestorId) {
    return true;
  }

  // Get the category and check its parent hierarchy
  let currentCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parent_category_id: true }
  });

  // Traverse up the parent hierarchy
  while (currentCategory && currentCategory.parent_category_id) {
    if (currentCategory.parent_category_id === ancestorId) {
      return true; // Found the ancestor
    }

    // Move up to the parent
    currentCategory = await prisma.category.findUnique({
      where: { id: currentCategory.parent_category_id },
      select: { parent_category_id: true }
    });
  }

  return false; // Not a descendant
}

/**
 * GET /api/guest?token=...
 * Fetch data for a guest based on their permission level
 */
const getGuestData = async (req, res) => {
  try {
    const { category_id, permission_level, category } = req.guest;

    // Get enhanced category data with navigation structure for REVIEW_ONLY guests
    const enhancedCategory = await prisma.category.findUnique({
      where: { id: category_id },
      include: {
        parent_category: {
          select: {
            id: true,
            name: true
          }
        },
        child_categories: {
          select: {
            id: true,
            name: true,
            budget: true,
            allow_guest_submissions: true,
            allow_user_submissions: true,
            require_receipt: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        report: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          }
        },
        _count: {
          select: {
            expenses: true,
            child_categories: true
          }
        }
      }
    });

    // Calculate spending for the category
    const spentAmount = await calculateCategorySpending(enhancedCategory.id);
    const budget = parseFloat((enhancedCategory.budget || 0).toString());
    const spentPercentage = budget > 0 ? Math.round((spentAmount / budget) * 100) : 0;

    // Calculate spending for child categories
    const enrichedChildren = await Promise.all(
      (enhancedCategory.child_categories || []).map(async (child) => {
        const childSpentAmount = await calculateCategorySpending(child.id);
        const childBudget = parseFloat((child.budget || 0).toString());
        const childSpentPercentage =
          childBudget > 0 ? Math.round((childSpentAmount / childBudget) * 100) : 0;

        return {
          id: child.id,
          name: child.name,
          budget: child.budget,
          spentAmount: childSpentAmount,
          spentPercentage: childSpentPercentage,
          allow_guest_submissions: child.allow_guest_submissions,
          allow_user_submissions: child.allow_user_submissions,
          require_receipt: child.require_receipt
        };
      })
    );

    // Base response data with enhanced category information
    const responseData = {
      category: {
        id: enhancedCategory.id,
        name: enhancedCategory.name,
        budget: enhancedCategory.budget,
        spentAmount: spentAmount,
        spentPercentage: spentPercentage,
        parentCategory: enhancedCategory.parent_category,
        children: enrichedChildren,
        report: enhancedCategory.report,
        expensesCount: enhancedCategory._count?.expenses,
        subcategoriesCount: enhancedCategory._count?.child_categories,
        allow_guest_submissions: enhancedCategory.allow_guest_submissions,
        allow_user_submissions: enhancedCategory.allow_user_submissions,
        require_receipt: enhancedCategory.require_receipt,
        createdAt: enhancedCategory.createdAt,
        updatedAt: enhancedCategory.updatedAt
      },
      permission_level
    };

    // If guest has REVIEW_ONLY permission, fetch all expenses in the category and its descendants (like authenticated users)
    if (permission_level === 'REVIEW_ONLY') {
      // Get all subcategory IDs recursively (includes the current category)
      const categoryIds = await getAllSubcategoryIds(category_id);

      const expenses = await prisma.expense.findMany({
        where: {
          category_id: { in: categoryIds },
          status: 'PENDING_REVIEW' // Guest reviewers should only see expenses pending their review
        },
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
          approvals: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // console.log('Debug: Sample expense with category:', JSON.stringify(expenses[0], null, 2));
      responseData.expenses = expenses.map(formatExpenseResponse);
    }

    // If guest has SUBMIT_ONLY permission, provide submission form structure but no expense viewing
    if (permission_level === 'SUBMIT_ONLY') {
      responseData.canSubmit = true;
      responseData.submissionFields = {
        description: 'string',
        amount: 'decimal',
        transaction_date: 'datetime',
        receipt_url: 'string (optional)',
        items: 'json (optional)',
        notes: 'string (optional)',
        guest_name: 'string (optional)',
        guest_email: 'string (optional)'
      };

      // SUBMIT_ONLY guests should not see any expenses for security/privacy
      responseData.expenses = [];
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching guest data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to fetch guest data'
    });
  }
};

/**
 * POST /api/guest?token=...
 * Submit expense data as a guest (requires SUBMIT_ONLY or higher permission)
 */
const submitGuestExpense = async (req, res) => {
  try {
    // Get the category_id from the request body, fallback to token's category_id if not provided
    const tokenCategoryId = req.guest.category_id;
    const requestBodyCategoryId = req.body.category_id;

    // For security, ensure the requested category is the token's category or one of its descendants
    let targetCategoryId = tokenCategoryId;
    let targetCategory = req.guest.category;

    if (requestBodyCategoryId && requestBodyCategoryId !== tokenCategoryId) {
      // Verify that the requested category is a descendant of the token's category
      const isDescendant = await isCategoryDescendantOf(requestBodyCategoryId, tokenCategoryId);

      if (isDescendant) {
        const category = await prisma.category.findFirst({
          where: {
            id: parseInt(requestBodyCategoryId)
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

        if (category) {
          targetCategoryId = parseInt(requestBodyCategoryId);
          targetCategory = category;
        }
      }
    }

    const {
      description,
      amount,
      transaction_date,
      receipt_url,
      items,
      notes,
      guest_name,
      guest_email
    } = req.body;

    // Avoid logging PII; keep minimal debug metadata
    console.log('Guest expense submission request received', {
      hasReceipt: Boolean(receipt_url),
      hasItems: Boolean(items),
      categoryId: targetCategoryId
    });

    // Validate guest_email format if provided
    if (guest_email && !isValidEmail(guest_email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Validate guest_name if provided
    if (guest_name && guest_name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Guest name cannot be empty'
      });
    }

    // Validate required fields
    if (!description || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Description and amount are required fields'
      });
    }

    // Validate amount is a positive number
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Amount must be a positive number'
      });
    }

    // Check if guest submissions are allowed for this category
    if (!targetCategory.allow_guest_submissions) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Guest submissions are not allowed for this category'
      });
    }

    // Check receipt requirement for SUBMIT_ONLY guests
    if (targetCategory.require_receipt && (!receipt_url || receipt_url.trim() === '')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'This category requires a receipt to be uploaded for expense submission'
      });
    }

    // For guest submissions, we need to create a guest user or use a placeholder
    // Since we don't have Firebase auth for guests, we'll create a placeholder submitter
    // First, let's check if there's a guest user in the system
    let guestUser = await prisma.user.findFirst({
      where: {
        email: 'guest@system.local'
      }
    });

    // Create a guest user if it doesn't exist
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          firebase_uid: 'guest_user_system',
          email: 'guest@system.local',
          name: 'Guest User'
        }
      });
    }

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: expenseAmount,
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        receipt_url: receipt_url || null,
        items: items || null,
        notes: notes || null,
        guest_name: guest_name || null,
        guest_email: guest_email || null,
        report_id: targetCategory.report.id,
        submitter_id: guestUser.id,
        category_id: targetCategoryId,
        status: 'PENDING_REVIEW'
      },
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
      }
    });

    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully',
      data: {
        expense: formatExpenseResponse(expense)
      }
    });
  } catch (error) {
    console.error('Error submitting guest expense:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to submit expense'
    });
  }
};

/**
 * PUT /api/guest/expenses/:expenseId?token=...
 * Update expense status as a guest reviewer (requires REVIEW_ONLY permission)
 */
const updateExpenseStatus = async (req, res) => {
  try {
    const { category_id } = req.guest;
    const { expenseId } = req.params;
    const { status, notes } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Status is required'
      });
    }

    // Validate status values that guests can set
    const allowedStatuses = ['APPROVED', 'DENIED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Status must be either APPROVED or DENIED'
      });
    }

    // For REVIEW_ONLY guests, "APPROVED" should become "PENDING_ADMIN" to require admin final approval
    const actualStatus = status === 'APPROVED' ? 'PENDING_ADMIN' : status;

    // Check if expense exists and belongs to the correct category
    const expense = await prisma.expense.findFirst({
      where: {
        id: parseInt(expenseId),
        category_id: category_id,
        status: {
          in: ['PENDING_REVIEW', 'PENDING_ADMIN']
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Expense not found or cannot be updated'
      });
    }

    // Create a guest user for approvals if it doesn't exist
    let guestUser = await prisma.user.findFirst({
      where: {
        email: 'guest@system.local'
      }
    });

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          firebase_uid: 'guest_user_system',
          email: 'guest@system.local',
          name: 'Guest Reviewer'
        }
      });
    }

    // Update expense status and create approval record
    const [updatedExpense] = await prisma.$transaction([
      prisma.expense.update({
        where: { id: parseInt(expenseId) },
        data: { status: actualStatus }
      }),
      prisma.approval.create({
        data: {
          status_change: actualStatus,
          notes: notes || null,
          expense_id: parseInt(expenseId),
          user_id: guestUser.id
        }
      })
    ]);

    // Fetch the updated expense with full details
    const finalExpense = await prisma.expense.findUnique({
      where: { id: parseInt(expenseId) },
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
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Provide appropriate success message based on what actually happened
    const successMessage =
      status === 'APPROVED'
        ? 'Expense approved and forwarded to admin for final approval'
        : `Expense ${status.toLowerCase()} successfully`;

    res.json({
      success: true,
      message: successMessage,
      data: {
        expense: formatExpenseResponse(finalExpense)
      }
    });
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to update expense status'
    });
  }
};

/**
 * GET /api/guest/category/:categoryId?token=...
 * Get specific category data for guests with REVIEW_ONLY permission
 */
const getGuestCategoryData = async (req, res) => {
  try {
    const { permission_level } = req.guest;
    const { categoryId } = req.params;

    // Only REVIEW_ONLY guests can navigate categories
    if (permission_level !== 'REVIEW_ONLY') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Category navigation requires REVIEW_ONLY permission'
      });
    }

    const categoryIdInt = parseInt(categoryId);
    if (isNaN(categoryIdInt)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid category ID'
      });
    }

    // Get the guest token's original category to verify access
    const guestToken = req.query.token;
    const tokenData = await prisma.guestToken.findFirst({
      where: {
        token: guestToken,
        status: 'active',
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        category: {
          include: {
            report: true
          }
        }
      }
    });

    if (!tokenData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired guest token'
      });
    }

    // Get the requested category
    const requestedCategory = await prisma.category.findUnique({
      where: { id: categoryIdInt },
      include: {
        parent_category: {
          select: {
            id: true,
            name: true
          }
        },
        child_categories: {
          select: {
            id: true,
            name: true,
            budget: true,
            allow_guest_submissions: true,
            allow_user_submissions: true,
            require_receipt: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        report: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          }
        },
        _count: {
          select: {
            expenses: true,
            child_categories: true
          }
        }
      }
    });

    if (!requestedCategory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    // Verify the requested category is within the same report as the guest token's category
    if (requestedCategory.report.id !== tokenData.category.report.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: Category is not within the authorized report'
      });
    }

    // Get all expenses for the requested category and its descendants (REVIEW_ONLY guests can see all expenses like authenticated users)
    // Get all subcategory IDs recursively (includes the current category)
    const categoryIds = await getAllSubcategoryIds(categoryIdInt);

    const expenses = await prisma.expense.findMany({
      where: {
        category_id: { in: categoryIds },
        status: 'PENDING_REVIEW' // Guest reviewers should only see expenses pending their review
      },
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
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate spending for the requested category
    const spentAmount = await calculateCategorySpending(requestedCategory.id);
    const budget = parseFloat((requestedCategory.budget || 0).toString());
    const spentPercentage = budget > 0 ? Math.round((spentAmount / budget) * 100) : 0;

    // Calculate spending for child categories
    const enrichedChildren = await Promise.all(
      (requestedCategory.child_categories || []).map(async (child) => {
        const childSpentAmount = await calculateCategorySpending(child.id);
        const childBudget = parseFloat((child.budget || 0).toString());
        const childSpentPercentage =
          childBudget > 0 ? Math.round((childSpentAmount / childBudget) * 100) : 0;

        return {
          id: child.id,
          name: child.name,
          budget: child.budget,
          spentAmount: childSpentAmount,
          spentPercentage: childSpentPercentage,
          allow_guest_submissions: child.allow_guest_submissions,
          allow_user_submissions: child.allow_user_submissions,
          require_receipt: child.require_receipt
        };
      })
    );

    const responseData = {
      category: {
        id: requestedCategory.id,
        name: requestedCategory.name,
        budget: requestedCategory.budget,
        spentAmount: spentAmount,
        spentPercentage: spentPercentage,
        parentCategory: requestedCategory.parent_category,
        children: enrichedChildren,
        report: requestedCategory.report,
        expensesCount: requestedCategory._count?.expenses,
        subcategoriesCount: requestedCategory._count?.child_categories,
        allow_guest_submissions: requestedCategory.allow_guest_submissions,
        allow_user_submissions: requestedCategory.allow_user_submissions,
        require_receipt: requestedCategory.require_receipt,
        createdAt: requestedCategory.createdAt,
        updatedAt: requestedCategory.updatedAt
      },
      permission_level,
      expenses: expenses.map(formatExpenseResponse)
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching guest category data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to fetch category data'
    });
  }
};

/**
 * GET /api/guest/expenses/:expenseId?token=...
 * Get specific expense details for guests with REVIEW_ONLY permission
 */
const getGuestExpenseDetail = async (req, res) => {
  try {
    const { permission_level } = req.guest;
    const { expenseId } = req.params;

    // Only REVIEW_ONLY guests can view expense details
    if (permission_level !== 'REVIEW_ONLY') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Expense detail access requires REVIEW_ONLY permission'
      });
    }

    const expenseIdInt = parseInt(expenseId);
    if (isNaN(expenseIdInt)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid expense ID'
      });
    }

    // Get the guest token's original category to verify access
    const guestToken = req.query.token;
    const tokenData = await prisma.guestToken.findFirst({
      where: {
        token: guestToken,
        status: 'active',
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        category: {
          include: {
            report: true
          }
        }
      }
    });

    if (!tokenData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired guest token'
      });
    }

    // Get the requested expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseIdInt },
      include: {
        category: {
          include: {
            report: true
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
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Expense not found'
      });
    }

    // Verify the expense belongs to a category within the same report as the guest token's category
    if (!expense.category || expense.category.report.id !== tokenData.category.report.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: Expense is not within the authorized report'
      });
    }

    const responseData = {
      expense: formatExpenseResponse(expense),
      permission_level
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching guest expense detail:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to fetch expense details'
    });
  }
};

/**
 * POST /api/guest/signed-upload-url?token=...
 * Generate a signed URL for guest users to upload receipts directly to Firebase Storage
 * Requires SUBMIT_ONLY or higher permission
 */
const getSignedUploadUrl = async (req, res) => {
  try {
    const { category_id } = req.guest;
    const { fileName, contentType } = req.body;

    // Validate required fields
    if (!fileName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'fileName is required'
      });
    }

    // Default content type to image/jpeg if not provided
    const fileContentType = contentType || 'image/jpeg';

    // Generate a unique filename with timestamp to avoid collisions
    const timestamp = new Date().getTime();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const filePath = `receipts/guest_user_system/${timestamp}_${sanitizedFileName}`;

    // Get Firebase Storage bucket using Admin SDK
    const admin = require('../config/firebase');
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Generate signed URL for upload (valid for 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: fileContentType
    });

    // Return the signed URL and the file path (for later reference)
    res.json({
      signedUrl,
      filePath,
      expiresAt: expiresAt.toISOString(),
      uploadInstructions: {
        method: 'PUT',
        headers: {
          'Content-Type': fileContentType
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate signed upload URL:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not generate signed upload URL'
    });
  }
};

/**
 * GET /api/guest/receipt-url/:filePath?token=...
 * Generate a signed URL for a Firebase Storage receipt file for guest users
 * Requires REVIEW_ONLY or higher permission for guest users
 */
const getGuestReceiptSignedUrl = async (req, res) => {
  try {
    const { category, permission_level } = req.guest;
    const filePath = req.params.filePath;

    console.log('Guest signed URL request:', {
      filePath,
      permission_level,
      category_id
    });

    // Validate that this is a receipt file (can be from any user, not just guests)
    if (!filePath || !filePath.startsWith('receipts/')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid file path'
      });
    }

    // Check permissions - guests need REVIEW_ONLY or higher to view receipts
    if (permission_level !== 'REVIEW_ONLY' && permission_level !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to view receipts'
      });
    }
    // Ensure filePath belongs to an expense in the same report as the guest token
    const expenseWithReceipt = await prisma.expense.findFirst({
      where: { receipt_url: filePath },
      include: { category: { include: { report: true } } }
    });

    if (!expenseWithReceipt || !expenseWithReceipt.category) {
      return res
        .status(404)
        .json({
          error: 'Not Found',
          message: 'Receipt not associated with any accessible expense'
        });
    }

    if (expenseWithReceipt.category.report.id !== category.report.id) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Receipt not within authorized report scope' });
    }

    // Get Firebase Storage bucket using Admin SDK
    const admin = require('../config/firebase');
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Receipt file not found'
      });
    }

    // Generate signed URL with 1 hour expiration
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour from now
    });

    console.log('Generated guest signed URL for:', filePath);

    return res.json({
      signedUrl: signedUrl
    });
  } catch (error) {
    console.error('Error generating guest signed URL:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to generate signed URL'
    });
  }
};

/**
 * GET /api/guest/file/:filePath?token=... (DEPRECATED)
 * Securely access a Firebase Storage file if user has permissions
 * Requires REVIEW_ONLY or higher permission for guest users
 */
const getSecureFile = async (req, res) => {
  console.warn(
    'DEPRECATED: /api/guest/file/:filePath endpoint is deprecated. Use /api/guest/receipt-url/:filePath instead'
  );
  return getGuestReceiptSignedUrl(req, res);
};

module.exports = {
  getGuestData,
  submitGuestExpense,
  updateExpenseStatus,
  getGuestCategoryData,
  getGuestExpenseDetail,
  getSignedUploadUrl,
  getSecureFile,
  getGuestReceiptSignedUrl
};

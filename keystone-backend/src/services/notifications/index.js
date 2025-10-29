const prisma = require('../../config/database');
const { sendExpoPush } = require('./expo');

// Toggle verbose notification debug logging with env DEBUG_NOTIFICATIONS=true
const DEBUG_NOTIFICATIONS = process.env.DEBUG_NOTIFICATIONS === 'true';

function debugLog(...args) {
  if (DEBUG_NOTIFICATIONS) {
    console.log('[notifications]', ...args);
  }
}

/**
 * Fetch Expo tokens for a user by internal user_id.
 * @param {number} userId
 * @returns {Promise<string[]>}
 */
async function getUserExpoTokens(userId) {
  const endpoints = await prisma.notificationEndpoint.findMany({
    where: { user_id: userId, provider: 'expo' },
    select: { token: true }
  });
  const tokens = endpoints.map((e) => e.token).filter(Boolean);
  debugLog('getUserExpoTokens', { userId, tokensCount: tokens.length });
  return tokens;
}

/**
 * Check if a user wants to receive push notifications for a specific event.
 * @param {number} userId
 * @param {string} event - The notification event type
 * @returns {Promise<boolean>}
 */
async function shouldNotifyUser(userId, event) {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      user_id_event: {
        user_id: userId,
        event: event
      }
    },
    select: { push: true }
  });

  // Default to true if no preference is set
  return preference ? preference.push : true;
}

/**
 * Filter users based on their notification preferences for a specific event.
 * @param {number[]} userIds
 * @param {string} event - The notification event type
 * @returns {Promise<number[]>}
 */
async function filterUsersByPreferences(userIds, event) {
  if (!userIds.length) return [];

  const filteredUsers = [];
  for (const userId of userIds) {
    if (await shouldNotifyUser(userId, event)) {
      filteredUsers.push(userId);
    }
  }

  debugLog('filterUsersByPreferences', {
    totalUsers: userIds.length,
    filteredUsers: filteredUsers.length,
    event
  });

  return filteredUsers;
}

/**
 * Send a push notification to a specific user (all their Expo endpoints).
 * @param {number} userId
 * @param {{ title?: string, body?: string, data?: object }} payload
 */
/**
 * Send a push notification to a specific user (all their Expo endpoints).
 * @param {number} userId
 * @param {{ title?: string, body?: string, data?: object }} payload
 * @param {string} event - The notification event type for preference checking
 */
async function notifyUser(userId, payload, event = null) {
  // Check user preferences if event is provided
  if (event && !(await shouldNotifyUser(userId, event))) {
    debugLog('notifyUser: skipped due to preferences', { userId, event, title: payload?.title });
    return { sent: 0, tickets: [] };
  }

  const tokens = await getUserExpoTokens(userId);
  if (!tokens.length) {
    debugLog('notifyUser: no tokens', { userId, title: payload?.title });
    return { sent: 0, tickets: [] };
  }

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    sound: 'default'
  }));

  const { tickets } = await sendExpoPush(messages);
  debugLog('notifyUser: sent', { userId, tokens: tokens.length, tickets });
  return { sent: tokens.length, tickets };
}

/**
 * Utility: send to many users with optional exclusion (e.g., actor)
 * @param {number[]} userIds
 * @param {{ title?: string, body?: string, data?: object }} payload
 * @param {{ excludeUserId?: number, event?: string }} options
 */
async function notifyManyUsers(userIds, payload, { excludeUserId, event } = {}) {
  const unique = new Set(userIds.filter(Boolean));
  if (excludeUserId) unique.delete(excludeUserId);
  debugLog('notifyManyUsers:start', {
    candidateCount: userIds.length,
    uniqueCount: unique.size,
    excludeUserId
  });

  // Filter by preferences if event is provided
  let filteredUserIds = Array.from(unique);
  if (event) {
    filteredUserIds = await filterUsersByPreferences(filteredUserIds, event);
  }

  if (!filteredUserIds.length) {
    debugLog('notifyManyUsers: no users after filtering', { title: payload?.title, event });
    return { sent: 0, tickets: [] };
  }

  const allTokens = [];
  for (const uid of filteredUserIds) {
    const tokens = await getUserExpoTokens(uid);
    allTokens.push(...tokens);
  }

  if (!allTokens.length) {
    debugLog('notifyManyUsers: no tokens', { title: payload?.title });
    return { sent: 0, tickets: [] };
  }

  const messages = allTokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    sound: 'default'
  }));

  const { tickets } = await sendExpoPush(messages);
  debugLog('notifyManyUsers: sent', { messageCount: messages.length, tickets });
  return { sent: allTokens.length, tickets };
}

/**
 * Find all user IDs with reviewer+ (REVIEWER or ADMIN) on the category and any ancestors.
 * Walks the tree upwards (Category.parent_category_id). Optimized by indexes in schema.prisma.
 * @param {number} categoryId
 * @returns {Promise<number[]>}
 */
async function findReviewerIdsForCategoryAndAncestors(categoryId) {
  if (!categoryId) return [];

  const ancestorIds = [];
  let current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, parent_category_id: true }
  });

  while (current) {
    ancestorIds.push(current.id);
    if (!current.parent_category_id) break;
    current = await prisma.category.findUnique({
      where: { id: current.parent_category_id },
      select: { id: true, parent_category_id: true }
    });
  }

  if (!ancestorIds.length) return [];

  const perms = await prisma.categoryPermission.findMany({
    where: {
      category_id: { in: ancestorIds },
      role: { in: ['REVIEWER', 'ADMIN'] }
    },
    select: { user_id: true }
  });

  return Array.from(new Set(perms.map((p) => p.user_id)));
}

/**
 * Notify the workspace owner and all reviewer+ users on the category and any ancestors when a new expense is created.
 * @param {number} reportId
 * @param {{ expenseId: number, description?: string, amount?: string|number, categoryName?: string, submitterName?: string, categoryId?: number, submitterUserId?: number }} context
 */
async function notifyReportOwnerOnExpenseCreated(reportId, context) {
  debugLog('expense_created:start', {
    reportId,
    categoryId: context?.categoryId,
    submitterUserId: context?.submitterUserId,
    description: context?.description,
    amount: context?.amount
  });

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { owner_id: true, name: true }
  });
  if (!report) {
    debugLog('expense_created:report_not_found', { reportId });
    return;
  }

  const title = 'New expense submitted';
  const desc = context.description ? `“${context.description}”` : 'An expense';
  const amountText =
    typeof context.amount === 'string' || typeof context.amount === 'number'
      ? ` for $${String(context.amount)}`
      : '';
  const submitterText = context.submitterName ? ` by ${context.submitterName}` : '';
  const categoryText = context.categoryName ? ` in ${context.categoryName}` : '';
  const body = `${desc}${amountText}${submitterText}${categoryText} was added to workspace "${report.name || reportId}".`;

  const data = {
    // Keep original event-specific fields
    event: 'expense_created',
    expenseId: context.expenseId,
    reportId,
    description: context.description || null,
    amount: context.amount ?? null,
    categoryName: context.categoryName || null,
    submitterName: context.submitterName || null,
    categoryId: context.categoryId ?? null,
    // Add cross-platform deep link metadata
    type: 'expense',
    id: context.expenseId,
    url: `/expense/${context.expenseId}`
  };

  // Recipients: reviewer+ on category and its ancestors; also include workspace owner if not the actor
  const recipients = new Set();
  if (context.categoryId) {
    const reviewerIds = await findReviewerIdsForCategoryAndAncestors(context.categoryId);
    reviewerIds.forEach((id) => recipients.add(id));
  }

  // Include workspace owner unless they are the actor
  if (!context.submitterUserId || report.owner_id !== context.submitterUserId) {
    recipients.add(report.owner_id);
  }

  // Exclude the actor (submitter) to prevent self-notifications, even across platforms.
  if (context.submitterUserId) {
    recipients.delete(context.submitterUserId);
  }

  return notifyManyUsers(
    Array.from(recipients),
    { title, body, data },
    { excludeUserId: context.submitterUserId, event: 'expense_created' }
  );
}

/**
 * Notify a user when they are granted access to a category.
 * @param {number} userId
 * @param {{ categoryId: number, role: string, reportId?: number, categoryName?: string }} context
 */
async function notifyUserCategoryShared(userId, context) {
  const title = 'Category shared with you';
  const body = context.categoryName
    ? `You were granted ${context.role} access to "${context.categoryName}".`
    : `You were granted ${context.role} access to category ${context.categoryId}.`;
  const data = {
    // Original fields
    event: 'category_shared',
    categoryId: context.categoryId,
    role: context.role,
    reportId: context.reportId,
    // Deep link metadata
    type: 'category',
    id: context.categoryId,
    url: `/category/${context.categoryId}`
  };

  return notifyUser(userId, { title, body, data }, 'category_shared');
}

/**
 * Notify submitter when their expense status changes (APPROVED or DENIED).
 * @param {number|null} submitterUserId
 * @param {{ expenseId: number, status: 'APPROVED'|'DENIED'|'PENDING_REVIEW'|'PENDING_ADMIN'|'REIMBURSED', description?: string, categoryName?: string, reportId?: number, reviewerName?: string }} context
 */
async function notifySubmitterOnStatusChange(submitterUserId, context) {
  if (!submitterUserId) return;

  if (context.status !== 'APPROVED' && context.status !== 'DENIED') {
    return;
  }

  // If the reviewer is the submitter (self-approval/denial), do not notify
  if (context.reviewerUserId && context.reviewerUserId === submitterUserId) {
    return;
  }

  const title = context.status === 'APPROVED' ? 'Expense approved' : 'Expense denied';

  const desc = context.description ? `“${context.description}” ` : '';
  const reviewerText = context.reviewerName ? ` by ${context.reviewerName}` : '';
  const categoryText = context.categoryName ? ` in ${context.categoryName}` : '';
  const body =
    context.status === 'APPROVED'
      ? `${desc}was approved${reviewerText}${categoryText}.`
      : `${desc}was denied${reviewerText}${categoryText}.`;

  const data = {
    // Original fields
    event: 'expense_status_changed',
    expenseId: context.expenseId,
    status: context.status,
    description: context.description || null,
    categoryName: context.categoryName || null,
    reportId: context.reportId || null,
    reviewerName: context.reviewerName || null,
    // Deep link metadata
    type: 'expense',
    id: context.expenseId,
    url: `/expense/${context.expenseId}`
  };

  const event = context.status === 'APPROVED' ? 'expense_approved' : 'expense_denied';
  return notifyUser(submitterUserId, { title, body, data }, event);
}

module.exports = {
  getUserExpoTokens,
  notifyUser,
  notifyReportOwnerOnExpenseCreated,
  notifyUserCategoryShared,
  notifySubmitterOnStatusChange,
  shouldNotifyUser,
  filterUsersByPreferences
};

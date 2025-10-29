const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Log a deletion for incremental update tracking
 * @param {string} entityType - Type of entity deleted ('expense', 'report', 'shared_category')
 * @param {number} entityId - ID of the deleted entity
 * @param {number} userId - ID of the user who deleted the item (for filtering)
 * @param {Object} metadata - Additional metadata about the deletion
 */
async function logDeletion(entityType, entityId, userId, metadata = {}) {
  try {
    // For now, we'll create a simple JSON log in the database
    // In a real production system, you might want a dedicated deletion_log table

    // Since we don't have a deletion_log table in the schema,
    // we'll use a simple approach: store deletion info in a JSON field
    // that we can query later

    // For this implementation, we'll use an in-memory approach
    // and modify the existing endpoints to track deletions

    const deletionRecord = {
      entityType,
      entityId,
      userId,
      deletedAt: new Date(),
      metadata
    };

    // Store in memory for now (in production, you'd want persistent storage)
    if (!global.deletionLog) {
      global.deletionLog = [];
    }

    global.deletionLog.push(deletionRecord);

    // Clean up old deletion records (keep only last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    global.deletionLog = global.deletionLog.filter((record) => record.deletedAt > sevenDaysAgo);

    console.log(`Logged deletion: ${entityType} ${entityId} by user ${userId}`);
  } catch (error) {
    console.error('Failed to log deletion:', error);
    // Don't throw - deletion logging should not break the main operation
  }
}

/**
 * Get deleted entities since a timestamp for a specific user
 * @param {string} entityType - Type of entity to check
 * @param {number} userId - User ID to filter deletions for
 * @param {Date} since - Timestamp to check deletions since
 * @returns {number[]} Array of deleted entity IDs
 */
function getDeletedEntitiesSince(entityType, userId, since) {
  try {
    if (!global.deletionLog) {
      return [];
    }

    return global.deletionLog
      .filter(
        (record) =>
          record.entityType === entityType && record.userId === userId && record.deletedAt > since
      )
      .map((record) => record.entityId);
  } catch (error) {
    console.error('Failed to get deleted entities:', error);
    return [];
  }
}

/**
 * Get all deleted entities for a user since a timestamp
 * @param {number} userId - User ID to filter deletions for
 * @param {Date} since - Timestamp to check deletions since
 * @returns {Object} Object with arrays of deleted IDs by entity type
 */
function getAllDeletedEntitiesSince(userId, since) {
  try {
    if (!global.deletionLog) {
      return {
        expenses: [],
        reports: [],
        sharedCategories: []
      };
    }

    const userDeletions = global.deletionLog.filter(
      (record) => record.userId === userId && record.deletedAt > since
    );

    return {
      expenses: userDeletions.filter((r) => r.entityType === 'expense').map((r) => r.entityId),
      reports: userDeletions.filter((r) => r.entityType === 'report').map((r) => r.entityId),
      sharedCategories: userDeletions
        .filter((r) => r.entityType === 'shared_category')
        .map((r) => r.entityId)
    };
  } catch (error) {
    console.error('Failed to get all deleted entities:', error);
    return {
      expenses: [],
      reports: [],
      sharedCategories: []
    };
  }
}

module.exports = {
  logDeletion,
  getDeletedEntitiesSince,
  getAllDeletedEntitiesSince
};

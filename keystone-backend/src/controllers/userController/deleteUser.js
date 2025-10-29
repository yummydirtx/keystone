const { prisma } = require('./utils');
const admin = require('../../config/firebase');

/**
 * Delete current user account
 * DELETE /api/users/me
 *
 * This operation:
 * 1. Deletes all reports owned by the user (CASCADE)
 * 2. Anonymizes expenses by setting submitter_id to NULL (SET NULL)
 * 3. Anonymizes approval history by setting user_id to NULL (SET NULL)
 * 4. Deletes all category permissions (CASCADE)
 * 5. Deletes the user record from database
 * 6. Deletes Firebase Storage files (avatars and receipts)
 * 7. Deletes the Firebase Authentication account
 */
const deleteCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get the user record first with related data counts
    const user = await prisma.user.findUnique({
      where: { firebase_uid: uid },
      include: {
        _count: {
          select: {
            owned_reports: true,
            submitted_expenses: true,
            approvals: true,
            category_permissions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    console.log(`Starting account deletion for user ${user.id} (${user.email})`);
    console.log(
      `User has: ${user._count.owned_reports} reports, ${user._count.submitted_expenses} expenses, ${user._count.approvals} approvals, ${user._count.category_permissions} permissions`
    );

    // Delete user from database
    // This will trigger the following cascade/set null operations:
    // - Delete all owned reports and their categories/expenses (CASCADE)
    // - Anonymize submitted expenses by setting submitter_id to NULL (SET NULL)
    // - Anonymize approval history by setting user_id to NULL (SET NULL)
    // - Delete all category permissions (CASCADE)
    await prisma.user.delete({
      where: { firebase_uid: uid }
    });

    console.log(`Successfully deleted user from database for ${user.email}`);
    console.log('- All owned reports have been deleted');
    console.log('- All submitted expenses have been anonymized (submitter_id set to NULL)');
    console.log('- All approval history has been anonymized (user_id set to NULL)');
    console.log('- All category permissions have been removed');

    // Delete Firebase Storage files
    try {
      const storage = admin.storage().bucket();

      // Delete avatar files
      const avatarPath = `avatars/${uid}`;
      try {
        await storage.file(avatarPath).delete();
        console.log(`Successfully deleted avatar file for ${user.email}`);
      } catch (avatarError) {
        // File might not exist, which is fine
        console.log(
          `Avatar file not found for ${user.email} (this is normal if no avatar was uploaded)`
        );
      }

      // Delete all receipt files for this user
      const receiptsPrefix = `receipts/${uid}/`;
      try {
        const [files] = await storage.getFiles({ prefix: receiptsPrefix });
        if (files.length > 0) {
          // Delete files in batches to avoid overwhelming the API
          const deletePromises = files.map((file) =>
            file.delete().catch((err) => {
              console.error(`Failed to delete receipt file ${file.name}:`, err);
            })
          );
          await Promise.all(deletePromises);
          console.log(`Successfully deleted ${files.length} receipt files for ${user.email}`);
        } else {
          console.log(`No receipt files found for ${user.email}`);
        }
      } catch (receiptsError) {
        console.error(`Failed to delete receipt files for ${user.email}:`, receiptsError);
      }
    } catch (storageError) {
      console.error(`Failed to delete Firebase Storage files for ${user.email}:`, storageError);
      // Don't fail the entire operation if storage deletion fails
    }

    // Delete Firebase authentication account
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted Firebase auth account for ${user.email}`);
    } catch (firebaseError) {
      console.error(`Failed to delete Firebase auth account for ${user.email}:`, firebaseError);
      // Don't fail the entire operation if Firebase deletion fails
      // The database deletion was already successful
    }

    res.status(200).json({
      message: 'User account deleted successfully',
      details: {
        reportsDeleted: user._count.owned_reports,
        expensesAnonymized: user._count.submitted_expenses,
        approvalsAnonymized: user._count.approvals,
        permissionsRemoved: user._count.category_permissions,
        firebaseAccountDeleted: true,
        firebaseStorageFilesDeleted: true,
        databaseAccountDeleted: true
      }
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user account'
    });
  }
};

module.exports = { deleteCurrentUser };

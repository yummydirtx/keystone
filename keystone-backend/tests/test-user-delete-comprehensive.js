// test-user-delete-comprehensive.js
// Comprehensive tests for the DELETE /api/users/me endpoint

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');
const admin = require('../src/config/firebase');
const prisma = require('../src/config/database');

describe('DELETE /api/users/me - Comprehensive Account Deletion Tests', () => {
  let app;

  beforeAll(async () => {
    app = createTestApp();
    console.log('🧪 Setting up comprehensive user deletion tests...');
  });

  afterAll(async () => {
    console.log('🧹 Comprehensive user deletion tests completed');
  });

  describe('Complete Account Deletion', () => {
    test('should delete user with all data, anonymize related records, and delete Firebase data', async () => {
      // Create test user
      const testSetup = await createTestSetup({
        displayName: 'User To Delete Completely',
        email: `delete-test-${Date.now()}@example.com`
      });

      try {
        // Step 1: Sync user to create database record
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(201);

        // Step 2: Create test data to verify deletion/anonymization

        // Create a report (should be deleted)
        const reportResponse = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({ name: 'Report To Be Deleted' })
          .expect(201);

        const reportId = reportResponse.body.report.id;

        // Create a category (should be deleted with report)
        const categoryResponse = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({ name: 'Category To Be Deleted', budget: 1000 })
          .expect(201);

        const categoryId = categoryResponse.body.category.id;

        // Create an expense as the user (should be anonymized)
        const expenseResponse = await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .send({
            description: 'Expense To Be Anonymized',
            amount: 150.0,
            categoryId: categoryId
          })
          .expect(201);

        const expenseId = expenseResponse.body.expense.id;

        // Create another user to create shared data
        const otherTestSetup = await createTestSetup({
          displayName: 'Other User',
          email: `other-user-${Date.now()}@example.com`
        });

        try {
          await request(app)
            .post('/api/users/sync')
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .expect(201);

          // Create a report from other user
          const otherReportResponse = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({ name: 'Other User Report' })
            .expect(201);

          const otherReportId = otherReportResponse.body.report.id;

          const otherCategoryResponse = await request(app)
            .post(`/api/reports/${otherReportId}/categories`)
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({ name: 'Other User Category', budget: 500 })
            .expect(201);

          const otherCategoryId = otherCategoryResponse.body.category.id;

          // Grant permission to first user to submit to other user's category
          await request(app)
            .post(`/api/categories/${otherCategoryId}/permissions`)
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({
              userId: testSetup.userRecord.uid,
              role: 'SUBMITTER'
            })
            .expect(201);

          // First user submits expense to other user's category (should be anonymized)
          const sharedExpenseResponse = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${testSetup.customToken}`)
            .send({
              description: 'Shared Expense To Be Anonymized',
              amount: 75.0,
              categoryId: otherCategoryId
            })
            .expect(201);

          const sharedExpenseId = sharedExpenseResponse.body.expense.id;

          // Other user approves the shared expense (this creates an approval record)
          await request(app)
            .put(`/api/expenses/${sharedExpenseId}/status`)
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({ status: 'APPROVED', notes: 'Approved by other user' })
            .expect(200);

          // Now grant REVIEWER permission to user to be deleted and have them make another approval
          await request(app)
            .post(`/api/categories/${otherCategoryId}/permissions`)
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({
              userId: testSetup.userRecord.uid,
              role: 'REVIEWER'
            })
            .expect(200); // Update existing permission

          // Create another expense that the user to be deleted can approve
          const secondExpenseResponse = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${otherTestSetup.customToken}`)
            .send({
              description: 'Expense to be approved by user to be deleted',
              amount: 50.0,
              categoryId: otherCategoryId
            })
            .expect(201);

          // User to be deleted approves the second expense (creates approval to be anonymized)
          await request(app)
            .put(`/api/expenses/${secondExpenseResponse.body.expense.id}/status`)
            .set('Authorization', `Bearer ${testSetup.customToken}`)
            .send({ status: 'APPROVED', notes: 'Approved by user to be deleted' })
            .expect(200);

          // Step 3: Create Firebase Storage files (simulate avatar and receipt uploads)
          const storage = admin.storage().bucket();

          // Create fake avatar file
          const avatarPath = `avatars/${testSetup.userRecord.uid}`;
          await storage.file(avatarPath).save('fake-avatar-data', {
            metadata: { contentType: 'image/jpeg' }
          });

          // Create fake receipt files
          const receiptPath1 = `receipts/${testSetup.userRecord.uid}/expense1/receipt1.jpg`;
          const receiptPath2 = `receipts/${testSetup.userRecord.uid}/expense2/receipt2.jpg`;

          await storage.file(receiptPath1).save('fake-receipt-1-data', {
            metadata: { contentType: 'image/jpeg' }
          });

          await storage.file(receiptPath2).save('fake-receipt-2-data', {
            metadata: { contentType: 'image/jpeg' }
          });

          // Step 4: Verify files exist before deletion
          const [avatarExists] = await storage.file(avatarPath).exists();
          const [receipt1Exists] = await storage.file(receiptPath1).exists();
          const [receipt2Exists] = await storage.file(receiptPath2).exists();

          expect(avatarExists).toBe(true);
          expect(receipt1Exists).toBe(true);
          expect(receipt2Exists).toBe(true);

          // Step 5: Get database IDs for verification
          const userBeforeDeletion = await prisma.user.findUnique({
            where: { firebase_uid: testSetup.userRecord.uid },
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

          console.log(
            `User before deletion has: ${userBeforeDeletion._count.owned_reports} reports, ${userBeforeDeletion._count.submitted_expenses} expenses`
          );

          // Step 6: Perform the deletion
          const deleteResponse = await request(app)
            .delete('/api/users/me')
            .set('Authorization', `Bearer ${testSetup.customToken}`)
            .expect(200);

          // Step 7: Verify response structure
          expect(deleteResponse.body).toMatchObject({
            message: 'User account deleted successfully',
            details: {
              reportsDeleted: expect.any(Number),
              expensesAnonymized: expect.any(Number),
              approvalsAnonymized: expect.any(Number),
              permissionsRemoved: expect.any(Number),
              firebaseAccountDeleted: true,
              firebaseStorageFilesDeleted: true,
              databaseAccountDeleted: true
            }
          });

          console.log('✓ Delete response:', deleteResponse.body);

          // Step 8: Verify Firebase Auth account is deleted
          try {
            await admin.auth().getUser(testSetup.userRecord.uid);
            fail('Firebase user should have been deleted');
          } catch (error) {
            expect(error.code).toBe('auth/user-not-found');
            console.log('✓ Firebase Auth account successfully deleted');
          }

          // Step 9: Verify Firebase Storage files are deleted
          const [avatarExistsAfter] = await storage.file(avatarPath).exists();
          const [receipt1ExistsAfter] = await storage.file(receiptPath1).exists();
          const [receipt2ExistsAfter] = await storage.file(receiptPath2).exists();

          expect(avatarExistsAfter).toBe(false);
          expect(receipt1ExistsAfter).toBe(false);
          expect(receipt2ExistsAfter).toBe(false);

          console.log('✓ Firebase Storage files successfully deleted');

          // Step 10: Verify database deletions and anonymizations

          // User should be completely deleted
          const userAfterDeletion = await prisma.user.findUnique({
            where: { firebase_uid: testSetup.userRecord.uid }
          });
          expect(userAfterDeletion).toBeNull();
          console.log('✓ User record deleted from database');

          // User's reports should be deleted
          const userReports = await prisma.report.findMany({
            where: { id: reportId }
          });
          expect(userReports).toHaveLength(0);
          console.log('✓ User-owned reports deleted');

          // User's expenses should be anonymized (submitter_id set to null)
          const userExpenses = await prisma.expense.findMany({
            where: { id: { in: [expenseId, sharedExpenseId] } }
          });

          for (const expense of userExpenses) {
            expect(expense.submitter_id).toBeNull();
          }
          console.log('✓ User expenses anonymized (submitter_id set to null)');

          // User's approvals should be anonymized (user_id set to null)
          const userApprovals = await prisma.approval.findMany({
            where: { expense_id: { in: [sharedExpenseId, secondExpenseResponse.body.expense.id] } }
          });

          let foundAnonymizedApproval = false;
          for (const approval of userApprovals) {
            // Check if this approval was made by the deleted user (now anonymized)
            if (approval.user_id === null) {
              foundAnonymizedApproval = true;
            }
          }

          expect(foundAnonymizedApproval).toBe(true);
          console.log('✓ User approvals anonymized (user_id set to null)');

          // Other user's data should remain intact
          const otherUserExpense = await prisma.expense.findUnique({
            where: { id: sharedExpenseId }
          });
          expect(otherUserExpense).toBeTruthy();
          expect(otherUserExpense.submitter_id).toBeNull(); // Should be anonymized

          const otherUserReport = await prisma.report.findUnique({
            where: { id: otherReportId }
          });
          expect(otherUserReport).toBeTruthy();
          console.log('✓ Other user data preserved');

          console.log('🎉 Complete account deletion test passed!');
        } finally {
          // Clean up other user
          if (otherTestSetup) {
            await otherTestSetup.cleanup();
          }
        }
      } finally {
        // Don't clean up testSetup since the user should already be deleted
        // Just clean up any remaining Firebase auth account if deletion failed
        try {
          await admin.auth().deleteUser(testSetup.userRecord.uid);
        } catch (error) {
          // User already deleted, which is expected
        }
      }
    }, 30000); // Increase timeout for comprehensive test

    test('should handle deletion when user has no additional data', async () => {
      const testSetup = await createTestSetup({
        displayName: 'User With Minimal Data',
        email: `minimal-delete-${Date.now()}@example.com`
      });

      try {
        // Only sync user, don't create any additional data
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(201);

        const deleteResponse = await request(app)
          .delete('/api/users/me')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(200);

        expect(deleteResponse.body).toMatchObject({
          message: 'User account deleted successfully',
          details: {
            reportsDeleted: 0,
            expensesAnonymized: 0,
            approvalsAnonymized: 0,
            permissionsRemoved: 0,
            firebaseAccountDeleted: true,
            firebaseStorageFilesDeleted: true,
            databaseAccountDeleted: true
          }
        });

        console.log('✓ Minimal data deletion test passed');
      } finally {
        // Don't clean up since user should be deleted
        try {
          await admin.auth().deleteUser(testSetup.userRecord.uid);
        } catch (error) {
          // Expected - user should already be deleted
        }
      }
    });

    test('should fail deletion for unauthenticated user', async () => {
      const response = await request(app).delete('/api/users/me').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized'
      });

      console.log('✓ Unauthenticated deletion correctly rejected');
    });

    test('should fail deletion for non-existent user', async () => {
      const testSetup = await createTestSetup({
        displayName: 'Non-Synced User',
        email: `non-synced-${Date.now()}@example.com`
      });

      try {
        // Don't sync user to database, so they exist in Firebase but not in database
        const response = await request(app)
          .delete('/api/users/me')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(404);

        expect(response.body).toMatchObject({
          error: 'Not Found',
          message: 'User not found'
        });

        console.log('✓ Non-existent database user deletion correctly rejected');
      } finally {
        await testSetup.cleanup();
      }
    });

    test('should handle Firebase Storage deletion errors gracefully', async () => {
      const testSetup = await createTestSetup({
        displayName: 'Storage Error Test User',
        email: `storage-error-${Date.now()}@example.com`
      });

      try {
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(201);

        // Note: Firebase Storage should be properly configured now
        // The deletion process should handle missing files gracefully

        // Note: We're not actually creating files that will cause errors,
        // but the deletion process should handle missing files gracefully

        const deleteResponse = await request(app)
          .delete('/api/users/me')
          .set('Authorization', `Bearer ${testSetup.customToken}`)
          .expect(200);

        // Should still succeed even if some storage operations fail
        expect(deleteResponse.body.message).toBe('User account deleted successfully');
        expect(deleteResponse.body.details.firebaseStorageFilesDeleted).toBe(true);

        console.log('✓ Storage error handling test passed');
      } finally {
        try {
          await admin.auth().deleteUser(testSetup.userRecord.uid);
        } catch (error) {
          // Expected - user should already be deleted
        }
      }
    });
  });

  describe('Data Integrity During Deletion', () => {
    test('should maintain referential integrity after user deletion', async () => {
      // Create two users
      const userToDelete = await createTestSetup({
        displayName: 'User To Delete',
        email: `delete-integrity-${Date.now()}@example.com`
      });

      const permanentUser = await createTestSetup({
        displayName: 'Permanent User',
        email: `permanent-${Date.now()}@example.com`
      });

      try {
        // Sync both users
        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${userToDelete.customToken}`)
          .expect(201);

        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .expect(201);

        // Create interconnected data
        const reportResponse = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .send({ name: 'Permanent User Report' })
          .expect(201);

        const categoryResponse = await request(app)
          .post(`/api/reports/${reportResponse.body.report.id}/categories`)
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .send({ name: 'Shared Category', budget: 1000 })
          .expect(201);

        // Grant permission to user-to-delete to submit to permanent user's category
        await request(app)
          .post(`/api/categories/${categoryResponse.body.category.id}/permissions`)
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .send({
            userId: userToDelete.userRecord.uid,
            role: 'SUBMITTER'
          })
          .expect(201);

        // User to be deleted submits an expense
        const expenseResponse = await request(app)
          .post('/api/expenses')
          .set('Authorization', `Bearer ${userToDelete.customToken}`)
          .send({
            description: 'Expense from user to be deleted',
            amount: 100.0,
            categoryId: categoryResponse.body.category.id
          })
          .expect(201);

        // Permanent user approves the expense
        await request(app)
          .put(`/api/expenses/${expenseResponse.body.expense.id}/status`)
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .send({ status: 'APPROVED', notes: 'Approved by permanent user' })
          .expect(200);

        // Delete the first user
        await request(app)
          .delete('/api/users/me')
          .set('Authorization', `Bearer ${userToDelete.customToken}`)
          .expect(200);

        // Verify permanent user can still access their data
        const reportCheck = await request(app)
          .get('/api/reports')
          .set('Authorization', `Bearer ${permanentUser.customToken}`)
          .expect(200);

        expect(reportCheck.body.reports).toHaveLength(1);

        // Verify expense still exists but is anonymized
        const expenseCheck = await prisma.expense.findUnique({
          where: { id: expenseResponse.body.expense.id }
        });

        expect(expenseCheck).toBeTruthy();
        expect(expenseCheck.submitter_id).toBeNull();

        console.log('✓ Referential integrity maintained during deletion');
      } finally {
        await permanentUser.cleanup();
        // userToDelete should already be cleaned up by the deletion
        try {
          await admin.auth().deleteUser(userToDelete.userRecord.uid);
        } catch (error) {
          // Expected
        }
      }
    });
  });
});

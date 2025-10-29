// test-category-delete.js
// Focused tests for the DELETE category API endpoint

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('DELETE /api/categories/:categoryId', () => {
  let testSetup;
  let app;

  beforeEach(async () => {
    console.log('Setting up category delete test environment...');
    testSetup = await createTestSetup();
    app = createTestApp();
    console.log(`Created test user: ${testSetup.uid}`);
  });

  afterEach(async () => {
    console.log(`Cleaned up test user: ${testSetup.uid}`);
  });

  test('should delete a category with valid ownership', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Create a test report
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'Test Report for Category Delete' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    // Create a category
    const categoryResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Test Category',
        budget: 1000.0
      })
      .expect(201);

    const categoryId = categoryResponse.body.category.id;

    // Delete the category
    const deleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(200);

    // Root categories delete the entire report
    expect(deleteResponse.body).toMatchObject({
      message: 'Root category and associated report deleted successfully'
    });

    console.log(`✓ Successfully deleted category: ${categoryId}`);
  });

  test('should allow shared admin user to delete category', async () => {
    // Create two users: owner and shared admin
    const ownerSetup = await createTestSetup({ displayName: 'Owner User' });
    const sharedAdminSetup = await createTestSetup({ displayName: 'Shared Admin User' });

    // Sync both users
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${sharedAdminSetup.customToken}`)
      .expect(201);

    // Owner creates a report
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({ name: 'Shared Admin Test Report' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    // Owner creates a category
    const categoryResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Shared Category',
        budget: 1500.0
      })
      .expect(201);

    const categoryId = categoryResponse.body.category.id;

    // Owner grants ADMIN permission to shared admin
    await request(app)
      .post(`/api/categories/${categoryId}/permissions`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        userId: sharedAdminSetup.userRecord.uid,
        role: 'ADMIN'
      })
      .expect(201);

    // Shared admin user should be able to delete the category
    const deleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${sharedAdminSetup.customToken}`)
      .expect(200);

    // Root categories delete the entire report
    expect(deleteResponse.body).toMatchObject({
      message: 'Root category and associated report deleted successfully'
    });

    console.log(`✓ Shared admin successfully deleted category: ${categoryId}`);

    // Clean up
    await ownerSetup.cleanup();
    await sharedAdminSetup.cleanup();
  });

  test('should delete category with all related data (cascade test)', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Create a test report
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'Test Report for Cascade Delete' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    // Create a category
    const categoryResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Parent Category',
        budget: 2000.0
      })
      .expect(201);

    const categoryId = categoryResponse.body.category.id;

    // Create an expense in this category
    const expenseResponse = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        description: 'Test Expense',
        amount: 150.0,
        report_id: reportId,
        categoryId: categoryId
      })
      .expect(201);

    // Delete the category (should cascade delete the expense)
    const deleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(200);

    // Root categories delete the entire report
    expect(deleteResponse.body).toMatchObject({
      message: 'Root category and associated report deleted successfully'
    });

    // Verify the expense is also deleted by trying to get it
    await request(app)
      .get(`/api/expenses/${expenseResponse.body.expense.id}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(404);

    console.log('✓ Successfully cascade deleted category and related data');
  });

  test('should handle child categories correctly when parent is deleted', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Create a test report
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'Test Report for Hierarchy Delete' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    // Create a parent category (this will be a root category)
    const parentResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Parent Category',
        budget: 3000.0
      })
      .expect(201);

    const parentId = parentResponse.body.category.id;

    // Create a child category
    const childResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Child Category',
        budget: 1000.0,
        parentCategoryId: parentId
      })
      .expect(201);

    const childId = childResponse.body.category.id;

    // Delete the child category (not the parent)
    const deleteResponse = await request(app)
      .delete(`/api/categories/${childId}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(200);

    expect(deleteResponse.body).toMatchObject({
      message: 'Category deleted successfully'
    });

    // Parent category should still exist
    const parentCheck = await request(app)
      .get(`/api/categories/${parentId}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(200);

    expect(parentCheck.body.category.id).toBe(parentId);

    console.log('✓ Child deletion correctly handled without affecting parent');
  });

  test('should fail to delete category without authentication', async () => {
    const response = await request(app).delete('/api/categories/999').expect(401);

    expect(response.body).toMatchObject({
      error: 'Unauthorized'
    });

    console.log('✓ Correctly rejected unauthenticated deletion request');
  });

  test('should fail to delete category without proper permissions', async () => {
    // Create a second user
    const secondTestSetup = await createTestSetup();

    // Sync first user and create category
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'User1 Report' })
      .expect(201);

    const categoryResponse = await request(app)
      .post(`/api/reports/${reportResponse.body.report.id}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'User1 Category', budget: 500 })
      .expect(201);

    // Sync second user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
      .expect(201);

    // Try to delete category as second user (should fail)
    const deleteResponse = await request(app)
      .delete(`/api/categories/${categoryResponse.body.category.id}`)
      .set('Authorization', `Bearer ${secondTestSetup.customToken}`)
      .expect(403);

    expect(deleteResponse.body).toMatchObject({
      error: 'Forbidden'
    });

    console.log('✓ Correctly rejected unauthorized deletion attempt');

    // Clean up second test setup
    await secondTestSetup.cleanup();
  });

  test('should fail to delete non-existent category', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    const response = await request(app)
      .delete('/api/categories/99999')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found'
    });

    console.log('✓ Correctly handled non-existent category deletion');
  });

  test('should allow reviewer to delete empty subcategory of shared category', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Owner User' });
    const reviewerSetup = await createTestSetup({ displayName: 'Reviewer User' });

    // Sync both users
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(201);

    // Owner creates a report and parent category
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({ name: 'Reviewer Test Report' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    const parentResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Parent Category',
        budget: 2000.0
      })
      .expect(201);

    const parentId = parentResponse.body.category.id;

    // Owner creates a subcategory
    const subResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Subcategory',
        budget: 500.0,
        parentCategoryId: parentId
      })
      .expect(201);

    const subId = subResponse.body.category.id;

    // Owner grants REVIEWER permission to reviewer on parent category
    await request(app)
      .post(`/api/categories/${parentId}/permissions`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        userId: reviewerSetup.userRecord.uid,
        role: 'REVIEWER'
      })
      .expect(201);

    // Reviewer should be able to delete the empty subcategory
    const deleteResponse = await request(app)
      .delete(`/api/categories/${subId}`)
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(200);

    expect(deleteResponse.body).toMatchObject({
      message: 'Category deleted successfully'
    });

    console.log('✓ Reviewer successfully deleted empty subcategory');

    // Clean up
    await ownerSetup.cleanup();
    await reviewerSetup.cleanup();
  });

  test('should prevent reviewer from deleting subcategory with expenses', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Owner User' });
    const reviewerSetup = await createTestSetup({ displayName: 'Reviewer User' });

    // Sync both users
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(201);

    // Owner creates a report and parent category
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({ name: 'Reviewer Test Report 2' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    const parentResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Parent Category',
        budget: 2000.0
      })
      .expect(201);

    const parentId = parentResponse.body.category.id;

    // Owner creates a subcategory
    const subResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Subcategory with Expense',
        budget: 500.0,
        parentCategoryId: parentId
      })
      .expect(201);

    const subId = subResponse.body.category.id;

    // Owner creates an expense in the subcategory
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        description: 'Test Expense',
        amount: 100.0,
        report_id: reportId,
        categoryId: subId
      })
      .expect(201);

    // Owner grants REVIEWER permission to reviewer on parent category
    await request(app)
      .post(`/api/categories/${parentId}/permissions`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        userId: reviewerSetup.userRecord.uid,
        role: 'REVIEWER'
      })
      .expect(201);

    // Reviewer should NOT be able to delete the subcategory with expenses
    const deleteResponse = await request(app)
      .delete(`/api/categories/${subId}`)
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(403);

    expect(deleteResponse.body).toMatchObject({
      error: 'Forbidden',
      message: 'Cannot delete subcategory that contains expenses'
    });

    console.log('✓ Reviewer correctly prevented from deleting subcategory with expenses');

    // Clean up
    await ownerSetup.cleanup();
    await reviewerSetup.cleanup();
  });

  test('should prevent reviewer from deleting shared parent category', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Owner User' });
    const reviewerSetup = await createTestSetup({ displayName: 'Reviewer User' });

    // Sync both users
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(201);

    // Owner creates a report and parent category
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({ name: 'Reviewer Test Report 3' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    const parentResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Shared Parent Category',
        budget: 2000.0
      })
      .expect(201);

    const parentId = parentResponse.body.category.id;

    // Owner grants REVIEWER permission to reviewer on parent category
    await request(app)
      .post(`/api/categories/${parentId}/permissions`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        userId: reviewerSetup.userRecord.uid,
        role: 'REVIEWER'
      })
      .expect(201);

    // Reviewer should NOT be able to delete the shared parent category
    const deleteResponse = await request(app)
      .delete(`/api/categories/${parentId}`)
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(403);

    expect(deleteResponse.body).toMatchObject({
      error: 'Forbidden',
      message: 'Insufficient permissions to delete this category'
    });

    console.log('✓ Reviewer correctly prevented from deleting shared parent category');

    // Clean up
    await ownerSetup.cleanup();
    await reviewerSetup.cleanup();
  });

  test('should prevent reviewer from deleting subcategory of non-shared category', async () => {
    // Create three users: owner, reviewer, and another user
    const ownerSetup = await createTestSetup({ displayName: 'Owner User' });
    const reviewerSetup = await createTestSetup({ displayName: 'Reviewer User' });
    const otherSetup = await createTestSetup({ displayName: 'Other User' });

    // Sync all users
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${otherSetup.customToken}`)
      .expect(201);

    // Owner creates a report and categories
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({ name: 'Reviewer Test Report 4' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    // Create category shared with reviewer
    const sharedResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Shared Category',
        budget: 1000.0
      })
      .expect(201);

    const sharedId = sharedResponse.body.category.id;

    // Create category NOT shared with reviewer
    const notSharedResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Not Shared Category',
        budget: 1000.0
      })
      .expect(201);

    const notSharedId = notSharedResponse.body.category.id;

    // Create subcategory under the non-shared category
    const subResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        name: 'Subcategory of Non-Shared',
        budget: 500.0,
        parentCategoryId: notSharedId
      })
      .expect(201);

    const subId = subResponse.body.category.id;

    // Owner grants REVIEWER permission to reviewer only on shared category
    await request(app)
      .post(`/api/categories/${sharedId}/permissions`)
      .set('Authorization', `Bearer ${ownerSetup.customToken}`)
      .send({
        userId: reviewerSetup.userRecord.uid,
        role: 'REVIEWER'
      })
      .expect(201);

    // Reviewer should NOT be able to delete subcategory of non-shared category
    const deleteResponse = await request(app)
      .delete(`/api/categories/${subId}`)
      .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
      .expect(403);

    expect(deleteResponse.body).toMatchObject({
      error: 'Forbidden',
      message: 'Insufficient permissions to delete this category'
    });

    console.log('✓ Reviewer correctly prevented from deleting subcategory of non-shared category');

    // Clean up
    await ownerSetup.cleanup();
    await reviewerSetup.cleanup();
    await otherSetup.cleanup();
  });
});

module.exports = {};

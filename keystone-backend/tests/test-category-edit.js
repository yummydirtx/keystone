// test-category-edit.js
// Focused tests for the PUT category API endpoint with new REVIEWER permissions

const request = require('supertest');
const { createTestSetup } = require('./utils/testHelper');
const createTestApp = require('./utils/testApp');

describe('PUT /api/categories/:categoryId', () => {
  let testSetup;
  let app;

  beforeEach(async () => {
    console.log('Setting up category edit test environment...');
    testSetup = await createTestSetup();
    app = createTestApp();
    console.log(`Created test user: ${testSetup.uid}`);
  });

  afterEach(async () => {
    console.log(`Cleaned up test user: ${testSetup.uid}`);
  });

  test('should allow admin to edit any category they have access to', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Create a test report
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'Test Report for Category Edit' })
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

    // Edit the category
    const updateResponse = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Updated Category Name',
        budget: 2000.0
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      message: 'Category updated successfully'
    });
    expect(updateResponse.body.category.name).toBe('Updated Category Name');
    expect(updateResponse.body.category.budget).toBe('2000');

    console.log(`✓ Admin successfully edited category: ${categoryId}`);
  });

  test('should allow reviewer to edit subcategory of shared category', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Category Owner' });
    const reviewerSetup = await createTestSetup({ displayName: 'Category Reviewer' });

    try {
      // Sync both users
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .expect(201);

      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .expect(201);

      // Owner creates a report and category
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ name: 'Shared Category Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Owner creates a parent category
      const parentCategoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          name: 'Parent Category',
          budget: 1000.0
        })
        .expect(201);

      const parentId = parentCategoryResponse.body.category.id;

      // Owner creates a subcategory
      const subCategoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          name: 'Subcategory',
          budget: 500.0,
          parentCategoryId: parentId
        })
        .expect(201);

      const subId = subCategoryResponse.body.category.id;

      // Owner shares the parent category with reviewer
      await request(app)
        .post(`/api/categories/${parentId}/permissions`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          userId: reviewerSetup.userRecord.uid,
          role: 'REVIEWER'
        })
        .expect([200, 201]);

      // Reviewer should be able to edit the subcategory
      const updateResponse = await request(app)
        .put(`/api/categories/${subId}`)
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .send({
          name: 'Updated Subcategory Name',
          budget: 750.0
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        message: 'Category updated successfully'
      });
      expect(updateResponse.body.category.name).toBe('Updated Subcategory Name');
      expect(updateResponse.body.category.budget).toBe('750');

      console.log(`✓ Reviewer successfully edited subcategory: ${subId}`);
    } finally {
      await ownerSetup.cleanup();
      await reviewerSetup.cleanup();
    }
  });

  test('should prevent reviewer from editing shared parent category', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Category Owner' });
    const reviewerSetup = await createTestSetup({ displayName: 'Category Reviewer' });

    try {
      // Sync both users
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .expect(201);

      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .expect(201);

      // Owner creates a report and category
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ name: 'Shared Category Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Owner creates a category
      const categoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          name: 'Shared Category',
          budget: 1000.0
        })
        .expect(201);

      const categoryId = categoryResponse.body.category.id;

      // Owner shares the category with reviewer
      await request(app)
        .post(`/api/categories/${categoryId}/permissions`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          userId: reviewerSetup.userRecord.uid,
          role: 'REVIEWER'
        })
        .expect([200, 201]);

      // Reviewer should NOT be able to edit the shared parent category
      await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .send({
          name: 'Unauthorized Update',
          budget: 2000.0
        })
        .expect(403);

      console.log('✓ Reviewer correctly prevented from editing shared parent category');
    } finally {
      await ownerSetup.cleanup();
      await reviewerSetup.cleanup();
    }
  });

  test('should prevent reviewer from editing subcategory of non-shared category', async () => {
    // Create two users: owner and reviewer
    const ownerSetup = await createTestSetup({ displayName: 'Category Owner' });
    const reviewerSetup = await createTestSetup({ displayName: 'Category Reviewer' });

    try {
      // Sync both users
      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .expect(201);

      await request(app)
        .post('/api/users/sync')
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .expect(201);

      // Owner creates a report and categories
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({ name: 'Non-Shared Category Report' })
        .expect(201);

      const reportId = reportResponse.body.report.id;

      // Owner creates a parent category (not shared)
      const parentCategoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          name: 'Non-Shared Parent Category',
          budget: 1000.0
        })
        .expect(201);

      const parentId = parentCategoryResponse.body.category.id;

      // Owner creates a subcategory
      const subCategoryResponse = await request(app)
        .post(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${ownerSetup.customToken}`)
        .send({
          name: 'Subcategory of Non-Shared',
          budget: 500.0,
          parentCategoryId: parentId
        })
        .expect(201);

      const subId = subCategoryResponse.body.category.id;

      // Reviewer should NOT be able to edit the subcategory since parent is not shared
      await request(app)
        .put(`/api/categories/${subId}`)
        .set('Authorization', `Bearer ${reviewerSetup.customToken}`)
        .send({
          name: 'Unauthorized Update',
          budget: 750.0
        })
        .expect(403);

      console.log('✓ Reviewer correctly prevented from editing subcategory of non-shared category');
    } finally {
      await ownerSetup.cleanup();
      await reviewerSetup.cleanup();
    }
  });

  test('should fail to edit category without authentication', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Create a test report and category
    const reportResponse = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({ name: 'Test Report for Edit Auth' })
      .expect(201);

    const reportId = reportResponse.body.report.id;

    const categoryResponse = await request(app)
      .post(`/api/reports/${reportId}/categories`)
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Test Category for Edit Auth',
        budget: 1000.0
      })
      .expect(201);

    const categoryId = categoryResponse.body.category.id;

    // Try to edit without authentication
    await request(app)
      .put(`/api/categories/${categoryId}`)
      .send({
        name: 'Unauthorized Update',
        budget: 2000.0
      })
      .expect(401);

    console.log('✓ Correctly rejected unauthenticated edit request');
  });

  test('should fail to edit non-existent category', async () => {
    // Sync the user
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .expect(201);

    // Try to edit a non-existent category
    await request(app)
      .put('/api/categories/99999')
      .set('Authorization', `Bearer ${testSetup.customToken}`)
      .send({
        name: 'Non-existent Category',
        budget: 1000.0
      })
      .expect(404);

    console.log('✓ Correctly handled non-existent category edit');
  });
});

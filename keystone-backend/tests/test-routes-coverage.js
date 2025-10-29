const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Routes Coverage Tests', () => {
  let app;
  let testSetup1, testSetup2;
  let reportId, categoryId, childCategoryId;
  let user1Id, user2Id;

  beforeAll(async () => {
    console.log('🧪 Setting up routes coverage test environment...');
    app = createTestApp();

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Routes Test User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Routes Test User 2' });

    // Sync users to get database IDs
    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup1.customToken}`)
      .expect(201);

    await request(app)
      .post('/api/users/sync')
      .set('Authorization', `Bearer ${testSetup2.customToken}`)
      .expect(201);

    // Get user IDs from database
    const user1 = await prisma.user.findUnique({
      where: { firebase_uid: testSetup1.userRecord.uid }
    });
    const user2 = await prisma.user.findUnique({
      where: { firebase_uid: testSetup2.userRecord.uid }
    });

    user1Id = user1.id;
    user2Id = user2.id;

    // Create test report
    const report = await prisma.report.create({
      data: {
        name: 'Routes Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;
    console.log('🔧 Created report:', reportId, 'for user:', user1Id);

    // Create test categories
    const category = await prisma.category.create({
      data: {
        name: 'Routes Test Category',
        report_id: reportId
      }
    });
    categoryId = category.id;
    console.log('🔧 Created category:', categoryId, 'in report:', reportId);

    const childCategory = await prisma.category.create({
      data: {
        name: 'Child Routes Category',
        report_id: reportId,
        parent_category_id: categoryId
      }
    });
    childCategoryId = childCategory.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up routes coverage test environment...');
    // Clean up test data
    if (testSetup1) await testSetup1.cleanup();
    if (testSetup2) await testSetup2.cleanup();
  });

  describe('Category Routes (/api/categories)', () => {
    describe('PUT /api/categories/:categoryId', () => {
      it('should update category when user has REVIEWER permission', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Updated Category Name',
            description: 'Updated description'
          })
          .expect(200);

        expect(response.body.message).toBe('Category updated successfully');
        expect(response.body.category.name).toBe('Updated Category Name');
      });

      it('should deny category update when user lacks permission', async () => {
        await request(app)
          .put(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .send({
            name: 'Unauthorized Update'
          })
          .expect(403);
      });
    });

    describe('GET /api/categories/:categoryId', () => {
      it('should get category when user has view permission', async () => {
        console.log(
          '🔍 Testing GET /api/categories/' + categoryId + ' with user',
          testSetup1.userRecord.uid
        );

        const response = await request(app)
          .get(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`);

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response body:', JSON.stringify(response.body, null, 2));

        expect(response.status).toBe(200);
        expect(response.body.category.id).toBe(categoryId);
      });

      it('should deny category access when user lacks view permission', async () => {
        await request(app)
          .get(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .expect(403);
      });
    });

    describe('GET /api/categories/:categoryId/expenses', () => {
      beforeAll(async () => {
        // Create some test expenses
        await prisma.expense.createMany({
          data: [
            {
              description: 'Test Expense 1',
              amount: 100.5,
              transaction_date: new Date(),
              category_id: categoryId,
              report_id: reportId,
              submitter_id: user1Id
            },
            {
              description: 'Test Expense 2',
              amount: 250.75,
              transaction_date: new Date(),
              category_id: categoryId,
              report_id: reportId,
              submitter_id: user1Id
            }
          ]
        });
      });

      it('should get category expenses when user has view permission', async () => {
        const response = await request(app)
          .get(`/api/categories/${categoryId}/expenses`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.expenses).toBeDefined();
        expect(response.body.expenses).toHaveLength(2);
        expect(response.body.expenses[0].description).toBe('Test Expense 1');
      });

      it('should deny expenses access when user lacks view permission', async () => {
        await request(app)
          .get(`/api/categories/${categoryId}/expenses`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .expect(403);
      });
    });

    describe('POST /api/categories/:categoryId/permissions', () => {
      it('should grant permission when user has ADMIN role', async () => {
        const response = await request(app)
          .post(`/api/categories/${categoryId}/permissions`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            userId: testSetup2.userRecord.uid, // Use Firebase UID, not database ID
            role: 'REVIEWER'
          })
          .expect(201); // Expect 201 for new permission creation

        expect(response.body.message).toContain('Permission granted');
        expect(response.body.permission.role).toBe('REVIEWER');
      });

      it('should deny permission grant when user lacks ADMIN role', async () => {
        // First grant REVIEWER permission to user2 so they can make the request
        await prisma.categoryPermission.create({
          data: {
            user_id: user2Id,
            category_id: childCategoryId,
            role: 'REVIEWER'
          }
        });

        await request(app)
          .post(`/api/categories/${childCategoryId}/permissions`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .send({
            userId: user1Id,
            role: 'REVIEWER'
          })
          .expect(403);
      });
    });

    describe('DELETE /api/categories/:categoryId/permissions/:userId', () => {
      it('should revoke permission when user has ADMIN role', async () => {
        const response = await request(app)
          .delete(`/api/categories/${categoryId}/permissions/${testSetup2.userRecord.uid}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toContain('revoked');
      });

      it('should deny permission revocation when user lacks ADMIN role', async () => {
        // Grant permission back to user2 first
        await prisma.categoryPermission.create({
          data: {
            user_id: user2Id,
            category_id: categoryId,
            role: 'REVIEWER'
          }
        });

        await request(app)
          .delete(`/api/categories/${categoryId}/permissions/${user1Id}`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .expect(403);
      });
    });

    describe('POST /api/categories/:categoryId/share-links', () => {
      it('should create share link when user has ADMIN role', async () => {
        const response = await request(app)
          .post(`/api/categories/${categoryId}/share-links`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            permission_level: 'SUBMIT_ONLY',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          })
          .expect(201);

        expect(response.body.message).toContain('Share link created');
        expect(response.body.shareLink.token).toBeDefined();
        expect(response.body.shareLink.permission_level).toBe('SUBMIT_ONLY');
      });

      it('should deny share link creation when user lacks ADMIN role', async () => {
        await request(app)
          .post(`/api/categories/${categoryId}/share-links`)
          .set('Authorization', `Bearer ${testSetup2.customToken}`)
          .send({
            permission_level: 'SUBMIT_ONLY'
          })
          .expect(403);
      });
    });
  });

  describe('Expense Routes (/api/expenses)', () => {
    describe('GET /api/expenses/:expenseId', () => {
      let expenseId;

      beforeAll(async () => {
        const expense = await prisma.expense.create({
          data: {
            description: 'Route Test Expense',
            amount: 123.45,
            transaction_date: new Date(),
            category_id: categoryId,
            report_id: reportId,
            submitter_id: user1Id
          }
        });
        expenseId = expense.id;
      });

      it('should get expense when user has view permission', async () => {
        const response = await request(app)
          .get(`/api/expenses/${expenseId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Expense retrieved successfully');
        expect(response.body.expense.description).toBe('Route Test Expense');
      });
    });

    describe('PUT /api/expenses/:expenseId', () => {
      let expenseId;

      beforeAll(async () => {
        const expense = await prisma.expense.create({
          data: {
            description: 'Editable Expense',
            amount: 100.0,
            transaction_date: new Date(),
            category_id: categoryId,
            report_id: reportId,
            submitter_id: user1Id
          }
        });
        expenseId = expense.id;
      });

      it('should update expense when user has REVIEWER permission', async () => {
        const response = await request(app)
          .put(`/api/expenses/${expenseId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            description: 'Updated Expense Description',
            amount: 150.75
          })
          .expect(200);

        expect(response.body.message).toBe('Expense updated successfully');
        expect(response.body.expense.description).toBe('Updated Expense Description');
      });
    });

    describe('DELETE /api/expenses/:expenseId', () => {
      let expenseId;

      beforeAll(async () => {
        const expense = await prisma.expense.create({
          data: {
            description: 'Deletable Expense',
            amount: 50.0,
            transaction_date: new Date(),
            category_id: categoryId,
            report_id: reportId,
            submitter_id: user1Id
          }
        });
        expenseId = expense.id;
      });

      it('should delete expense when user has REVIEWER permission', async () => {
        const response = await request(app)
          .delete(`/api/expenses/${expenseId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Expense deleted successfully');
      });
    });
  });

  describe('Report Routes (/api/reports)', () => {
    describe('GET /api/reports/:reportId', () => {
      it('should get report when user has view permission', async () => {
        const response = await request(app)
          .get(`/api/reports/${reportId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Report retrieved successfully');
        expect(response.body.report.name).toBe('Updated Category Name');
      });
    });

    describe('PUT /api/reports/:reportId', () => {
      it('should update report when user is owner', async () => {
        const response = await request(app)
          .put(`/api/reports/${reportId}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Updated Routes Test Report'
          })
          .expect(200);

        expect(response.body.message).toBe('Report updated successfully');
        expect(response.body.report.name).toBe('Updated Routes Test Report');
      });
    });

    describe('DELETE /api/reports/:reportId', () => {
      it('should delete report when user is owner', async () => {
        // Create a separate report for deletion test
        const testReport = await prisma.report.create({
          data: {
            name: 'Report to Delete',
            owner_id: user1Id
          }
        });

        const response = await request(app)
          .delete(`/api/reports/${testReport.id}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Report deleted successfully');
      });
    });

    describe('POST /api/reports/:reportId/categories', () => {
      it('should create category when user has ADMIN permission on report', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'New Route Category',
            description: 'Created via routes test'
          })
          .expect(201);

        expect(response.body.message).toBe('Category created successfully');
        expect(response.body.category.name).toBe('New Route Category');
      });
    });

    describe('GET /api/reports/:reportId/categories', () => {
      it('should get report categories when user has view permission', async () => {
        const response = await request(app)
          .get(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Categories retrieved successfully');
        expect(response.body.categories).toBeDefined();
        expect(Array.isArray(response.body.categories)).toBe(true);
      });
    });

    describe('POST /api/reports/:reportId/expenses', () => {
      it('should create expense when user has REVIEWER permission', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/expenses`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            description: 'Route Test New Expense',
            amount: 99.99,
            categoryId: categoryId,
            transaction_date: new Date().toISOString()
          })
          .expect(201);

        expect(response.body.message).toBe('Expense created successfully');
        expect(response.body.expense.description).toBe('Route Test New Expense');
      });
    });

    describe('GET /api/reports/:reportId/expenses', () => {
      it('should get report expenses when user has view permission', async () => {
        const response = await request(app)
          .get(`/api/reports/${reportId}/expenses`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('Report expenses retrieved successfully');
        expect(response.body.expenses).toBeDefined();
        expect(Array.isArray(response.body.expenses)).toBe(true);
      });
    });
  });

  describe('User Routes (/api/users)', () => {
    describe('GET /api/users/profile', () => {
      it('should get user profile when authenticated', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.user.firebase_uid).toBe(testSetup1.userRecord.uid);
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile when authenticated', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Updated Display Name',
            avatar_url: 'https://example.com/new-avatar.jpg'
          })
          .expect(200);

        expect(response.body.message).toBe('Profile updated successfully');
        expect(response.body.user.name).toBe('Updated Display Name');
      });
    });

    describe('DELETE /api/users/profile', () => {
      it('should delete user profile when authenticated', async () => {
        // Create a separate user for deletion test
        const tempSetup = await createTestSetup({ displayName: 'User to Delete' });

        await request(app)
          .post('/api/users/sync')
          .set('Authorization', `Bearer ${tempSetup.customToken}`)
          .expect(201);

        const response = await request(app)
          .delete('/api/users/me')
          .set('Authorization', `Bearer ${tempSetup.customToken}`)
          .expect(200);

        expect(response.body.message).toBe('User account deleted successfully');
      });
    });
  });
});

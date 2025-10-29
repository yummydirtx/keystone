const request = require('supertest');
const createTestApp = require('./utils/testApp');
const { createTestSetup, cleanupTestData } = require('./utils/testHelper');
const prisma = require('../src/config/database');

describe('Category Controller Coverage Tests', () => {
  let app;
  let testSetup1, testSetup2;
  let reportId;
  let user1Id, user2Id;

  beforeAll(async () => {
    console.log('🧪 Setting up category controller coverage tests...');
    app = createTestApp();

    // Set up test users
    testSetup1 = await createTestSetup({ displayName: 'Category Test User 1' });
    testSetup2 = await createTestSetup({ displayName: 'Category Test User 2' });

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
        name: 'Category Controller Test Report',
        owner_id: user1Id
      }
    });
    reportId = report.id;
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up category controller tests...');
    // Clean up test data
    await cleanupTestData(testSetup1.userRecord.uid);
    await cleanupTestData(testSetup2.userRecord.uid);
  });

  describe('createCategory', () => {
    describe('validation tests', () => {
      it('should reject creation with missing name', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            budget: 1000
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Category name is required');
      });

      it('should reject creation with empty name', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: '',
            budget: 1000
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Category name is required');
      });

      it('should reject creation with whitespace-only name', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: '   ',
            budget: 1000
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Category name is required');
      });

      it('should reject creation for non-existent report', async () => {
        const response = await request(app)
          .post('/api/reports/99999/categories')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Test Category'
          })
          .expect(404);

        expect(response.body.error).toBe('Not Found');
        expect(response.body.message).toBe('Report not found');
      });

      it('should reject creation with non-existent parent category', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Child Category',
            parentCategoryId: 99999
          })
          .expect(404);

        expect(response.body.error).toBe('Not Found');
        expect(response.body.message).toBe('Parent category not found');
      });

      it('should reject creation with parent category from different report', async () => {
        // Create another report with a category
        const otherReport = await prisma.report.create({
          data: {
            name: 'Other Report',
            owner_id: user1Id
          }
        });

        const otherCategory = await prisma.category.create({
          data: {
            name: 'Other Category',
            report_id: otherReport.id
          }
        });

        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Invalid Child Category',
            parentCategoryId: otherCategory.id
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Parent category must belong to the same report');
      });
    });

    describe('successful creation tests', () => {
      it('should create root category with just name', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Root Category'
          })
          .expect(201);

        expect(response.body.message).toBe('Category created successfully');
        expect(response.body.category.name).toBe('Root Category');
        expect(response.body.category.budget).toBe('0');
        expect(response.body.category.parentCategory).toBeNull();
        expect(response.body.category.report.id).toBe(reportId);
      });

      it('should create category with name and budget', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Budget Category',
            budget: 2500.75
          })
          .expect(201);

        expect(response.body.category.name).toBe('Budget Category');
        expect(response.body.category.budget).toBe('2500.75');
      });

      it('should create child category with parent', async () => {
        // First create a parent category
        const parentResponse = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Parent Category'
          })
          .expect(201);

        const parentId = parentResponse.body.category.id;

        // Then create a child category
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Child Category',
            parentCategoryId: parentId,
            budget: 500
          })
          .expect(201);

        expect(response.body.category.name).toBe('Child Category');
        expect(response.body.category.parentCategory.id).toBe(parentId);
        expect(response.body.category.parentCategory.name).toBe('Parent Category');
      });

      it('should trim whitespace from category name', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: '  Trimmed Category  '
          })
          .expect(201);

        expect(response.body.category.name).toBe('Trimmed Category');
      });

      it('should handle string budget conversion', async () => {
        const response = await request(app)
          .post(`/api/reports/${reportId}/categories`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'String Budget Category',
            budget: '1234.56'
          })
          .expect(201);

        expect(response.body.category.budget).toBe('1234.56');
      });
    });

    describe('error handling tests', () => {
      it('should handle database errors gracefully', async () => {
        // Test with invalid report ID format
        const response = await request(app)
          .post('/api/reports/invalid_id/categories')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Test Category'
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Invalid report ID');
      });
    });
  });

  describe('getCategories', () => {
    let rootCategory1Id, rootCategory2Id, childCategory1Id, childCategory2Id;

    beforeAll(async () => {
      // Create a hierarchical structure for testing
      const root1 = await prisma.category.create({
        data: {
          name: 'Root Category 1',
          budget: 1000,
          report_id: reportId
        }
      });
      rootCategory1Id = root1.id;

      const root2 = await prisma.category.create({
        data: {
          name: 'Root Category 2',
          budget: 2000,
          report_id: reportId
        }
      });
      rootCategory2Id = root2.id;

      const child1 = await prisma.category.create({
        data: {
          name: 'Child Category 1',
          budget: 500,
          report_id: reportId,
          parent_category_id: rootCategory1Id
        }
      });
      childCategory1Id = child1.id;

      const child2 = await prisma.category.create({
        data: {
          name: 'Child Category 2',
          budget: 300,
          report_id: reportId,
          parent_category_id: rootCategory1Id
        }
      });
      childCategory2Id = child2.id;

      // Add some expenses to test counts
      await prisma.expense.createMany({
        data: [
          {
            description: 'Expense 1',
            amount: 100,
            transaction_date: new Date(),
            category_id: rootCategory1Id,
            report_id: reportId,
            submitter_id: user1Id
          },
          {
            description: 'Expense 2',
            amount: 200,
            transaction_date: new Date(),
            category_id: childCategory1Id,
            report_id: reportId,
            submitter_id: user1Id
          }
        ]
      });
    });

    it('should return hierarchical category structure', async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.message).toBe('Categories retrieved successfully');
      expect(response.body.categories).toBeDefined();
      expect(response.body.totalCount).toBeGreaterThan(0);

      // Check that root categories are returned
      const rootCategories = response.body.categories;
      expect(rootCategories.length).toBeGreaterThanOrEqual(2);

      // Find our test categories
      const root1 = rootCategories.find((cat) => cat.name === 'Root Category 1');
      const root2 = rootCategories.find((cat) => cat.name === 'Root Category 2');

      expect(root1).toBeDefined();
      expect(root2).toBeDefined();

      // Check that children are properly nested
      expect(root1.children.length).toBe(2);
      expect(root1.children.some((child) => child.name === 'Child Category 1')).toBe(true);
      expect(root1.children.some((child) => child.name === 'Child Category 2')).toBe(true);

      // Check that expenses and subcategory counts are included
      expect(root1.expensesCount).toBe(1);
      expect(root1.subcategoriesCount).toBe(2);
    });

    it('should handle empty report gracefully (legacy/direct DB creation)', async () => {
      // Create a new empty report directly via Prisma (bypassing API) to test edge case
      // This simulates legacy data or direct database operations without default categories
      const emptyReport = await prisma.report.create({
        data: {
          name: 'Empty Report',
          owner_id: user1Id
        }
      });

      const response = await request(app)
        .get(`/api/reports/${emptyReport.id}/categories`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.categories).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/invalid_id/categories')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid report ID');
    });
  });

  describe('updateCategory', () => {
    let categoryToUpdate;

    beforeAll(async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Updatable Category',
          budget: 1000,
          report_id: reportId
        }
      });
      categoryToUpdate = category.id;
    });

    describe('validation tests', () => {
      it('should reject update with no fields provided', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('At least one field (name or budget) must be provided');
      });

      it('should reject update for non-existent category', async () => {
        const response = await request(app)
          .put('/api/categories/99999')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'New Name'
          })
          .expect(403);

        expect(response.body.error).toBe('Forbidden');
        expect(response.body.message).toBe('Insufficient permissions. REVIEWER role required.');
      });
    });

    describe('successful update tests', () => {
      it('should update category name only', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Updated Category Name'
          })
          .expect(200);

        expect(response.body.message).toBe('Category updated successfully');
        expect(response.body.category.name).toBe('Updated Category Name');
        expect(response.body.category.budget).toBe('1000'); // Should remain unchanged
      });

      it('should update category budget only', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            budget: 2500.5
          })
          .expect(200);

        expect(response.body.category.budget).toBe('2500.5');
        expect(response.body.category.name).toBe('Updated Category Name'); // Should remain unchanged
      });

      it('should update both name and budget', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Fully Updated Category',
            budget: 3000
          })
          .expect(200);

        expect(response.body.category.name).toBe('Fully Updated Category');
        expect(response.body.category.budget).toBe('3000');
      });

      it('should trim whitespace from updated name', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: '  Trimmed Updated Name  '
          })
          .expect(200);

        expect(response.body.category.name).toBe('Trimmed Updated Name');
      });

      it('should handle string budget conversion', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            budget: '4567.89'
          })
          .expect(200);

        expect(response.body.category.budget).toBe('4567.89');
      });

      it('should handle zero budget', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            budget: 0
          })
          .expect(200);

        expect(response.body.category.budget).toBe('0');
      });

      it('should include all category details in response', async () => {
        const response = await request(app)
          .put(`/api/categories/${categoryToUpdate}`)
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'Detailed Category'
          })
          .expect(200);

        expect(response.body.category.id).toBe(categoryToUpdate);
        expect(response.body.category.report).toBeDefined();
        expect(response.body.category.expensesCount).toBeDefined();
        expect(response.body.category.subcategoriesCount).toBeDefined();
        expect(response.body.category.createdAt).toBeDefined();
        expect(response.body.category.updatedAt).toBeDefined();
      });
    });

    describe('error handling tests', () => {
      it('should handle database errors gracefully', async () => {
        const response = await request(app)
          .put('/api/categories/invalid_id')
          .set('Authorization', `Bearer ${testSetup1.customToken}`)
          .send({
            name: 'New Name'
          })
          .expect(400);

        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Invalid category ID');
      });
    });
  });

  describe('getCategory', () => {
    let testCategory, parentCategory, childCategory;

    beforeAll(async () => {
      // Create parent category
      const parent = await prisma.category.create({
        data: {
          name: 'Get Test Parent',
          budget: 2000,
          report_id: reportId
        }
      });
      parentCategory = parent.id;

      // Create main test category
      const main = await prisma.category.create({
        data: {
          name: 'Get Test Category',
          budget: 1500,
          report_id: reportId,
          parent_category_id: parentCategory
        }
      });
      testCategory = main.id;

      // Create child category
      const child = await prisma.category.create({
        data: {
          name: 'Get Test Child',
          budget: 500,
          report_id: reportId,
          parent_category_id: testCategory
        }
      });
      childCategory = child.id;

      // Add some expenses to test counts
      await prisma.expense.createMany({
        data: [
          {
            description: 'Get Test Expense 1',
            amount: 100,
            transaction_date: new Date(),
            category_id: testCategory,
            report_id: reportId,
            submitter_id: user1Id
          },
          {
            description: 'Get Test Expense 2',
            amount: 200,
            transaction_date: new Date(),
            category_id: testCategory,
            report_id: reportId,
            submitter_id: user1Id
          }
        ]
      });
    });

    it('should return complete category details', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategory}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.message).toBe('Category retrieved successfully');
      expect(response.body.category.id).toBe(testCategory);
      expect(response.body.category.name).toBe('Get Test Category');
      expect(response.body.category.budget).toBe('1500');

      // Check parent category details
      expect(response.body.category.parentCategory).toBeDefined();
      expect(response.body.category.parentCategory.id).toBe(parentCategory);
      expect(response.body.category.parentCategory.name).toBe('Get Test Parent');

      // Check children details
      expect(response.body.category.children).toBeDefined();
      expect(response.body.category.children.length).toBe(1);
      expect(response.body.category.children[0].name).toBe('Get Test Child');

      // Check report details
      expect(response.body.category.report).toBeDefined();
      expect(response.body.category.report.id).toBe(reportId);

      // Check counts
      expect(response.body.category.expensesCount).toBe(2);
      expect(response.body.category.subcategoriesCount).toBe(1);

      // Check timestamps
      expect(response.body.category.createdAt).toBeDefined();
      expect(response.body.category.updatedAt).toBeDefined();
    });

    it('should return root category without parent', async () => {
      const response = await request(app)
        .get(`/api/categories/${parentCategory}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.category.parentCategory).toBeNull();
      expect(response.body.category.children.length).toBeGreaterThan(0);
    });

    it('should return leaf category without children', async () => {
      const response = await request(app)
        .get(`/api/categories/${childCategory}`)
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(200);

      expect(response.body.category.children).toEqual([]);
      expect(response.body.category.parentCategory).toBeDefined();
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/99999')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Category not found');
    });

    it('should handle database errors gracefully', async () => {
      const response = await request(app)
        .get('/api/categories/invalid_id')
        .set('Authorization', `Bearer ${testSetup1.customToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid category ID');
    });
  });
});

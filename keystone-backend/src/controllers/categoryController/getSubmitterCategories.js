const { prisma, getUserByFirebaseUid } = require('./utils');

/**
 * Get all categories where the current user has submitter-or-higher permissions.
 * This includes:
 * - Categories with direct permissions (SUBMITTER, REVIEWER, ADMIN)
 * - Categories within reports owned by the user (treated as ADMIN)
 * - Expanded hierarchy: includes subcategories under permitted categories
 *
 * GET /api/users/me/submitter-categories
 */
const getSubmitterCategories = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found. Please sync your account first.'
      });
    }

    // 1) Get direct permissions that grant submit rights
    const directPermissions = await prisma.categoryPermission.findMany({
      where: {
        user_id: user.id,
        role: { in: ['SUBMITTER', 'REVIEWER', 'ADMIN'] }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parent_category_id: true,
            allow_user_submissions: true,
            allow_guest_submissions: true,
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
            }
          }
        }
      }
    });

    // 2) Get categories from reports owned by the user (treated as ADMIN)
    const ownedRootCategories = await prisma.category.findMany({
      where: {
        report: { owner_id: user.id },
        parent_category_id: null
      },
      select: {
        id: true,
        name: true,
        parent_category_id: true,
        allow_user_submissions: true,
        allow_guest_submissions: true,
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
        }
      }
    });

    // Helper: recursively collect a category and all of its descendants
    const collectWithDescendants = async (rootCategory) => {
      const collected = [];
      const seen = new Set();
      const queue = [];

      // Seed with the provided root category
      queue.push({
        id: rootCategory.id,
        name: rootCategory.name,
        report: rootCategory.report,
        parent_category_id: rootCategory.parent_category_id ?? null,
        allow_user_submissions: rootCategory.allow_user_submissions,
        allow_guest_submissions: rootCategory.allow_guest_submissions
      });

      while (queue.length > 0) {
        const current = queue.shift();
        if (seen.has(current.id)) continue;
        seen.add(current.id);
        collected.push(current);

        // Fetch immediate children of current
        const children = await prisma.category.findMany({
          where: { parent_category_id: current.id },
          select: {
            id: true,
            name: true,
            parent_category_id: true,
            allow_user_submissions: true,
            allow_guest_submissions: true,
            // Report is the same as root's report, but include for consistency
            report: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: { id: true, name: true, email: true, avatar_url: true }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        });

        for (const child of children) {
          if (!seen.has(child.id)) {
            queue.push(child);
          }
        }
      }

      return collected;
    };

    // Build a map of categories to ensure unique entries
    const submitterCategoryMap = new Map();

    // From direct permissions: add category and descendants
    for (const perm of directPermissions) {
      const role = perm.role;
      const root = {
        id: perm.category.id,
        name: perm.category.name,
        parent_category_id: perm.category.parent_category_id,
        allow_user_submissions: perm.category.allow_user_submissions,
        allow_guest_submissions: perm.category.allow_guest_submissions,
        report: perm.category.report
      };
      const collected = await collectWithDescendants(root);
      for (const c of collected) {
        if (!submitterCategoryMap.has(c.id)) {
          submitterCategoryMap.set(c.id, { role, category: c });
        }
      }
    }

    // From owned reports: treat as ADMIN, add all categories and descendants
    for (const cat of ownedRootCategories) {
      const collected = await collectWithDescendants(cat);
      for (const c of collected) {
        if (!submitterCategoryMap.has(c.id)) {
          submitterCategoryMap.set(c.id, { role: 'OWNER', category: c });
        }
      }
    }

    // Format response as array
    const submitterCategories = Array.from(submitterCategoryMap.values());

    return res.status(200).json({
      message: 'Submitter categories retrieved successfully',
      submitterCategories
    });
  } catch (error) {
    console.error('Error getting submitter categories:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve submitter categories'
    });
  }
};

module.exports = { getSubmitterCategories };

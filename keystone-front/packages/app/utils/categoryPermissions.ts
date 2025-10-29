import type { Category } from '../types'

/**
 * Determines if a user can edit a category based on their role and the category structure
 * @param userRole - The user's role (ADMIN, REVIEWER, SUBMITTER)
 * @param category - The category to check permissions for
 * @param hasDirectPermission - Whether the user has direct permissions on this category
 * @returns boolean - Whether the user can edit the category
 */
export function canEditCategory(
  userRole: string | null,
  category: Category | null,
  hasDirectPermission = false
): boolean {
  if (!userRole || !category) return false

  // ADMIN users can edit any category they have access to
  if (userRole === 'ADMIN') return true

  // REVIEWER users can edit subcategories of categories shared with them
  // BUT they cannot edit the category that was specifically shared with them
  if (userRole === 'REVIEWER') {
    // If they have direct permissions on this category, they cannot edit it
    if (hasDirectPermission) {
      return false
    }
    // If they have inherited permissions (no direct permission), they can edit subcategories
    return true
  }

  return false
}

/**
 * Determines if a user can delete a category based on their role and the category structure
 * @param userRole - The user's role (ADMIN, REVIEWER, SUBMITTER)
 * @param category - The category to check permissions for
 * @param hasDirectPermission - Whether the user has direct permissions on this category
 * @returns boolean - Whether the user can delete the category
 */
export function canDeleteCategory(
  userRole: string | null,
  category: Category | null,
  hasDirectPermission = false
): boolean {
  if (!userRole || !category) return false

  // ADMIN users can delete any category they have access to
  if (userRole === 'ADMIN') return true

  // REVIEWER users can delete empty subcategories of categories shared with them
  // BUT they cannot delete the category that was specifically shared with them
  if (userRole === 'REVIEWER') {
    // If they have direct permissions on this category, they cannot delete it
    if (hasDirectPermission) {
      return false
    }
    // If they have inherited permissions (no direct permission), they can delete subcategories
    // Check if the category has no expenses (this would be determined by the backend)
    // For now, we'll assume REVIEWER can delete subcategories - the backend will validate
    return true
  }

  return false
}

/**
 * Determines if a user can create categories based on their role
 * @param userRole - The user's role (ADMIN, REVIEWER, SUBMITTER)
 * @returns boolean - Whether the user can create categories
 */
export function canCreateCategory(userRole: string | null): boolean {
  if (!userRole) return false

  // ADMIN and REVIEWER users can create categories
  return userRole === 'ADMIN' || userRole === 'REVIEWER'
}

/**
 * Determines if a user can share a category based on their role
 * @param userRole - The user's role (ADMIN, REVIEWER, SUBMITTER)
 * @returns boolean - Whether the user can share the category
 */
export function canShareCategory(userRole: string | null): boolean {
  if (!userRole) return false

  // Only ADMIN users can share categories
  return userRole === 'ADMIN'
}

/**
 * Determines if a user can access category options based on their role
 * @param userRole - The user's role (ADMIN, REVIEWER, SUBMITTER)
 * @returns boolean - Whether the user can access category options
 */
export function canAccessCategoryOptions(userRole: string | null): boolean {
  if (!userRole) return false

  // Only ADMIN users can access category options
  return userRole === 'ADMIN'
}

/**
 * Calculates the allocated amount for a category as:
 * spent amount + unspent subcategory budgets
 *
 * Where "unspent subcategory budgets" = sum of (subcategory budget - subcategory spent amount)
 * This avoids double counting expenses that are in subcategories.
 *
 * @param category - The category to calculate allocated amount for
 * @returns number - The allocated amount, or 0 if not available
 */
export function calculateAllocatedAmount(category: Category | null): number {
  if (!category) return 0

  // The spent amount for this category (already includes spending from subcategories)
  const spentAmount = category.spentAmount ?? 0

  // Calculate unspent subcategory budgets
  // This is the sum of (subcategory budget - subcategory spent amount) for all subcategories
  let unspentSubcategoryBudgets = 0
  if (category.children && category.children.length > 0) {
    category.children.forEach((child) => {
      if (child.budget) {
        const subcategoryBudget = Number.parseFloat(child.budget.toString())
        const subcategorySpent = child.spentAmount ?? 0
        unspentSubcategoryBudgets += subcategoryBudget - subcategorySpent
      }
    })
  }

  // Return the sum of spent amount and unspent subcategory budgets
  return spentAmount + unspentSubcategoryBudgets
}

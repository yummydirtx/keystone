import { useState, useEffect } from 'react'
import { useToastController } from '@my/ui'
import {
  getCategory,
  getCategories,
  getExpensesForCategory,
  createCategory,
  updateCategory,
  grantCategoryPermission,
  deleteCategory,
  getGuestData,
  getGuestCategoryData,
} from '../../../utils/api'
import type { Category, Expense } from '../../../types'
import { useAuth } from '../../../provider/AuthProvider'
import { useRouter } from 'solito/navigation'

/**
 * Custom hook for managing category detail screen state and operations.
 * This hook provides comprehensive functionality for viewing and managing
 * a specific category, including expenses, subcategories, sharing, and
 * CRUD operations. It handles complex state management for category hierarchies
 * and permission-based operations.
 *
 * @param {string} id - The category ID to load and manage.
 * @returns {object} Category detail state and handlers.
 * @returns {Category | null} returns.category - The current category data.
 * @returns {Category[]} returns.allCategories - All available categories for hierarchical display.
 * @returns {Expense[]} returns.expenses - Expenses associated with this category.
 * @returns {boolean} returns.loading - Whether initial data is loading.
 * @returns {string | null} returns.error - Any error message from operations.
 * @returns {boolean} returns.menuOpen - Whether the menu is currently open.
 * @returns {boolean} returns.createCategoryOpen - Whether the create category dialog is open.
 * @returns {boolean} returns.editCategoryOpen - Whether the edit category dialog is open.
 * @returns {boolean} returns.createExpenseOpen - Whether the create expense dialog is open.
 * @returns {boolean} returns.shareDialogOpen - Whether the share dialog is open.
 * @returns {boolean} returns.deleteCategoryOpen - Whether the delete category dialog is open.
 * @returns {boolean} returns.creating - Whether a create operation is in progress.
 * @returns {boolean} returns.updating - Whether an update operation is in progress.
 * @returns {boolean} returns.sharing - Whether a sharing operation is in progress.
 * @returns {boolean} returns.deleting - Whether a delete operation is in progress.
 * @returns {Set<number>} returns.collapsedCategories - Set of collapsed category IDs.
 * @returns {string | null} returns.reportId - Associated report ID if applicable.
 * @returns {number} returns.categoryId - The parsed category ID as number.
 * @returns {boolean} returns.authLoading - Whether authentication is loading.
 * @returns {object} returns.user - The current authenticated user.
 * @returns {function} returns.setMenuOpen - Function to toggle menu open state.
 * @returns {function} returns.setCreateCategoryOpen - Function to toggle create category dialog.
 * @returns {function} returns.setEditCategoryOpen - Function to toggle edit category dialog.
 * @returns {function} returns.setCreateExpenseOpen - Function to toggle create expense dialog.
 * @returns {function} returns.setShareDialogOpen - Function to toggle share dialog.
 * @returns {function} returns.setDeleteCategoryOpen - Function to toggle delete category dialog.
 * @returns {function} returns.handleCreateCategory - Async function to create a new category.
 * @returns {function} returns.handleUpdateCategory - Async function to update the category.
 * @returns {function} returns.handleShareCategory - Async function to share category with another user.
 * @returns {function} returns.handleDeleteCategory - Async function to delete the category.
 * @returns {function} returns.handleToggleCollapse - Function to toggle category collapse state.
 * @returns {function} returns.fetchData - Async function to refresh all category data.
 *
 * @example
 * // Basic usage in a category detail screen
 * function CategoryDetailScreen({ id }: { id: string }) {
 *   const {
 *     category,
 *     expenses,
 *     loading,
 *     handleCreateCategory,
 *     createCategoryOpen,
 *     setCreateCategoryOpen
 *   } = useCategoryDetail(id)
 *
 *   if (loading) return <Loading />
 *
 *   return (
 *     <YStack>
 *       <H1>{category?.name}</H1>
 *       <ExpenseList expenses={expenses} />
 *       <Button onPress={() => setCreateCategoryOpen(true)}>
 *         Add Subcategory
 *       </Button>
 *     </YStack>
 *   )
 * }
 *
 * @example
 * // Using category sharing functionality
 * function CategoryScreen({ id }: { id: string }) {
 *   const {
 *     handleShareCategory,
 *     shareDialogOpen,
 *     setShareDialogOpen,
 *     sharing
 *   } = useCategoryDetail(id)
 *
 *   return (
 *     <YStack>
 *       <Button onPress={() => setShareDialogOpen(true)}>
 *         Share Category
 *       </Button>
 *       <ShareDialog
 *         open={shareDialogOpen}
 *         onShare={handleShareCategory}
 *         loading={sharing}
 *       />
 *     </YStack>
 *   )
 * }
 */
export function useCategoryDetail(id: string): {
  category: Category | null
  allCategories: Category[]
  expenses: Expense[]
  loading: boolean
  error: string | null
  menuOpen: boolean
  createCategoryOpen: boolean
  editCategoryOpen: boolean
  createExpenseOpen: boolean
  shareDialogOpen: boolean
  deleteCategoryOpen: boolean
  creating: boolean
  updating: boolean
  sharing: boolean
  deleting: boolean
  collapsedCategories: Set<number>
  reportId: string | null
  categoryId: number
  authLoading: boolean
  user: any
  userRole: string | null
  hasDirectPermission: boolean
  setMenuOpen: (open: boolean) => void
  setCreateCategoryOpen: (open: boolean) => void
  setEditCategoryOpen: (open: boolean) => void
  setCreateExpenseOpen: (open: boolean) => void
  setShareDialogOpen: (open: boolean) => void
  setDeleteCategoryOpen: (open: boolean) => void
  handleCreateCategory: (name: string, budget: number) => Promise<void>
  handleUpdateCategory: (name: string, budget: number) => Promise<void>
  handleShareCategory: (email: string, role: string) => Promise<void>
  handleDeleteCategory: () => Promise<void>
  handleToggleCollapse: (categoryId: number) => void
  fetchData: () => Promise<void>
} {
  const { user, loading: authLoading, isGuest, guestSession } = useAuth()
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasDirectPermission, setHasDirectPermission] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())
  const [reportId, setWorkspaceId] = useState<string | null>(null)
  const toast = useToastController()

  const categoryId = Number.parseInt(id, 10)

  // Helper function to find a category by ID in the hierarchical structure
  const findCategoryById = (categories: Category[], targetId: number): Category | null => {
    for (const category of categories) {
      if (category.id === targetId) {
        return category
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  const fetchData = async () => {
    if (authLoading || (!user && !isGuest) || !id) {
      // Don't fetch if auth is loading, no user/guest session, or no category ID
      return
    }

    try {
      setLoading(true)

      // Handle guest users
      if (isGuest && guestSession) {
        let guestResponse

        // If the category ID matches the guest session's original category, use the general guest endpoint
        if (id === guestSession.categoryId.toString()) {
          guestResponse = await getGuestData(guestSession.token)
        } else {
          // For navigation to other categories, use the specific category endpoint
          guestResponse = await getGuestCategoryData(guestSession.token, id)
        }

        if (!(guestResponse as any).data?.category) {
          throw new Error('Category not found')
        }

        const categoryData = (guestResponse as any).data.category
        setCategory(categoryData)
        setUserRole((guestResponse as any).data.permission_level)

        // For REVIEW_ONLY guests, build the navigation structure from the current category
        if ((guestResponse as any).data.permission_level === 'REVIEW_ONLY') {
          const allCategoriesForNavigation = [categoryData]

          // Add parent category if it exists
          if (categoryData.parentCategory) {
            allCategoriesForNavigation.unshift(categoryData.parentCategory)
          }

          // Add child categories if they exist
          if (categoryData.children && categoryData.children.length > 0) {
            allCategoriesForNavigation.push(...categoryData.children)
          }

          setAllCategories(allCategoriesForNavigation)
        } else {
          // For SUBMIT_ONLY guests, only show the single category
          setAllCategories([categoryData])
        }

        // Set expenses if provided (for REVIEW_ONLY guests)
        if ((guestResponse as any).data.expenses) {
          setExpenses((guestResponse as any).data.expenses)
        } else {
          setExpenses([])
        }

        // Set report ID from category data
        if (categoryData.report?.id) {
          setWorkspaceId(categoryData.report.id.toString())
        }

        setError(null)
        return
      }

      // Handle regular authenticated users
      const categoryResponse = await getCategory(id)
      if (!(categoryResponse as any).category) {
        throw new Error('Category not found')
      }

      const categoryData = (categoryResponse as any).category
      const userRoleData = (categoryResponse as any).userRole
      const hasDirectPermissionData = (categoryResponse as any).hasDirectPermission
      setUserRole(userRoleData)
      setHasDirectPermission(hasDirectPermissionData)
      const extractedWorkspaceId = categoryData.report?.id

      if (!extractedWorkspaceId) {
        throw new Error('Workspace ID not found')
      }

      setWorkspaceId(extractedWorkspaceId.toString())

      const categoriesResponse = await getCategories(extractedWorkspaceId.toString())
      if ((categoriesResponse as any).categories) {
        const allCats = (categoriesResponse as any).categories
        setAllCategories(allCats)

        const foundCategory = findCategoryById(allCats, categoryId)
        if (foundCategory) {
          setCategory(foundCategory)
        } else {
          setCategory(categoryData)
        }
      } else {
        setCategory(categoryData)
      }

      const expensesResponse = await getExpensesForCategory(id)
      if ((expensesResponse as any).expenses) {
        setExpenses((expensesResponse as any).expenses)
      }

      setError(null)
    } catch (err) {
      setError((err as any).message || 'Failed to load category data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id, user, authLoading, isGuest, guestSession])

  const handleCreateCategory = async (name: string, budget: number) => {
    try {
      setCreating(true)
      if (!reportId) {
        throw new Error('Workspace ID not found')
      }

      await createCategory(reportId, {
        name: name,
        budget: budget,
        parentCategoryId: categoryId,
      })
      fetchData()
      setCreateCategoryOpen(false)
    } catch (err) {
      console.error('Failed to create category:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateCategory = async (name: string, budget: number) => {
    try {
      setUpdating(true)
      await updateCategory(id, { name: name, budget: budget })
      fetchData()
      setEditCategoryOpen(false)
    } catch (err) {
      console.error('Failed to update category:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleShareCategory = async (email: string, role: string) => {
    try {
      setSharing(true)
      const response = await grantCategoryPermission(id, email.trim().toLowerCase(), role)

      if (response && (response as any).permission) {
        toast.show('Success', { message: `Category shared with ${email}.` })
        setShareDialogOpen(false)
      } else {
        throw new Error((response as any).message || 'Failed to share category.')
      }
    } catch (err) {
      console.error('Failed to share category:', err)
      if ((err as Error).message.includes('not found')) {
        toast.show('Error', { message: 'User with that email not found.' })
      } else {
        toast.show('Error', { message: (err as Error).message })
      }
    } finally {
      setSharing(false)
    }
  }

  const handleDeleteCategory = async () => {
    try {
      setDeleting(true)
      const response = await deleteCategory(id)

      if (response && (response as any).message) {
        toast.show('Success', { message: 'Category deleted successfully.' })
        setDeleteCategoryOpen(false)
        // Navigate back to parent category or dashboard
        router.back()
      } else {
        throw new Error((response as any).message || 'Failed to delete category.')
      }
    } catch (err) {
      console.error('Failed to delete category:', err)
      toast.show('Error', { message: (err as Error).message })
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleCollapse = (categoryId: number) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return {
    // State
    category,
    allCategories,
    expenses,
    loading,
    error,
    userRole,
    hasDirectPermission,
    menuOpen,
    createCategoryOpen,
    editCategoryOpen,
    createExpenseOpen,
    shareDialogOpen,
    deleteCategoryOpen,
    creating,
    updating,
    sharing,
    deleting,
    collapsedCategories,
    reportId,
    categoryId,
    authLoading,
    user,

    // Actions
    setMenuOpen,
    setCreateCategoryOpen,
    setEditCategoryOpen,
    setCreateExpenseOpen,
    setShareDialogOpen,
    setDeleteCategoryOpen,
    handleCreateCategory,
    handleUpdateCategory,
    handleShareCategory,
    handleDeleteCategory,
    handleToggleCollapse,
    fetchData,
  }
}

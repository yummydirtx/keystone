import { useState, useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToastController } from '@my/ui'
import type { Category, Expense } from '../../../types'
import { useAuth } from '../../../provider/AuthProvider'
import { useRouter } from 'solito/navigation'
import {
  useCategory,
  useCategories,
  useExpensesForCategory,
  useGuestData,
  useGuestCategoryData,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useGrantCategoryPermission,
} from '../../../utils/queries.optimized'

// Define the return type explicitly to avoid TypeScript issues
interface UseCategoryDetailQueryReturn {
  // Data
  category: Category | null
  allCategories: Category[]
  expenses: Expense[]
  loading: boolean
  error: string | null
  userRole: string | null
  hasDirectPermission: boolean
  reportId: string | null
  categoryId: number
  authLoading: boolean
  user: any // Using 'any' to match the original hook's type

  // UI State
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

  // Actions
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
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing category detail screen state and operations using TanStack Query.
 * This hook provides comprehensive functionality for viewing and managing
 * a specific category, including expenses, subcategories, sharing, and
 * CRUD operations. It handles complex state management for category hierarchies
 * and permission-based operations.
 *
 * @param {string} id - The category ID to load and manage.
 * @returns {UseCategoryDetailQueryReturn} Category detail state and handlers.
 */
export function useCategoryDetailQuery(id: string): UseCategoryDetailQueryReturn {
  const { user, loading: authLoading, isGuest, guestSession } = useAuth()
  const router = useRouter()
  const toast = useToastController()
  const queryClient = useQueryClient()

  // On native (especially iOS), avoid transient refetch that can cause a brief reload
  const noRefetchOnMountOptions =
    Platform.OS !== 'web'
      ? {
          refetchOnMount: false as const,
          refetchOnWindowFocus: false as const,
          refetchOnReconnect: false as const,
          staleTime: 60_000 as const,
        }
      : {}

  // UI state (these don't need to be queries as they're purely UI state)
  const [menuOpen, setMenuOpen] = useState(false)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasDirectPermission, setHasDirectPermission] = useState<boolean>(false)
  const [processedData, setProcessedData] = useState<{
    category: Category | null
    allCategories: Category[]
    expenses: Expense[]
    reportId: string | null
  }>({ category: null, allCategories: [], expenses: [], reportId: null })

  const categoryId = Number.parseInt(id, 10)

  // Mutations
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const grantCategoryPermissionMutation = useGrantCategoryPermission()

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

  // Queries for guest users
  const {
    data: guestData,
    isLoading: guestLoading,
    error: guestError,
    refetch: refetchGuestData,
  } = useGuestData(guestSession?.token || '', {
    enabled: isGuest && !!guestSession?.token,
    ...(noRefetchOnMountOptions as any),
  })

  const {
    data: guestCategoryData,
    isLoading: guestCategoryLoading,
    error: guestCategoryError,
    refetch: refetchGuestCategoryData,
  } = useGuestCategoryData(guestSession?.token || '', id, {
    enabled: isGuest && !!guestSession?.token && id !== guestSession?.categoryId.toString(),
    ...(noRefetchOnMountOptions as any),
  })

  // Queries for authenticated users
  const {
    data: categoryResponse,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory,
  } = useCategory(id, {
    enabled: !isGuest && !!user && !authLoading && !!id,
    ...(noRefetchOnMountOptions as any),
  })

  const reportId = categoryResponse?.category?.report?.id?.toString() || null

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(reportId || '', {
    enabled: !isGuest && !!user && !authLoading && !!reportId,
    ...(noRefetchOnMountOptions as any),
  })

  const {
    data: expensesData,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpensesForCategory(id, {
    enabled: !isGuest && !!user && !authLoading && !!id,
    ...(noRefetchOnMountOptions as any),
  })

  // Process guest data
  useEffect(() => {
    if (!isGuest || !guestSession) {
      return
    }

    let dataToProcess
    if (id === guestSession.categoryId.toString()) {
      dataToProcess = guestData
    } else {
      dataToProcess = guestCategoryData
    }

    if (!dataToProcess?.category) {
      setProcessedData({ category: null, allCategories: [], expenses: [], reportId: null })
      setUserRole(null)
      return
    }

    const categoryData = dataToProcess.category
    const permissionLevel = dataToProcess.permission_level

    let allCategoriesForNavigation: Category[] = []

    // For REVIEW_ONLY guests, build the navigation structure from the current category
    if (permissionLevel === 'REVIEW_ONLY') {
      allCategoriesForNavigation = [categoryData]

      // Add parent category if it exists
      if (categoryData.parentCategory) {
        allCategoriesForNavigation.unshift(categoryData.parentCategory)
      }

      // Add child categories if they exist
      if (categoryData.children && categoryData.children.length > 0) {
        allCategoriesForNavigation.push(...categoryData.children)
      }
    } else {
      // For SUBMIT_ONLY guests, only show the single category
      allCategoriesForNavigation = [categoryData]
    }

    const expenses = dataToProcess.expenses || []
    const reportId = categoryData.report?.id ? categoryData.report.id.toString() : null

    setProcessedData({
      category: categoryData,
      allCategories: allCategoriesForNavigation,
      expenses,
      reportId,
    })
    setUserRole(permissionLevel)
  }, [isGuest, guestSession, guestData, guestCategoryData, id])

  // Process authenticated user data
  useEffect(() => {
    if (isGuest || !categoryResponse?.category) {
      return
    }

    const categoryData = categoryResponse.category
    const userRoleData = categoryResponse.userRole
    const hasDirectPermissionData = categoryResponse.hasDirectPermission
    const extractedWorkspaceId = categoryData.report?.id

    if (!extractedWorkspaceId) {
      setProcessedData({ category: null, allCategories: [], expenses: [], reportId: null })
      setUserRole(null)
      setHasDirectPermission(false)
      return
    }

    const reportIdStr = extractedWorkspaceId.toString()
    let allCats: Category[] = []
    let foundCategory: Category | null = null

    if (categoriesData) {
      allCats = categoriesData
      foundCategory = findCategoryById(allCats, categoryId)
    }

    // Always use the complete category data from the single category query
    // as it contains all fields including require_receipt
    const finalCategory = categoryData
    const expenses = expensesData || []

    setProcessedData({
      category: finalCategory,
      allCategories: allCats,
      expenses,
      reportId: reportIdStr,
    })
    setUserRole(userRoleData)
    setHasDirectPermission(hasDirectPermissionData)
  }, [isGuest, categoryResponse, categoriesData, expensesData, categoryId])

  // Loading state
  const loading = isGuest
    ? guestLoading || guestCategoryLoading || authLoading
    : categoryLoading || categoriesLoading || expensesLoading || authLoading

  // Error state
  const error = isGuest
    ? guestError?.message || guestCategoryError?.message
    : categoryError?.message || categoriesError?.message || expensesError?.message

  // Refetch function
  const refetch = useCallback(async () => {
    if (isGuest) {
      if (id === guestSession?.categoryId.toString()) {
        await refetchGuestData()
      } else {
        await refetchGuestCategoryData()
      }
    } else {
      await Promise.all([refetchCategory(), refetchCategories(), refetchExpenses()])
    }
  }, [
    isGuest,
    id,
    guestSession,
    refetchGuestData,
    refetchGuestCategoryData,
    refetchCategory,
    refetchCategories,
    refetchExpenses,
  ])

  // Mutation handlers
  const handleCreateCategory = useCallback(
    async (name: string, budget: number) => {
      if (!processedData.reportId) {
        throw new Error('Workspace ID not found')
      }

      try {
        await createCategoryMutation.mutateAsync({
          reportId: processedData.reportId,
          data: {
            name: name,
            budget: budget,
            parentCategoryId: categoryId,
          },
        })
        refetch()
        setCreateCategoryOpen(false)
      } catch (err) {
        console.error('Failed to create category:', err)
        throw err
      }
    },
    [processedData.reportId, categoryId, createCategoryMutation, refetch]
  )

  const handleUpdateCategory = useCallback(
    async (name: string, budget: number) => {
      try {
        await updateCategoryMutation.mutateAsync({
          id: id,
          data: { name: name, budget: budget },
        })
        refetch()
        setEditCategoryOpen(false)
      } catch (err) {
        console.error('Failed to update category:', err)
        throw err
      }
    },
    [id, updateCategoryMutation, refetch]
  )

  const handleShareCategory = useCallback(
    async (email: string, role: string) => {
      try {
        await grantCategoryPermissionMutation.mutateAsync({
          categoryId: id,
          userId: email.trim().toLowerCase(),
          role: role,
        })

        toast.show('Success', { message: `Category shared with ${email}.` })
        setShareDialogOpen(false)
        refetch()
      } catch (err) {
        console.error('Failed to share category:', err)
        if ((err as Error).message.includes('not found')) {
          toast.show('Error', { message: 'User with that email not found.' })
        } else {
          toast.show('Error', { message: (err as Error).message })
        }
        throw err
      }
    },
    [id, grantCategoryPermissionMutation, toast, refetch]
  )

  const handleDeleteCategory = useCallback(async () => {
    try {
      await deleteCategoryMutation.mutateAsync(id)

      toast.show('Success', { message: 'Category deleted successfully.' })
      setDeleteCategoryOpen(false)
      // Navigate back to parent category or dashboard
      router.back()
    } catch (err) {
      console.error('Failed to delete category:', err)
      toast.show('Error', { message: (err as Error).message })
      throw err
    }
  }, [id, deleteCategoryMutation, toast, router])

  const handleToggleCollapse = useCallback((categoryId: number) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  return {
    // Data
    category: processedData.category,
    allCategories: processedData.allCategories,
    expenses: processedData.expenses,
    loading,
    error: error || null,
    userRole,
    hasDirectPermission,
    reportId: processedData.reportId,
    categoryId,
    authLoading,
    user,

    // UI State
    menuOpen,
    createCategoryOpen,
    editCategoryOpen,
    createExpenseOpen,
    shareDialogOpen,
    deleteCategoryOpen,
    creating: createCategoryMutation.isPending,
    updating: updateCategoryMutation.isPending,
    sharing: grantCategoryPermissionMutation.isPending,
    deleting: deleteCategoryMutation.isPending,
    collapsedCategories,

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
    refetch,
  }
}

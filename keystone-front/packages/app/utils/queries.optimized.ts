import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  getUserExpenses,
  getExpensesAwaitingReview,
  getSharedCategories,
  getReports,
  getExpense,
  getCategory,
  getCategories,
  getExpensesForCategory,
  getCurrentUser,
  getGuestData,
  getGuestCategoryData,
  getGuestExpenseDetail,
  syncUser,
  createExpense,
  updateExpenseStatus,
  updateExpense,
  deleteExpense,
  createCategory,
  updateCategory,
  updateCategoryOptions,
  deleteCategory,
  grantCategoryPermission,
  createReport,
  updateReport,
  deleteReport,
  getExpenseApprovals,
  updateGuestExpenseStatus,
  submitGuestExpense,
  getCategoryPermissions,
  revokeCategoryPermission,
  getGuestLinks,
  createShareLink,
  revokeGuestLink,
  getReportRootCategory,
  getSubmitterCategories,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateCurrentUser,
  type NotificationPreferences,
} from './api'
import type { Expense, SharedCategory, Workspace, Category, UserProfile } from '../types'

// Query Keys
export const queryKeys = {
  all: ['api'] as const,

  // User queries
  user: () => [...queryKeys.all, 'user'] as const,
  currentUser: () => [...queryKeys.user(), 'current'] as const,
  userExpensesBase: () => [...queryKeys.user(), 'expenses'] as const,
  userExpenses: (params?: any) =>
    params !== undefined
      ? ([...queryKeys.userExpensesBase(), params] as const)
      : ([...queryKeys.userExpensesBase()] as const),

  // Expenses
  expenses: () => [...queryKeys.all, 'expenses'] as const,
  expense: (id: string) => [...queryKeys.expenses(), id] as const,
  expensesAwaitingReview: (params?: any) =>
    [...queryKeys.expenses(), 'awaiting-review', params] as const,
  expensesForCategory: (categoryId: string) =>
    [...queryKeys.expenses(), 'category', categoryId] as const,
  expenseApprovals: (expenseId: string) =>
    [...queryKeys.expenses(), 'approvals', expenseId] as const,

  // Categories
  categories: () => [...queryKeys.all, 'categories'] as const,
  category: (id: string) => [...queryKeys.categories(), id] as const,
  categoriesForReport: (reportId: string) =>
    [...queryKeys.categories(), 'report', reportId] as const,
  categoriesForWorkspace: (workspaceId: string) =>
    [...queryKeys.categories(), 'workspace', workspaceId] as const,
  sharedCategoriesBase: () => [...queryKeys.categories(), 'shared'] as const,
  sharedCategories: (params?: any) =>
    params !== undefined
      ? ([...queryKeys.sharedCategoriesBase(), params] as const)
      : ([...queryKeys.sharedCategoriesBase()] as const),
  submitterCategories: () => [...queryKeys.categories(), 'submitter'] as const,
  categoryPermissions: (categoryId: string) =>
    [...queryKeys.categories(), 'permissions', categoryId] as const,

  // Reports/Workspaces
  reports: () => [...queryKeys.all, 'reports'] as const,
  report: (id: string) => [...queryKeys.reports(), id] as const,
  // Workspaces (alias for reports)
  workspaces: () => [...queryKeys.all, 'workspaces'] as const,
  workspace: (id: string) => [...queryKeys.workspaces(), id] as const,

  // Guest
  guest: () => [...queryKeys.all, 'guest'] as const,
  guestData: (token: string) => [...queryKeys.guest(), 'data', token] as const,
  guestCategory: (token: string, categoryId: string) =>
    [...queryKeys.guest(), 'category', token, categoryId] as const,
  guestLinks: (categoryId: string) => [...queryKeys.guest(), 'links', categoryId] as const,

  // Notification Preferences
  notificationPreferences: () => [...queryKeys.all, 'notificationPreferences'] as const,
} as const

// Default query options for better performance
const defaultQueryOptions = {
  // Cache for 5 minutes by default
  staleTime: 5 * 60 * 1000,
  // Retry failed queries 2 times
  retry: 2,
  // Refetch on mount when stale
  refetchOnMount: true,
}

// User Queries
export const useCurrentUser = (
  options?: Omit<UseQueryOptions<any, Error, UserProfile>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async ({ signal }) => {
      const response = await getCurrentUser(signal)
      return (response as any).user
    },
    enabled: !!user && !loading,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useUserExpenses = (
  params?: any,
  options?: Omit<UseQueryOptions<any, Error, Expense[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.userExpenses(params),
    queryFn: async ({ signal }) => {
      const response = await getUserExpenses(params || {}, signal)
      return response.expenses || []
    },
    enabled: !!user && !loading,
    ...defaultQueryOptions,
    ...options,
  })
}

// Expense Queries
export const useExpense = (
  id: string,
  options?: Omit<UseQueryOptions<any, Error, Expense>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.expense(id),
    queryFn: async ({ signal }) => {
      const response = await getExpense(id, signal)
      return response.expense
    },
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useGuestExpenseDetail = (
  token: string,
  id: string,
  options?: Omit<UseQueryOptions<any, Error, Expense>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...queryKeys.guest(), 'expense', token, id],
    queryFn: async ({ signal }) => {
      const response = await getGuestExpenseDetail(token, id, signal)
      return (response as any).data.expense
    },
    enabled: !!token && !!id,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useExpensesAwaitingReview = (
  params?: any,
  options?: Omit<UseQueryOptions<any, Error, Expense[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.expensesAwaitingReview(params),
    queryFn: async ({ signal }) => {
      const response = await getExpensesAwaitingReview(params || {}, signal)
      return response.expenses || []
    },
    enabled: !!user && !loading,
    // More frequent updates for awaiting review expenses
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    refetchOnMount: true,
    ...options,
  })
}

export const useExpensesForCategory = (
  categoryId: string,
  options?: Omit<UseQueryOptions<any, Error, Expense[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.expensesForCategory(categoryId),
    queryFn: async ({ signal }) => {
      const response = await getExpensesForCategory(categoryId, signal)
      return (response as any).expenses || []
    },
    enabled: !!categoryId,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useExpenseApprovals = (
  expenseId: string,
  options?: Omit<UseQueryOptions<any, Error, any[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.expenseApprovals(expenseId),
    queryFn: async ({ signal }) => {
      const response = await getExpenseApprovals(expenseId, signal)
      return (response as any).approvals || []
    },
    enabled: !!user && !loading && !!expenseId,
    ...defaultQueryOptions,
    ...options,
  })
}

// Category Queries
export const useCategory = (
  id: string,
  options?: Omit<UseQueryOptions<any, Error, any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: async ({ signal }) => {
      const response = await getCategory(id, signal)
      return response
    },
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useCategories = (
  reportId: string,
  options?: Omit<UseQueryOptions<any, Error, Category[]>, 'queryKey' | 'queryFn'>
) => {
  // More strict validation - must be a valid numeric string
  const isValidReportId =
    !!reportId &&
    reportId !== '' &&
    reportId !== '0' &&
    reportId !== 'skip' &&
    reportId !== 'undefined' &&
    reportId !== 'null' &&
    !Number.isNaN(Number(reportId)) &&
    Number(reportId) > 0

  return useQuery({
    queryKey: queryKeys.categoriesForReport(isValidReportId ? reportId : 'DISABLED'),
    queryFn: async ({ signal }) => {
      if (!isValidReportId) {
        throw new Error('Invalid reportId provided to useCategories')
      }
      const response = await getCategories(reportId, signal)
      return (response as any).categories || []
    },
    ...defaultQueryOptions,
    ...options,
    // Ensure the enabled condition always respects the valid reportId check
    enabled: isValidReportId && (options?.enabled ?? true),
  })
}

export const useWorkspaceCategories = (
  workspaceId: string,
  options?: Omit<UseQueryOptions<any, Error, Category[]>, 'queryKey' | 'queryFn'>
) => {
  // More strict validation - must be a valid numeric string
  const isValidWorkspaceId =
    !!workspaceId &&
    workspaceId !== '' &&
    workspaceId !== '0' &&
    workspaceId !== 'skip' &&
    workspaceId !== 'undefined' &&
    workspaceId !== 'null' &&
    !Number.isNaN(Number(workspaceId)) &&
    Number(workspaceId) > 0

  return useQuery({
    queryKey: queryKeys.categoriesForWorkspace(isValidWorkspaceId ? workspaceId : 'DISABLED'),
    queryFn: async ({ signal }) => {
      if (!isValidWorkspaceId) {
        throw new Error('Invalid workspaceId provided to useWorkspaceCategories')
      }
      const response = await getCategories(workspaceId, signal)
      return (response as any).categories || []
    },
    ...defaultQueryOptions,
    ...options,
    // Ensure the enabled condition always respects the valid workspaceId check
    enabled: isValidWorkspaceId && (options?.enabled ?? true),
  })
}

export const useReportRootCategory = (
  reportId: string,
  options?: Omit<UseQueryOptions<any, Error, Category>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...queryKeys.reports(), reportId, 'root-category'],
    queryFn: async ({ signal }) => {
      const response = await getReportRootCategory(reportId, signal)
      return (response as any).data?.category
    },
    enabled: !!reportId && reportId !== 'undefined',
    ...defaultQueryOptions,
    ...options,
  })
}

export const useWorkspaceRootCategory = (
  workspaceId: string,
  options?: Omit<UseQueryOptions<any, Error, Category>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...queryKeys.workspaces(), workspaceId, 'root-category'],
    queryFn: async ({ signal }) => {
      const response = await getReportRootCategory(workspaceId, signal)
      return (response as any).data?.category
    },
    enabled: !!workspaceId && workspaceId !== 'undefined',
    ...defaultQueryOptions,
    ...options,
  })
}

export const useCategoryPermissions = (
  categoryId: string,
  options?: Omit<UseQueryOptions<any, Error, any[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.categoryPermissions(categoryId),
    queryFn: async ({ signal }) => {
      const response = await getCategoryPermissions(categoryId, signal)
      return (response as any).permissions || []
    },
    enabled: !!user && !loading && !!categoryId,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useSharedCategories = (
  params?: any,
  options?: Omit<UseQueryOptions<any, Error, SharedCategory[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.sharedCategories(params),
    queryFn: async ({ signal }) => {
      const response = await getSharedCategories(params || {}, signal)
      return response.sharedCategories || []
    },
    enabled: !!user && !loading,
    // More frequent updates for shared categories
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    refetchOnMount: true,
    ...options,
  })
}

export const useSubmitterCategories = (
  options?: Omit<UseQueryOptions<any, Error, SharedCategory[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.submitterCategories(),
    queryFn: async ({ signal }) => {
      const response = await getSubmitterCategories(signal)
      return response.submitterCategories || []
    },
    enabled: !!user && !loading,
    // More frequent updates for submitter categories
    staleTime: 1 * 60 * 1000,
    retry: 2,
    refetchOnMount: true,
    ...options,
  })
}

// Workspace Queries (alias for reports)
export const useWorkspaces = (
  options?: Omit<UseQueryOptions<any, Error, Workspace[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: async ({ signal }) => {
      const response = await getReports(signal)
      return response.reports || []
    },
    enabled: !!user && !loading,
    ...defaultQueryOptions,
    ...options,
  })
}

// Guest Queries
export const useGuestData = (
  token: string,
  options?: Omit<UseQueryOptions<any, Error, any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.guestData(token),
    queryFn: async ({ signal }) => {
      const response = await getGuestData(token, signal)
      return (response as any).data
    },
    enabled: !!token,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useGuestCategoryData = (
  token: string,
  categoryId: string,
  options?: Omit<UseQueryOptions<any, Error, any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.guestCategory(token, categoryId),
    queryFn: async ({ signal }) => {
      const response = await getGuestCategoryData(token, categoryId, signal)
      return (response as any).data
    },
    enabled: !!token && !!categoryId,
    ...defaultQueryOptions,
    ...options,
  })
}

export const useGuestLinks = (
  categoryId: string,
  options?: Omit<UseQueryOptions<any, Error, any[]>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.guestLinks(categoryId),
    queryFn: async ({ signal }) => {
      const response = await getGuestLinks(categoryId, signal)
      return Array.isArray(response) ? response : []
    },
    enabled: !!user && !loading && !!categoryId,
    ...defaultQueryOptions,
    ...options,
  })
}

// Notification Preferences Queries
export const useNotificationPreferences = (
  options?: Omit<UseQueryOptions<any, Error, NotificationPreferences>, 'queryKey' | 'queryFn'>
) => {
  // Import useAuth hook to check if user is authenticated
  const useAuth = require('../provider/AuthProvider').useAuth
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: queryKeys.notificationPreferences(),
    queryFn: async ({ signal }) => {
      const response = await getNotificationPreferences(signal)
      return response.preferences
    },
    enabled: !!user && !loading,
    ...defaultQueryOptions,
    ...options,
  })
}

// Mutations
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExpense,
    onSuccess: (data) => {
      // Invalidate and refetch expense-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userExpensesBase() })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses(), 'awaiting-review'] })

      // If we know the category ID from the response, we can be more specific
      if (data?.expense?.category?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expensesForCategory(data.expense.category.id.toString()),
        })
      }
    },
  })
}

export const useUpdateExpenseStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateExpenseStatus(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate specific expense and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.expense(id) })

      // Invalidate expense approvals to show new approval/denial
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseApprovals(id) })

      // Only invalidate lists that are likely to be affected
      if (data?.expense?.status === 'APPROVED' || data?.expense?.status === 'DENIED') {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses(), 'awaiting-review'] })
      }

      // If we know the category ID, invalidate that specific category's expenses
      if (data?.expense?.category?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expensesForCategory(data.expense.category.id.toString()),
        })
      }

      // Update user expenses if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.userExpensesBase() })
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateExpense(id, data),
    onSuccess: (response, { id }) => {
      // Invalidate specific expense
      queryClient.invalidateQueries({ queryKey: queryKeys.expense(id) })

      // If category was changed, invalidate relevant category expense lists
      if (response?.expense?.category?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expensesForCategory(response.expense.category.id.toString()),
        })
      }

      // Update user expenses
      queryClient.invalidateQueries({ queryKey: queryKeys.userExpensesBase() })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (_, variables) => {
      // Invalidate expense-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userExpensesBase() })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses(), 'awaiting-review'] })

      // If we know the expense ID, invalidate that specific expense
      if (typeof variables === 'string') {
        queryClient.invalidateQueries({ queryKey: queryKeys.expense(variables) })
      }
    },
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: any }) =>
      createCategory(reportId, data),
    onSuccess: (_, { reportId }) => {
      // Invalidate category-related queries for the specific report and workspace
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriesForReport(reportId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoriesForWorkspace(reportId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCategory(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate specific category
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) })

      // If we know the report ID, invalidate categories for that report and workspace
      if (data?.category?.report?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.categoriesForReport(data.category.report.id.toString()),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.categoriesForWorkspace(data.category.report.id.toString()),
        })
      }

      // Also invalidate shared categories as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
    },
  })
}

export const useUpdateCategoryOptions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCategoryOptions(id, data),
    onSuccess: (data, { id }) => {
      // Invalidate specific category to update its options
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) })

      // If we know the report ID, invalidate categories for that report and workspace
      if (data?.category?.report?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.categoriesForReport(data.category.report.id.toString()),
        })
        queryClient.invalidateQueries({
          queryKey: queryKeys.categoriesForWorkspace(data.category.report.id.toString()),
        })
      }

      // Also invalidate shared categories as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (data) => {
      // The deleteCategory response doesn't contain report_id, so we can't be specific
      // We'll invalidate all categories instead
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() })

      // Also invalidate shared categories as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
    },
  })
}

export const useRevokeCategoryPermission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, userId }: { categoryId: string; userId: string }) =>
      revokeCategoryPermission(categoryId, userId),
    onSuccess: (_, { categoryId }) => {
      // Invalidate category permissions queries
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPermissions(categoryId) })
      // Also invalidate shared categories as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
      // Invalidate the specific category as its permissions have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.category(categoryId) })
    },
  })
}

export const useGrantCategoryPermission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      userId,
      role,
    }: {
      categoryId: string
      userId: string
      role: string
    }) => grantCategoryPermission(categoryId, userId, role),
    onSuccess: (_, { categoryId }) => {
      // Invalidate category permissions queries
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPermissions(categoryId) })
      // Also invalidate shared categories as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedCategoriesBase() })
      // Invalidate the specific category as its permissions have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.category(categoryId) })
    },
  })
}

export const useCreateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, budget }: { name: string; budget?: number }) => createReport(name, budget),
    onSuccess: () => {
      // Invalidate report and workspace queries
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() })
    },
  })
}

export const useUpdateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateReport(id, name),
    onSuccess: (_, { id }) => {
      // Invalidate specific report/workspace and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id.toString()) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(id.toString()) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() })
    },
  })
}

export const useUpdateGuestExpenseStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ token, id, data }: { token: string; id: string; data: any }) =>
      updateGuestExpenseStatus(token, id, data),
    onSuccess: (data, { id }) => {
      // Invalidate specific expense
      queryClient.invalidateQueries({ queryKey: queryKeys.expense(id) })

      // Invalidate expense approvals to show new approval/denial
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseApprovals(id) })

      // Only invalidate lists that are likely to be affected
      if (data?.expense?.status === 'APPROVED' || data?.expense?.status === 'DENIED') {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses(), 'awaiting-review'] })
      }

      // If we know the category ID, invalidate that specific category's expenses
      if (data?.expense?.category?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expensesForCategory(data.expense.category.id.toString()),
        })
      }
    },
  })
}

export const useSubmitGuestExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: any }) => submitGuestExpense(token, data),
    onSuccess: (data) => {
      // Invalidate and refetch expense-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.userExpensesBase() })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses(), 'awaiting-review'] })

      // If we know the category ID from the response, we can be more specific
      if (data?.expense?.category?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expensesForCategory(data.expense.category.id.toString()),
        })
      }
    },
  })
}

export const useDeleteReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteReport(id),
    onSuccess: () => {
      // Invalidate report and workspace queries
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() })
    },
  })
}

export const useSyncUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncUser,
    onSuccess: () => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user() })
      // Also invalidate reports and workspaces as they might be affected by user sync
      queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() })
    },
  })
}

// User profile mutations
export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name?: string; avatar_url?: string }) => updateCurrentUser(data),
    onSuccess: (response) => {
      const updatedUser = (response as any)?.user
      if (updatedUser) {
        // Update the cached current user immediately
        queryClient.setQueryData(queryKeys.currentUser(), updatedUser)
        // Also invalidate broader user queries if any depend on it
        queryClient.invalidateQueries({ queryKey: queryKeys.user() })
      }
    },
  })
}

export const useCreateShareLink = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: any }) =>
      createShareLink(categoryId, data),
    onSuccess: (_, { categoryId }) => {
      // Invalidate guest links queries
      queryClient.invalidateQueries({ queryKey: queryKeys.guestLinks(categoryId) })
      // Also invalidate category permissions as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryPermissions(categoryId) })
    },
  })
}

export const useRevokeGuestLink = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => revokeGuestLink(token),
    onSuccess: (_, variables) => {
      // We don't know which category the link belongs to, so we can't invalidate specific queries
      // In a real implementation, you might want to pass categoryId as well
      // For now, we'll invalidate all guest links
      queryClient.invalidateQueries({ queryKey: queryKeys.guest() })
    },
  })
}

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (data) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(queryKeys.notificationPreferences(), data.preferences)
    },
    onError: (error) => {
      console.error('Failed to update notification preferences:', error)
    },
  })
}

import { getFirebaseIdToken } from './auth'
import type {
  ExpensesResponse,
  Workspace,
  Category,
  Expense,
  ExpenseItem,
  Approval,
  SharedCategoriesResponse,
  SharedCategory,
} from '../types.d'

const API_BASE_URL = 'https://api.gokeystone.org'

type ApiResponse<T = any> = T & {
  status?: 'success' | 'error'
  message?: string
  code?: string
}

class HttpError extends Error {
  status: number
  body?: any
  constructor(status: number, message: string, body?: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Inner function to execute the fetch with an optional token
  const doFetch = async (bearerToken?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })

    let parsed: any = undefined
    const text = await response.text()
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        // Keep raw text for diagnostics
        console.error('Failed to parse JSON:', e, 'Raw response:', text)
      }
    }

    if (!response.ok) {
      const message =
        parsed && typeof parsed === 'object' && 'message' in parsed
          ? (parsed as any).message
          : `HTTP ${response.status}`
      throw new HttpError(response.status, message, parsed)
    }

    return parsed as ApiResponse<T>
  }

  try {
    // First attempt with current token
    const token = await getFirebaseIdToken()
    return await doFetch(token ?? undefined)
  } catch (err) {
    // Swallow expected AbortError from fetch cancellations (e.g., React Query refetches)
    if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
      // Do not log AbortError to avoid noisy console output
      throw err
    }
    // If unauthorized, try once more with forced token refresh
    if (err instanceof HttpError && err.status === 401) {
      try {
        const refreshed = await getFirebaseIdToken(true)
        if (!refreshed) throw err
        return await doFetch(refreshed)
      } catch (retryErr) {
        console.error(`API request unauthorized after refresh for ${endpoint}:`, retryErr)
        throw retryErr
      }
    }
    console.error(`API request failed for ${endpoint}:`, err)
    throw err
  }
}

// API request function that doesn't require Firebase authentication
// Used for guest token validation and other public endpoints
async function publicApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`Public API request failed for ${endpoint}:`, error)
    throw error
  }
}

export async function syncUser(retries = 3): Promise<ApiResponse<{ user: any }>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiRequest<{ user: any }>('/api/users/sync', {
        method: 'POST',
      })
    } catch (error) {
      console.error(`User sync attempt ${attempt} failed:`, error)

      if (attempt === retries) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)))
    }
  }

  throw new Error('All sync attempts failed')
}

export async function getCurrentUser(signal?: AbortSignal): Promise<ApiResponse<{ user: any }>> {
  return apiRequest<{ user: any }>('/api/users/me', { signal })
}

export async function updateCurrentUser(data: {
  name?: string
  avatar_url?: string
}): Promise<ApiResponse<{ user: any }>> {
  return apiRequest<{ user: any }>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCurrentUser(): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>('/api/users/me', {
    method: 'DELETE',
  })
}

export async function checkUserSync(): Promise<boolean> {
  try {
    const response = await getCurrentUser()
    return response.status === 'success' && !!response.user
  } catch (error) {
    console.error('Failed to check user sync status:', error)
    return false
  }
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function getReports(signal?: AbortSignal): Promise<{ reports: Workspace[] }> {
  return apiRequest<{ reports: Workspace[] }>('/api/reports', { signal }) as any
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function getReport(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ report: Workspace }>> {
  return apiRequest<{ report: Workspace }>(`/api/reports/${id}`, { signal })
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function getCategories(
  reportId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ categories: Category[] }>> {
  return apiRequest<{ categories: Category[] }>(`/api/reports/${reportId}/categories`, { signal })
}

export async function getCategory(
  categoryId: string,
  signal?: AbortSignal
): Promise<
  ApiResponse<{ category: Category; userRole: string | null; hasDirectPermission: boolean }>
> {
  return apiRequest<{ category: Category; userRole: string | null; hasDirectPermission: boolean }>(
    `/api/categories/${categoryId}`,
    { signal }
  )
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function getReportRootCategory(
  reportId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ category: Category }>> {
  return apiRequest<{ category: Category }>(`/api/reports/${reportId}/root-category`, { signal })
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function createCategory(
  reportId: string,
  data: {
    name: string
    budget: number
    parentCategoryId?: number | null
  }
): Promise<ApiResponse<{ category: Category }>> {
  return apiRequest<{ category: Category }>(`/api/reports/${reportId}/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function createReport(
  name: string,
  budget?: number
): Promise<ApiResponse<{ report: Workspace; category: Category }>> {
  const body: any = { name }
  if (budget !== undefined) {
    body.budget = budget
  }

  return apiRequest<{ report: any; category: any }>(`/api/reports`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function updateReport(
  id: number,
  name: string
): Promise<ApiResponse<{ report: Workspace }>> {
  return apiRequest<{ report: Workspace }>(`/api/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

// NOTE: Workspaces and Reports are the same entity in the backend.
// The API still uses "reports" for backwards compatibility reasons.
export async function deleteReport(id: number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/reports/${id}`, {
    method: 'DELETE',
  })
}

export async function getUserExpenses(
  params?: {
    page?: number
    limit?: number
    status?: string
    since?: number
  },
  signal?: AbortSignal
): Promise<ExpensesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.since) searchParams.append('since', params.since.toString())

  const queryString = searchParams.toString()
  const endpoint = `/api/users/me/expenses${queryString ? `?${queryString}` : ''}`

  return apiRequest<ExpensesResponse>(endpoint, { signal }) as any
}

export async function getExpensesAwaitingReview(
  params?: {
    page?: number
    limit?: number
    since?: number
  },
  signal?: AbortSignal
): Promise<ExpensesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.since) searchParams.append('since', params.since.toString())

  const queryString = searchParams.toString()
  const endpoint = `/api/users/me/expenses/awaiting-review${queryString ? `?${queryString}` : ''}`

  return apiRequest<ExpensesResponse>(endpoint, { signal }) as any
}

export async function getExpensesForCategory(
  categoryId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ expenses: Expense[] }>> {
  return apiRequest<{ expenses: Expense[] }>(`/api/categories/${categoryId}/expenses`, { signal })
}

export async function getExpense(
  expenseId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ expense: Expense }>> {
  return apiRequest<{ expense: Expense }>(`/api/expenses/${expenseId}`, { signal })
}

export async function createExpense(data: {
  description: string
  amount: number
  categoryId: number
  transactionDate: string
  notes?: string
  receiptUrl?: string
  items?: { details?: ExpenseItem[] }
}): Promise<ApiResponse<{ expense: Expense }>> {
  return apiRequest<{ expense: Expense }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateExpenseStatus(
  expenseId: string,
  data: {
    status: string
    notes?: string
  }
): Promise<ApiResponse<{ expense: Expense; approval: any }>> {
  return apiRequest<{ expense: Expense; approval: any }>(`/api/expenses/${expenseId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateExpense(
  expenseId: string,
  data: {
    description?: string
    amount?: number
    notes?: string
    receiptUrl?: string
    transactionDate?: string
    categoryId?: number | null
  }
): Promise<ApiResponse<{ expense: Expense }>> {
  return apiRequest<{ expense: Expense }>(`/api/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getExpenseApprovals(
  expenseId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ approvals: Approval[] }>> {
  return apiRequest<{ approvals: Approval[] }>(`/api/expenses/${expenseId}/approvals`, { signal })
}

export async function deleteExpense(expenseId: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/expenses/${expenseId}`, {
    method: 'DELETE',
  })
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string
    budget?: number
  }
): Promise<ApiResponse<{ category: Category }>> {
  return apiRequest<{ category: Category }>(`/api/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateCategoryOptions(
  categoryId: string,
  data: {
    require_receipt?: boolean
    allow_guest_submissions?: boolean
    allow_user_submissions?: boolean
  }
): Promise<ApiResponse<{ category: Category }>> {
  return apiRequest<{ category: Category }>(`/api/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCategory(
  categoryId: string
): Promise<ApiResponse<{ message: string; categoryId: number }>> {
  return apiRequest<{ message: string; categoryId: number }>(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export async function getSharedCategories(
  params?: {
    since?: number
  },
  signal?: AbortSignal
): Promise<SharedCategoriesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.since) searchParams.append('since', params.since.toString())

  const queryString = searchParams.toString()
  const endpoint = `/api/users/me/categories${queryString ? `?${queryString}` : ''}`

  return apiRequest<SharedCategoriesResponse>(endpoint, { signal })
}

export interface SubmitterCategoriesResponse {
  message: string
  submitterCategories: SharedCategory[]
}

export async function getSubmitterCategories(
  signal?: AbortSignal
): Promise<SubmitterCategoriesResponse> {
  const endpoint = `/api/users/me/submitter-categories`
  return apiRequest<SubmitterCategoriesResponse>(endpoint, { signal })
}

export async function grantCategoryPermission(
  categoryId: string,
  userId: string,
  role: string
): Promise<ApiResponse<{ permission: any }>> {
  return apiRequest<{ permission: any }>(`/api/categories/${categoryId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  })
}

export async function getCategoryPermissions(
  categoryId: string,
  signal?: AbortSignal
): Promise<ApiResponse<{ permissions: any[] }>> {
  return apiRequest<{ permissions: any[] }>(`/api/categories/${categoryId}/permissions`, { signal })
}

export async function revokeCategoryPermission(
  categoryId: string,
  userId: string
): Promise<ApiResponse<any>> {
  return apiRequest(`/api/categories/${categoryId}/permissions/${userId}`, {
    method: 'DELETE',
  })
}

export async function createShareLink(
  categoryId: string,
  data: {
    permission_level: 'SUBMIT_ONLY' | 'REVIEW_ONLY'
    expires_at?: string
    description?: string
  }
): Promise<
  ApiResponse<{
    id: number
    token: string
    permission_level: string
    expires_at: string | null
    category: { id: number; name: string }
    description?: string
    status: string
    createdAt: string
  }>
> {
  const response = await apiRequest<{
    id: number
    token: string
    permission_level: string
    expires_at: string | null
    category: { id: number; name: string }
    description?: string
    status: string
    createdAt: string
  }>(`/api/guest-links/create`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      categoryId: Number.parseInt(categoryId, 10),
    }),
  })
  return response
}

export async function getGuestLinks(categoryId: string, signal?: AbortSignal): Promise<any[]> {
  return apiRequest(`/api/guest-links/category/${categoryId}`, { signal })
}

export async function revokeGuestLink(token: string): Promise<ApiResponse<any>> {
  return apiRequest(`/api/guest-links/${token}`, {
    method: 'DELETE',
  })
}

export async function validateGuestToken(
  token: string,
  signal?: AbortSignal
): Promise<ApiResponse<any>> {
  return publicApiRequest('/api/guest-links/validate-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
    signal,
  })
}

// Guest API functions
export async function getGuestData(
  token: string,
  signal?: AbortSignal
): Promise<
  ApiResponse<{
    category: Category
    permission_level: string
    expenses?: Expense[]
  }>
> {
  return publicApiRequest(`/api/guest?token=${encodeURIComponent(token)}`, { signal })
}

export async function getGuestCategoryData(
  token: string,
  categoryId: string,
  signal?: AbortSignal
): Promise<
  ApiResponse<{
    category: Category
    permission_level: string
    expenses?: Expense[]
  }>
> {
  return publicApiRequest(`/api/guest/category/${categoryId}?token=${encodeURIComponent(token)}`, {
    signal,
  })
}

export async function getGuestExpenseDetail(
  token: string,
  expenseId: string,
  signal?: AbortSignal
): Promise<
  ApiResponse<{
    expense: Expense
    permission_level: string
  }>
> {
  return publicApiRequest(`/api/guest/expenses/${expenseId}?token=${encodeURIComponent(token)}`, {
    signal,
  })
}

export async function submitGuestExpense(
  token: string,
  data: {
    description: string
    amount: number
    transaction_date: string
    notes?: string
    receipt_url?: string
    items?: { details?: ExpenseItem[] }
    guest_name?: string
    guest_email?: string
  }
): Promise<ApiResponse<{ expense: Expense }>> {
  return publicApiRequest(`/api/guest?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getGuestSignedUploadUrl(
  token: string,
  data: {
    fileName: string
    contentType?: string
  }
): Promise<
  ApiResponse<{
    signedUrl: string
    filePath: string
    expiresAt: string
    uploadInstructions: {
      method: string
      headers: {
        'Content-Type': string
      }
    }
  }>
> {
  return publicApiRequest(`/api/guest/signed-upload-url?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateGuestExpenseStatus(
  token: string,
  expenseId: string,
  data: {
    status: string
    notes?: string
  }
): Promise<ApiResponse<{ expense: Expense; approval: any }>> {
  return publicApiRequest(`/api/guest/expenses/${expenseId}?token=${encodeURIComponent(token)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getReceiptSignedUrl(
  filePath: string
): Promise<ApiResponse<{ signedUrl: string }>> {
  return apiRequest(`/api/expenses/receipt-url/${encodeURIComponent(filePath)}`)
}

export async function getGuestReceiptSignedUrl(
  token: string,
  filePath: string
): Promise<ApiResponse<{ signedUrl: string }>> {
  return publicApiRequest(
    `/api/guest/receipt-url/${encodeURIComponent(filePath)}?token=${encodeURIComponent(token)}`
  )
}

// Notification Preferences
export interface NotificationPreference {
  push: boolean
}

export interface NotificationPreferences {
  expense_created: NotificationPreference
  expense_approved: NotificationPreference
  expense_denied: NotificationPreference
  category_shared: NotificationPreference
  mention: NotificationPreference
  weekly_summary: NotificationPreference
}

export async function getNotificationPreferences(
  signal?: AbortSignal
): Promise<ApiResponse<{ preferences: NotificationPreferences }>> {
  return apiRequest<{ preferences: NotificationPreferences }>(
    '/api/users/me/notification-preferences',
    { signal }
  )
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ApiResponse<{ preferences: NotificationPreferences }>> {
  return apiRequest<{ preferences: NotificationPreferences }>(
    '/api/users/me/notification-preferences',
    {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }
  )
}

export { apiRequest, publicApiRequest }
export type { HttpError }

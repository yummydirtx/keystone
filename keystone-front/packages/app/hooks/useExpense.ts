// packages/app/hooks/useExpense.ts
import { useExpense as useExpenseQuery, useGuestExpenseDetail } from '../utils/queries.optimized'
import { useAuth } from '../provider/AuthProvider'

export function useExpense(id: string) {
  const { user, loading: authLoading, isGuest, guestSession } = useAuth()

  // Use guest query if user is a guest
  const {
    data: guestExpense,
    isLoading: guestLoading,
    error: guestError,
    isError: isGuestError,
    refetch: refetchGuestExpense,
  } = useGuestExpenseDetail(guestSession?.token || '', id, {
    enabled: isGuest && !!guestSession?.token && !!id,
  })

  // Use regular query if user is authenticated
  const {
    data: authExpense,
    isLoading: authIsLoading,
    error: authError,
    isError: isAuthError,
    refetch: refetchAuthExpense,
  } = useExpenseQuery(id, {
    enabled: !!user && !authLoading && !!id && !isGuest,
  })

  // Return the appropriate data based on user type
  if (isGuest) {
    return {
      expense: guestExpense || null,
      loading: guestLoading || authLoading,
      error: isGuestError ? guestError?.message || 'Failed to load expense' : null,
      refetch: refetchGuestExpense,
    }
  }

  return {
    expense: authExpense || null,
    loading: authIsLoading || authLoading,
    error: isAuthError ? authError?.message || 'Failed to load expense' : null,
    refetch: refetchAuthExpense,
  }
}

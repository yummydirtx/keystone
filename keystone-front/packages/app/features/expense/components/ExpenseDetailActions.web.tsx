// packages/app/features/expense/components/ExpenseDetailActions.tsx
import { Button, XStack } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { ExpenseActions } from './ExpenseActions'
import type { Expense } from 'app/types'
import { useAuth } from 'app/provider/AuthProvider'
import { useEffect, useState } from 'react'

type ExpenseDetailActionsProps = {
  id: string
  expenseDescription: string
  canDelete: boolean
  canApprove: boolean
  currentStatus: Expense['status']
  onStatusUpdate: (newStatus: string) => void
  onStatusUpdateSuccess?: () => void
}

export function ExpenseDetailActions({
  id,
  expenseDescription,
  canDelete,
  canApprove,
  currentStatus,
  onStatusUpdate,
  onStatusUpdateSuccess,
}: ExpenseDetailActionsProps) {
  const router = useRouter()
  const { isGuest } = useAuth()

  const [showBack, setShowBack] = useState<boolean>(() => !isGuest)

  useEffect(() => {
    if (isGuest) {
      const canGoBack = typeof window !== 'undefined' && window.history.length > 1
      setShowBack(canGoBack)
    } else {
      setShowBack(true)
    }
  }, [isGuest])

  const handleBackNavigation = () => {
    // Try to go back, but if there's no previous page, redirect to dashboard
    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      router.back()
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <XStack
      justify="space-between"
      items="center"
      mb="$4"
    >
      {showBack ? (
        <Button
          variant="outlined"
          size="$3"
          icon={ChevronLeft}
          onPress={handleBackNavigation}
        >
          Back
        </Button>
      ) : (
        <XStack />
      )}
      <XStack
        gap="$3"
        items="center"
      >
        {canApprove && (
          <ExpenseActions
            expenseId={id}
            currentStatus={currentStatus}
            onStatusUpdate={onStatusUpdate}
            onStatusUpdateSuccess={onStatusUpdateSuccess}
            canApprove={canApprove}
          />
        )}
      </XStack>
    </XStack>
  )
}

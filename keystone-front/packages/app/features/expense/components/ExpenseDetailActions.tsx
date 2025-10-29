// packages/app/features/expense/components/ExpenseDetailActions.tsx
import { Button, XStack } from '@my/ui'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { DeleteExpenseButton } from './DeleteExpenseButton'
import { ExpenseActions } from './ExpenseActions'
import type { Expense } from 'app/types'

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

  return (
    <XStack
      justify="flex-end"
      mb="$4"
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
  )
}

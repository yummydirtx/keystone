import { XStack, Button } from '@my/ui'
import type { ExpenseFormActionsProps } from './types'

export function ExpenseFormActions({
  creating,
  uploadingReceipt,
  parsingReceipt,
  onClose,
  onSubmit,
}: ExpenseFormActionsProps) {
  const isDisabled = creating || uploadingReceipt || parsingReceipt

  return (
    <XStack
      gap="$2"
      justify="flex-end"
      mt="$4"
    >
      <Button
        variant="outlined"
        onPress={onClose}
        disabled={isDisabled}
      >
        Cancel
      </Button>
      <Button
        onPress={onSubmit}
        disabled={isDisabled}
        opacity={creating ? 0.5 : 1}
      >
        {creating ? 'Submitting...' : 'Submit Expense'}
      </Button>
    </XStack>
  )
}

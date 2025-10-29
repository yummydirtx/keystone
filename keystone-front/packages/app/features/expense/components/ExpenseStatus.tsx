import { YStack, Text } from '@my/ui'

const statusColors = {
  PENDING_REVIEW: 'orange',
  PENDING_ADMIN: 'green',
  APPROVED: 'green',
  DENIED: 'red',
  REIMBURSED: 'blue',
} as const

const statusLabels = {
  PENDING_REVIEW: 'Pending Review',
  PENDING_ADMIN: 'Approved (Pending Admin)',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  REIMBURSED: 'Reimbursed',
} as const

interface ExpenseStatusProps {
  status: keyof typeof statusColors
}

export function ExpenseStatus({ status }: ExpenseStatusProps) {
  return (
    <YStack
      bg={statusColors[status]}
      px="$2"
      py="$1"
      alignSelf="flex-start"
    >
      <Text
        color="white"
        fontSize="$2"
        fontWeight="600"
      >
        {statusLabels[status]}
      </Text>
    </YStack>
  )
}

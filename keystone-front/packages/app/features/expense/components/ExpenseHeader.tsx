import { Card, YStack, XStack, H2, Text } from '@my/ui'
import { Calendar, DollarSign } from '@tamagui/lucide-icons'
import { ExpenseStatus } from './ExpenseStatus'
import { formatCurrency } from '../../../utils/currency'

interface ExpenseHeaderProps {
  description: string
  amount: number
  transactionDate: string
  status: 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'
}

export function ExpenseHeader({
  description,
  amount,
  transactionDate,
  status,
}: ExpenseHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card
      p="$4"
      bg="$background"
    >
      <YStack gap="$3">
        <XStack
          items="center"
          justify="space-between"
        >
          <H2 flex={1}>{description}</H2>
          <YStack items="flex-end">
            <ExpenseStatus status={status} />
          </YStack>
        </XStack>

        <XStack
          items="center"
          gap="$2"
        >
          <DollarSign
            size="$1"
            color="$color11"
          />
          <Text
            fontSize="$6"
            fontWeight="700"
            color="$green11"
          >
            {formatCurrency(amount)}
          </Text>
        </XStack>

        <XStack
          items="center"
          gap="$2"
        >
          <Calendar
            size="$1"
            color="$color11"
          />
          <Text color="$color11">{formatDate(transactionDate)}</Text>
        </XStack>
      </YStack>
    </Card>
  )
}

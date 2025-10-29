import { Paragraph, XStack, YStack, Image, DashboardWidget, DashboardWidgetItem } from '@my/ui'
import { Clock, Briefcase } from '@tamagui/lucide-icons'
import React from 'react'
import { useAuth } from '../../../provider/AuthProvider'
import { useExpensesAwaitingReview } from '../../../utils/queries.optimized'
import { useRouter } from 'solito/navigation'
import { formatCurrency } from '../../../utils/currency'

interface AwaitingReviewWidgetProps {
  refreshKey?: number
}

export const AwaitingReviewWidget = ({ refreshKey = 0 }: AwaitingReviewWidgetProps) => {
  const { userProfile } = useAuth()
  const router = useRouter()

  const {
    data: expenses = [],
    isLoading: loading,
    error,
  } = useExpensesAwaitingReview(
    { limit: 3 },
    {
      enabled: !!userProfile,
    }
  )

  // Use first 3 expenses
  const displayExpenses = expenses.slice(0, 3)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return '$yellow10'
      case 'PENDING_ADMIN':
        return '$yellow10'
      default:
        return '$color11'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review'
      case 'PENDING_ADMIN':
        return 'Pending Admin'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const renderExpenseItems = () => {
    if (displayExpenses.length === 0) {
      return null // Let the empty state handle this
    }

    return displayExpenses.map((expense, index) => (
      <DashboardWidgetItem
        key={expense.id}
        onPress={() => router.push(`/expense/${expense.id}`)}
        showSeparator={index < displayExpenses.length - 1}
      >
        <YStack
          gap="$1"
          flex={1}
        >
          <Paragraph
            fontWeight="600"
            color="$color12"
          >
            {expense.description}
          </Paragraph>
          <XStack
            gap="$2"
            items="center"
          >
            <Paragraph
              size="$3"
              color="$color10"
            >
              {formatDate(expense.transaction_date)}
            </Paragraph>
          </XStack>
          {expense.report && (
            <XStack
              gap="$2"
              items="center"
              style={{ minWidth: 0 }}
            >
              <Briefcase
                size={14}
                color="$color10"
              />
              <Paragraph
                size="$3"
                color="$color10"
                numberOfLines={1}
                ellipsizeMode="tail"
                flex={1}
              >
                {expense.report.name}
              </Paragraph>
            </XStack>
          )}
          {expense.submitter && (
            <XStack
              gap="$2"
              items="center"
            >
              <Image
                source={{
                  uri:
                    expense.submitter.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(expense.submitter.name)}&background=random&size=24`,
                  width: 20,
                  height: 20,
                }}
                width={20}
                height={20}
                borderRadius="$10"
              />
              <Paragraph
                size="$3"
                color="$color10"
              >
                {expense.submitter.name}
              </Paragraph>
            </XStack>
          )}
        </YStack>
        <YStack
          items="flex-end"
          gap="$1"
        >
          <Paragraph
            fontWeight="600"
            size="$5"
            color="$color12"
          >
            {formatCurrency(expense.amount)}
          </Paragraph>
          <Paragraph
            size="$3"
            color={getStatusColor(expense.status)}
            fontWeight="500"
          >
            {formatStatus(expense.status)}
          </Paragraph>
        </YStack>
      </DashboardWidgetItem>
    ))
  }

  return (
    <DashboardWidget
      title="Awaiting Review"
      icon={Clock}
      iconColor="$yellow10"
      isLoading={loading && displayExpenses.length === 0}
      error={error}
      emptyState={{
        icon: Clock,
        title: 'No expenses awaiting review',
        description: 'Expenses needing your approval will appear here',
      }}
      viewAllButton={{
        label: `View All (${expenses.length})`,
        onPress: () => router.push('/awaiting-review'),
      }}
    >
      {renderExpenseItems()}
    </DashboardWidget>
  )
}

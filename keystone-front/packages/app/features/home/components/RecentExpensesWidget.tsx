import { Paragraph, YStack, XStack, Spinner, DashboardWidget, DashboardWidgetItem } from '@my/ui'
import { Receipt, Briefcase } from '@tamagui/lucide-icons'
import React from 'react'
import { useAuth } from '../../../provider/AuthProvider'
import { useUserExpenses } from '../../../utils/queries.optimized'
import { useRouter } from 'solito/navigation'
import { formatCurrency } from '../../../utils/currency'

interface RecentExpensesWidgetProps {
  refreshKey?: number
}

export const RecentExpensesWidget = ({ refreshKey = 0 }: RecentExpensesWidgetProps) => {
  const { userProfile } = useAuth()
  const router = useRouter()

  // Fetch recent expenses (limited to 4)
  const {
    data: recentExpenses = [],
    isLoading: loading,
    error,
  } = useUserExpenses(
    { limit: 4 },
    {
      enabled: !!userProfile,
    }
  )

  // Fetch total count of all expenses
  const { data: allExpenses = [] } = useUserExpenses(
    {},
    {
      enabled: !!userProfile,
    }
  )

  // Use the recent expenses for display
  const expenses = recentExpenses

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '$green10'
      case 'PENDING_REVIEW':
      case 'PENDING_ADMIN':
        return '$yellow10'
      case 'DENIED':
        return '$red10'
      case 'REIMBURSED':
        return '$blue10'
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
      case 'APPROVED':
        return 'Approved'
      case 'DENIED':
        return 'Denied'
      case 'REIMBURSED':
        return 'Reimbursed'
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
    if (expenses.length === 0) {
      return null // Let the empty state handle this
    }

    return expenses.map((expense, index) => (
      <DashboardWidgetItem
        key={expense.id}
        onPress={() => router.push(`/expense/${expense.id}`)}
        showSeparator={index < expenses.length - 1}
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
      title="Recent Expenses"
      icon={Receipt}
      iconColor="$blue10"
      isLoading={loading && expenses.length === 0}
      error={error}
      emptyState={{
        icon: Receipt,
        title: 'No expenses submitted yet',
        description: 'Your recent expenses will appear here',
      }}
      viewAllButton={{
        label: `View All (${allExpenses.length})`,
        onPress: () => router.push('/expense'),
      }}
    >
      {renderExpenseItems()}
    </DashboardWidget>
  )
}

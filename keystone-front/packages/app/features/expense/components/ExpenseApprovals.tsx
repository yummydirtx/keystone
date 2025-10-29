import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Card, Spinner, Separator, Button, H3, Image } from '@my/ui'
import { ChevronDown, ChevronUp, History } from '@tamagui/lucide-icons'
import { useExpense, useExpenseApprovals } from '../../../utils/queries.optimized'
import { Approval, Expense } from '../../../types'
import { ExpenseStatus } from './ExpenseStatus'
import { ProfilePicture } from '../../../components/ProfilePicture'

// Define the valid status types for ExpenseStatus
type ValidExpenseStatus = 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'

interface ExpenseApprovalsProps {
  expenseId: string
}

interface HistoryItem {
  id: string
  status_change: string
  notes?: string
  createdAt: string
  user?: {
    id: number
    name: string
    email: string
    avatar_url?: string
  } | null
  isCreation?: boolean
}

export function ExpenseApprovals({ expenseId }: ExpenseApprovalsProps) {
  const [expanded, setExpanded] = useState(false)

  // Use TanStack Query hooks for data fetching
  const {
    data: expenseData,
    isLoading: expenseLoading,
    error: expenseError,
  } = useExpense(expenseId, {
    enabled: expanded, // Only fetch when expanded
  })

  const {
    data: approvalsData,
    isLoading: approvalsLoading,
    error: approvalsError,
  } = useExpenseApprovals(expenseId, {
    enabled: expanded, // Only fetch when expanded
  })

  // Combine expense and approvals data into history items
  const historyItems = expanded
    ? (() => {
        if (!expenseData || !approvalsData) return []

        // Create the creation history item
        const creationItem: HistoryItem = {
          id: `creation-${expenseData.id}`,
          status_change: 'SUBMITTED',
          createdAt: expenseData.createdAt,
          user: expenseData.submitter || null,
          isCreation: true,
        }

        // Convert approvals to history items
        const approvalItems: HistoryItem[] = (approvalsData || []).map((approval) => ({
          id: approval.id.toString(),
          status_change: approval.status_change,
          notes: approval.notes,
          createdAt: approval.createdAt,
          user: approval.user,
        }))

        // Combine and sort by date (creation first, then approvals)
        return [creationItem, ...approvalItems].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })()
    : []

  // Determine loading and error states
  const loading = expanded && (expenseLoading || approvalsLoading)
  const error = expenseError?.message || approvalsError?.message

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Card
      p="$4"
      bg="$background"
    >
      <YStack gap="$3">
        {/* Header matching other components */}
        <XStack
          items="center"
          gap="$2"
          mb="$2"
        >
          <History
            size="$1"
            color="$color11"
          />
          <H3 flex={1}>History</H3>
          {historyItems.length > 0 && (
            <Text
              fontSize="$2"
              color="$color10"
            >
              ({historyItems.length})
            </Text>
          )}
          <Button
            variant="outlined"
            size="$2"
            icon={expanded ? ChevronUp : ChevronDown}
            onPress={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </XStack>

        {expanded && (
          <YStack gap="$3">
            {loading ? (
              <YStack p="$4">
                <Spinner />
              </YStack>
            ) : error ? (
              <YStack p="$4">
                <Text color="$red10">{error}</Text>
              </YStack>
            ) : historyItems.length === 0 ? (
              <YStack p="$4">
                <Text color="$color10">No history available</Text>
              </YStack>
            ) : (
              <YStack gap="$3">
                {historyItems.map((item, index) => (
                  <YStack key={item.id}>
                    <XStack
                      gap="$3"
                      p="$3"
                      bg="$backgroundHover"
                    >
                      {/* User Avatar */}
                      <ProfilePicture
                        avatarUrl={item.user?.avatar_url}
                        name={item.user?.name || 'Anonymous'}
                        size={48}
                        borderRadius="$6"
                      />

                      {/* Content */}
                      <YStack
                        flex={1}
                        gap="$2"
                      >
                        <YStack gap="$1">
                          {item.isCreation ? (
                            <YStack
                              bg="blue"
                              px="$2"
                              py="$1"
                              alignSelf="flex-start"
                            >
                              <Text
                                color="white"
                                fontSize="$2"
                                fontWeight="600"
                              >
                                Submitted
                              </Text>
                            </YStack>
                          ) : (
                            <ExpenseStatus status={item.status_change as ValidExpenseStatus} />
                          )}
                          <Text
                            fontSize="$3"
                            color={item.user ? '$color11' : '$color9'}
                            fontWeight="500"
                          >
                            {item.user?.name || 'Anonymous User (account deleted)'}
                          </Text>
                          <Text
                            fontSize="$2"
                            color="$color10"
                          >
                            {formatDate(item.createdAt)}
                          </Text>
                        </YStack>

                        {item.notes && (
                          <YStack
                            gap="$1"
                            pt="$2"
                          >
                            <Text
                              fontSize="$2"
                              color="$color10"
                              fontWeight="500"
                            >
                              Notes:
                            </Text>
                            <Text
                              fontSize="$3"
                              color="$color11"
                              lineHeight="$1"
                            >
                              {item.notes}
                            </Text>
                          </YStack>
                        )}
                      </YStack>
                    </XStack>

                    {index < historyItems.length - 1 && <Separator />}
                  </YStack>
                ))}
              </YStack>
            )}
          </YStack>
        )}
      </YStack>
    </Card>
  )
}

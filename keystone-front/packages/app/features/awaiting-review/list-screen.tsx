import {
  Button,
  Paragraph,
  YStack,
  XStack,
  Spinner,
  ScrollView,
  H2,
  H3,
  H4,
  Card,
  Separator,
  Input,
  Checkbox,
  Sheet,
  TextArea,
  Image,
  Text,
} from '@my/ui'
import {
  ChevronLeft,
  AlertCircle,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Trash,
  Check,
  Tag,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { useRef, useState, useCallback } from 'react'
import { useExpensesAwaitingReview } from '../../utils/queries.optimized'
import type { Expense } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { LoginScreen } from '../auth/LoginScreen'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from 'app/components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { UserMenu } from '../../components/UserMenu'
import { formatCurrency } from '../../utils/currency'
import { BackButton } from '../../components/BackButton'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'

export function AwaitingReviewListScreen() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const screenTopPadding = useScreenTopPadding()
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  // Uncontrolled search input
  const searchQueryRef = useRef('')
  const [searchUiTick, setSearchUiTick] = useState(0)
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestSearchUiUpdate = () => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current)
    searchDebounceTimer.current = setTimeout(() => setSearchUiTick((t) => t + 1), 120)
  }
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  const {
    data: expenses = [],
    isLoading: loading,
    error,
    refetch: refetchExpenses,
  } = useExpensesAwaitingReview(
    {},
    {
      enabled: !!user && !!userProfile && !authLoading,
    }
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchExpenses()
    } finally {
      setRefreshing(false)
    }
  }, [refetchExpenses])

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

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQueryRef.current.toLowerCase()) ||
      expense.category?.name.toLowerCase().includes(searchQueryRef.current.toLowerCase()) ||
      expense.submitter?.name.toLowerCase().includes(searchQueryRef.current.toLowerCase())
  )

  const toggleExpenseSelection = (expenseId: number) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(filteredExpenses.map((expense) => expense.id)))
    }
  }

  const enterSelectionMode = () => {
    setSelectionMode(true)
    setSelectedExpenses(new Set())
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedExpenses(new Set())
  }

  if (authLoading) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
      >
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const renderExpenseItem = (expense: Expense) => (
    <Card
      key={expense.id}
      p="$0"
      mb="$2"
    >
      <XStack
        p="$4"
        justify="space-between"
        items="center"
        pressStyle={!selectionMode ? { scale: 0.98 } : undefined}
        onPress={() => {
          if (!selectionMode) {
            router.push(`/expense/${expense.id}`)
          }
        }}
        cursor="pointer"
      >
        {/* Checkbox for selection mode */}
        {selectionMode && (
          <XStack
            onPress={(e) => {
              e?.stopPropagation?.()
              toggleExpenseSelection(expense.id)
            }}
            mr="$3"
            cursor="pointer"
            pointerEvents="box-only"
          >
            <Checkbox
              id={`expense-${expense.id}`}
              checked={!!selectedExpenses.has(expense.id)}
              onCheckedChange={() => toggleExpenseSelection(expense.id)}
            >
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox>
          </XStack>
        )}

        <YStack
          gap="$2"
          flex={1}
        >
          <Paragraph
            fontWeight="600"
            color="$color12"
            size="$4"
          >
            {expense.description}
          </Paragraph>
          <XStack
            gap="$3"
            items="center"
          >
            <Paragraph
              size="$3"
              color="$color10"
            >
              {formatDate(expense.transaction_date)}
            </Paragraph>
          </XStack>
          {expense.category && (
            <XStack
              gap="$2"
              items="center"
            >
              <Tag
                size="$1"
                color="$color11"
              />
              <Paragraph
                size="$3"
                color="$color10"
              >
                {expense.category.name}
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
          gap="$2"
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
        {!selectionMode && (
          <ChevronRight
            size={20}
            color="$color11"
            ml="$3"
          />
        )}
      </XStack>
    </Card>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
        >
          <Spinner size="large" />
          <Paragraph
            mt="$3"
            color="$color11"
          >
            Loading expenses...
          </Paragraph>
        </YStack>
      )
    }

    if (error) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$3"
        >
          <AlertCircle
            color="$red10"
            size={48}
          />
          <H3 color="$red10">Error Loading Expenses</H3>
          <Paragraph
            color="$red10"
            text="center"
          >
            {error?.message || 'Failed to load expenses'}
          </Paragraph>
          <Button
            onPress={() => refetchExpenses()}
            variant="outlined"
          >
            Try Again
          </Button>
        </YStack>
      )
    }

    if (filteredExpenses.length === 0) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$3"
        >
          <Clock
            size={64}
            color="$color8"
          />
          <H3 color="$color11">
            {searchQueryRef.current ? 'No matching expenses' : 'No expenses awaiting review'}
          </H3>
          <Paragraph
            color="$color10"
            text="center"
          >
            {searchQueryRef.current
              ? 'Try adjusting your search terms'
              : 'Expenses requiring your review will appear here'}
          </Paragraph>
        </YStack>
      )
    }

    return <YStack gap="$2">{filteredExpenses.map(renderExpenseItem)}</YStack>
  }

  return (
    <>
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />

      <RefreshableScrollView
        flex={1}
        p="$4"
        pt={screenTopPadding}
        pb="$-4"
        bg="$background"
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <YStack
          gap="$4"
          maxW={1200}
          width="100%"
          mx="auto"
          pb="$8"
          minH="84vh"
        >
          {/* Header with Back Button and Info */}
          <XStack
            justify="space-between"
            items="center"
            mb="$4"
          >
            <BackButton />
            <XStack gap="$2">
              {!selectionMode ? (
                <Button
                  onPress={enterSelectionMode}
                  icon={Check}
                  size="$3"
                  variant="outlined"
                >
                  Select
                </Button>
              ) : (
                <>
                  <Button
                    onPress={exitSelectionMode}
                    size="$3"
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  {selectedExpenses.size > 0 && (
                    <Button
                      onPress={() => setShowBulkDeleteDialog(true)}
                      icon={Trash}
                      theme="red"
                      size="$3"
                      disabled={bulkDeleteLoading}
                    >
                      Delete ({selectedExpenses.size.toString()})
                    </Button>
                  )}
                </>
              )}
            </XStack>
          </XStack>

          {/* Page Title and Subtitle */}
          <YStack
            gap="$2"
            mb="$4"
          >
            <H2 size="$8">Awaiting Review</H2>
            <Paragraph
              size="$4"
              color="$color10"
            >
              {expenses.length.toString()} expenses awaiting your review
            </Paragraph>
          </YStack>

          {/* Select All checkbox when in selection mode */}
          {selectionMode && (
            <XStack
              items="center"
              gap="$3"
              mb="$3"
            >
              <Checkbox
                id="select-all-expenses"
                checked={
                  selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0
                }
                onCheckedChange={toggleSelectAll}
              >
                <Checkbox.Indicator>
                  <Check />
                </Checkbox.Indicator>
              </Checkbox>
              <Paragraph>Select all expenses</Paragraph>
            </XStack>
          )}

          {/* Search Bar */}
          <XStack
            gap="$3"
            mb="$4"
          >
            <Input
              flex={1}
              placeholder="Search expenses..."
              defaultValue={searchQueryRef.current}
              onChangeText={(text) => {
                searchQueryRef.current = text
                requestSearchUiUpdate()
              }}
              size="$4"
            />
            <Button
              size="$4"
              variant="outlined"
              icon={Search}
            />
          </XStack>

          {/* Content */}
          {renderContent()}
        </YStack>
      </RefreshableScrollView>

      <Footer />

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Sheet
        modal
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        snapPointsMode="fit"
        dismissOnSnapToBottom
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame p="$4">
          <Sheet.Handle />
          <YStack gap="$4">
            <H4>Delete Expenses</H4>
            <Paragraph color="$color11">
              Are you sure you want to delete {selectedExpenses.size.toString()} expense
              {selectedExpenses.size > 1 ? 's' : ''}? This action cannot be undone.
            </Paragraph>

            <XStack
              gap="$3"
              justify="flex-end"
              pt="$2"
            >
              <Button
                variant="outlined"
                disabled={bulkDeleteLoading}
                onPress={() => setShowBulkDeleteDialog(false)}
                flex={1}
              >
                Cancel
              </Button>

              <Button
                theme="red"
                onPress={() => {
                  // TODO: Implement bulk delete for expenses awaiting review
                  setShowBulkDeleteDialog(false)
                  setSelectedExpenses(new Set())
                  setSelectionMode(false)
                }}
                disabled={bulkDeleteLoading}
                icon={bulkDeleteLoading ? Spinner : Trash}
                flex={1}
              >
                {bulkDeleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

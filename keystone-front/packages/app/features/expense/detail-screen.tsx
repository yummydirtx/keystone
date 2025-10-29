// packages/app/features/expense/detail-screen.tsx
import { Button, Paragraph, YStack, XStack, Spinner, H3 } from '@my/ui'
import { ChevronLeft, AlertCircle } from '@tamagui/lucide-icons'
import { useRouter, useSearchParams } from 'solito/navigation'
import { useState, useEffect } from 'react'
import { useExpense } from '../../hooks/useExpense'
import type { Expense } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { useCategory, queryKeys } from '../../utils/queries.optimized'
import { LoginScreen } from '../auth/LoginScreen'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from 'app/components/Footer'
import { UserMenu } from '../../components/UserMenu'
import {
  ExpenseHeader,
  ExpenseCategory,
  ExpenseWorkspace,
  ExpenseReceipt,
  ExpenseSubmitter,
  ExpenseNotes,
  ExpenseTimestamps,
  ExpenseItemizedReceipt,
  ExpenseActions,
  ExpenseApprovals,
  DeleteExpenseButton,
  ExpenseDetailActions,
  MoveCategoryWidget,
} from './components'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { RefreshableScrollView } from 'app/components/RefreshableScrollView'
import { Platform } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

export function ExpenseDetailScreen({
  id,
  onStatusUpdateSuccess,
}: {
  id: string
  onStatusUpdateSuccess?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    user,
    userProfile,
    loading: authLoading,
    isGuest,
    setGuestSession,
    guestSession,
  } = useAuth()
  const { expense, loading, error, refetch } = useExpense(id)
  const screenTopPadding = useScreenTopPadding()
  const queryClient = useQueryClient()

  const [menuOpen, setMenuOpen] = useState(false)
  const [canApprove, setCanApprove] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [canMoveCategory, setCanMoveCategory] = useState(false)
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(expense)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch category meta (including userRole) when we know the expense category and user is authenticated
  const categoryIdForQuery = currentExpense?.category?.id ? String(currentExpense.category.id) : ''
  const { data: categoryMeta } = useCategory(categoryIdForQuery, {
    enabled: !!categoryIdForQuery && !!user && !isGuest,
  })

  // Handle guest token validation
  useEffect(() => {
    const guestToken = searchParams?.get('guestToken')

    const authenticateGuest = async (token: string) => {
      try {
        const { validateGuestToken } = await import('../../utils/api')
        const response = await validateGuestToken(token)
        let permissionLevel = null

        if (response.data) {
          const guestSessionData = {
            token: token,
            permissions: response.data.permission_level,
            categoryId: response.data.category_id,
          }
          setGuestSession(guestSessionData)
          permissionLevel = response.data.permission_level
        } else {
          // Check if the data is directly in the response
          if (response.permission_level && response.category_id) {
            const guestSessionData = {
              token: token,
              permissions: response.permission_level,
              categoryId: response.category_id,
            }
            setGuestSession(guestSessionData)
            permissionLevel = response.permission_level
          }
        }
      } catch (error) {
        console.error('Guest token validation failed', error)
        // Redirect to home page if token validation fails
        router.push('/')
      }
    }

    if (guestToken && !isGuest) {
      authenticateGuest(guestToken)
    }
  }, [id, searchParams, setGuestSession, router, isGuest])

  useEffect(() => {
    if (expense) {
      setCurrentExpense(expense)
    }
  }, [expense])

  useEffect(() => {
    if (authLoading || (!user && !isGuest) || !currentExpense) return

    // Handle guest users with REVIEW_ONLY permission
    if (isGuest && guestSession?.permissions === 'REVIEW_ONLY') {
      // Guest reviewers can only act on expenses in PENDING_REVIEW (not PENDING_ADMIN)
      const canGuestApprove = currentExpense.status === 'PENDING_REVIEW'
      setCanApprove(canGuestApprove)
      setCanDelete(false) // Guests cannot delete expenses
      return
    }

    // Handle authenticated users
    if (user) {
      // Determine user role for the expense category using fetched category meta
      const userRole = categoryMeta?.userRole as string | undefined
      const isAdmin = userRole === 'ADMIN'
      const isReviewer = userRole === 'REVIEWER'

      // Only admins can act on PENDING_ADMIN items. Reviewers can act on PENDING_REVIEW.
      let canUserApprove = false
      if (currentExpense.status === 'PENDING_REVIEW') {
        canUserApprove = true // Admins and reviewers can handle initial review
      } else if (currentExpense.status === 'PENDING_ADMIN') {
        canUserApprove = isAdmin && !isReviewer
      }
      setCanApprove(canUserApprove)

      // User can delete if they are the submitter or if they have reviewer permissions
      // The backend will validate the exact permissions and status restrictions
      const isSubmitter =
        userProfile && currentExpense.submitter && currentExpense.submitter.id === userProfile.id
      const canUserDelete = isSubmitter || canUserApprove
      setCanDelete(canUserDelete)

      // Determine if user can move category:
      // 1. Admins can move any expense to any category they have permission for
      // 2. Submitters can move their own PENDING expenses to categories they have permission for
      let canUserMoveCategory = false
      if (isAdmin) {
        // Admins can move any expense
        canUserMoveCategory = true
      } else if (isSubmitter && currentExpense.status === 'PENDING_REVIEW') {
        // Submitters can move their own pending expenses
        canUserMoveCategory = true
      }
      setCanMoveCategory(canUserMoveCategory)
    }
  }, [id, user, userProfile, authLoading, currentExpense, isGuest, guestSession, categoryMeta])

  // Update document title when expense data is available
  useEffect(() => {
    // Only run on client side
    if (typeof document === 'undefined') return
    if (typeof window !== 'undefined' && currentExpense?.description) {
      document.title = `${currentExpense.description} - Keystone`
    }
  }, [currentExpense])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenseApprovals(id) }),
      ])
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusUpdate = (newStatus: string) => {
    if (currentExpense) {
      const updatedExpense = {
        ...currentExpense,
        status: newStatus as typeof currentExpense.status,
      }
      setCurrentExpense(updatedExpense)
      setCanApprove(false) // Remove approval buttons after status change
    }
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

  if (!user && !isGuest) {
    return <LoginScreen />
  }

  if (loading) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
        >
          <Spinner size="large" />
          <Paragraph
            mt="$4"
            color="$color11"
          >
            Loading expense details...
          </Paragraph>
        </YStack>
        <Footer />
        <UserMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="dropdown"
        />
      </>
    )
  }

  if (error) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
        >
          <AlertCircle
            size="$6"
            color="$red10"
          />
          <H3
            mt="$4"
            text="center"
            color="$red11"
          >
            Error Loading Expense
          </H3>
          <Paragraph
            mt="$2"
            text="center"
            color="$color11"
          >
            {error}
          </Paragraph>
          <Button
            mt="$4"
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.reload()
              } else {
                void refetch()
              }
            }}
          >
            Try Again
          </Button>
        </YStack>
        <Footer />
        <UserMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="dropdown"
        />
      </>
    )
  }

  if (!currentExpense) {
    return (
      <>
        <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
        >
          <AlertCircle
            size="$6"
            color="$color10"
          />
          <H3
            mt="$4"
            text="center"
            color="$color11"
          >
            Expense Not Found
          </H3>
          <Paragraph
            mt="$2"
            text="center"
            color="$color11"
          >
            The expense you're looking for doesn't exist or you don't have permission to view it.
          </Paragraph>
          {(Platform.OS !== 'web' ||
            (typeof window !== 'undefined' && window.history.length > 1)) && (
            <Button
              mt="$4"
              onPress={() => {
                // On web, check history; on native, just navigate back
                if (Platform.OS === 'web') {
                  if (window.history.length > 1) {
                    router.back()
                  } else {
                    router.replace('/dashboard')
                  }
                } else {
                  router.back()
                }
              }}
            >
              Go Back
            </Button>
          )}
        </YStack>
        <Footer />
        <UserMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          variant="dropdown"
        />
      </>
    )
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
          {/* Back Button and Expense Actions, with Expense Actions being on the opposite side*/}
          <ExpenseDetailActions
            id={id}
            expenseDescription={currentExpense.description}
            canDelete={canDelete}
            canApprove={canApprove}
            currentStatus={currentExpense.status}
            onStatusUpdate={handleStatusUpdate}
            onStatusUpdateSuccess={onStatusUpdateSuccess}
          />

          {/* Main Expense Info - Full width on all screens */}
          <ExpenseHeader
            description={currentExpense.description}
            amount={currentExpense.amount}
            transactionDate={currentExpense.transaction_date}
            status={currentExpense.status}
          />

          {/* Detail Sections - Responsive Grid Layout */}
          <XStack
            gap="$4"
            flexDirection="column"
            $md={{ flexDirection: 'row' }}
          >
            {/* Left Column on Desktop / Sequential on Mobile */}
            <YStack
              gap="$4"
              flex={1}
              $md={{ maxW: '50%', minW: '45%' }}
            >
              {/* Category and Workspace are adjacent and fill the entire space */}
              <XStack
                gap="$3"
                flexWrap="wrap"
              >
                {/* Category Info */}
                {currentExpense.category && (
                  <YStack
                    flex={1}
                    minW="45%"
                  >
                    <ExpenseCategory category={currentExpense.category} />
                  </YStack>
                )}

                {/* Workspace Info */}
                {currentExpense.report && (
                  <YStack
                    flex={1}
                    minW="50%"
                  >
                    <ExpenseWorkspace workspace={currentExpense.report} />
                  </YStack>
                )}
              </XStack>

              {/* Move Category Widget */}
              <MoveCategoryWidget
                expense={currentExpense}
                onExpenseUpdate={setCurrentExpense}
                canMoveCategory={canMoveCategory}
              />

              {/* Submitter Info */}
              <ExpenseSubmitter
                submitter={currentExpense.submitter}
                guestName={currentExpense.guest_name}
                guestEmail={currentExpense.guest_email}
              />

              {/* Notes */}
              {currentExpense.notes && <ExpenseNotes notes={currentExpense.notes} />}

              {/* Timestamps */}
              <ExpenseTimestamps
                createdAt={currentExpense.createdAt}
                updatedAt={currentExpense.updatedAt}
              />

              {/* The receipt and delete button are adjacent and fill the entire space */}
              <XStack
                gap="$3"
                flexWrap="wrap"
              >
                {/* Delete Button - Hide for guest users */}
                {!isGuest && <DeleteExpenseButton expenseId={id} />}

                {/* Receipt */}
                {currentExpense.receipt_url && (
                  <ExpenseReceipt
                    receiptUrl={currentExpense.receipt_url}
                    guestToken={isGuest ? guestSession?.token : undefined}
                  />
                )}
              </XStack>
            </YStack>

            {/* Right Column on Desktop / Continues Sequential on Mobile */}
            <YStack
              gap="$4"
              flex={1}
              $md={{ maxW: '50%', minW: '45%' }}
            >
              {/* Approval History */}
              <ExpenseApprovals expenseId={id} />

              {/* Itemized Receipt */}
              {currentExpense.items?.details && currentExpense.items.details.length > 0 && (
                <ExpenseItemizedReceipt
                  items={currentExpense.items.details.map((item) => ({
                    ...item,
                    name: item.name || '',
                    price: item.price ?? 0,
                  }))}
                />
              )}
            </YStack>
          </XStack>
        </YStack>
      </RefreshableScrollView>
      <Footer />
      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />
    </>
  )
}

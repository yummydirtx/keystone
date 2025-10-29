// packages/app/features/category/detail-screen.tsx
import {
  Button,
  Paragraph,
  YStack,
  XStack,
  Spinner,
  H2,
  Separator,
  useToastController,
} from '@my/ui'
import { ChevronLeft, Plus, Share } from '@tamagui/lucide-icons'
import { useRouter, useSearchParams } from 'solito/navigation'
import { useParams } from 'solito/navigation'
import React, { useEffect, useState } from 'react'
import { Expense } from '../../types'
import { NavigationBar } from '../../components/NavigationBar'
import { UserMenu } from '../../components/UserMenu'
import { useCategoryDetailQuery } from './hooks/useCategoryDetailQuery'
// Removed focus-based refresh; rely on query invalidation and per-query settings
import { Footer } from 'app/components/Footer'
import { LoginScreen } from '../auth/LoginScreen'
import { CreateExpenseSheet } from '../expense/CreateExpenseSheet'
import {
  CategoryHeader,
  CategoryList,
  CreateCategorySheet,
  EditCategorySheet,
  ShareCategoryDialog,
  DeleteCategoryDialog,
  ExpenseList,
  CategoryOptionsSheet,
} from './components'
import { canCreateCategory } from '../../utils/categoryPermissions'
import type { CategoryOptions } from './components/CategoryOptionsSheet'
import { useAuth } from 'app/provider/AuthProvider'
import { validateGuestToken } from 'app/utils/api'
import {
  useUpdateExpenseStatus,
  useUpdateGuestExpenseStatus,
  useDeleteExpense,
  useUpdateCategoryOptions,
} from '../../utils/queries.optimized'
import { BackButton } from 'app/components/BackButton'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { GuestLinkDialog } from './components'
import { RefreshableScrollView } from 'app/components/RefreshableScrollView'

export function CategoryDetailScreen() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const { setGuestSession, isGuest, guestSession } = useAuth()
  const router = useRouter()
  const toast = useToastController()
  const screenTopPadding = useScreenTopPadding()
  const [refreshing, setRefreshing] = useState(false)

  // State for expense selection
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([])

  // State for guest links dialog
  const [guestLinksOpen, setGuestLinksOpen] = useState(false)

  // State for category options dialog
  const [categoryOptionsOpen, setCategoryOptionsOpen] = useState(false)

  // Mutation hooks for batch operations
  const updateExpenseStatusMutation = useUpdateExpenseStatus()
  const updateGuestExpenseStatusMutation = useUpdateGuestExpenseStatus()
  const deleteExpenseMutation = useDeleteExpense()
  const updateCategoryOptionsMutation = useUpdateCategoryOptions()

  useEffect(() => {
    const guestToken = searchParams?.get('guestToken')

    const authenticateGuest = async (token) => {
      try {
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

        // Redirect SUBMIT_ONLY users to the submitter page
        if (permissionLevel === 'SUBMIT_ONLY') {
          router.push(`/submitter/${id}?guestToken=${token}`)
        }
      } catch (error) {
        console.error('Guest token validation failed', error)
      }
    }

    if (guestToken) {
      authenticateGuest(guestToken)
    }
  }, [id, searchParams, setGuestSession, router])

  const {
    // State
    category,
    expenses,
    loading,
    error,
    userRole,
    hasDirectPermission,
    menuOpen,
    createCategoryOpen,
    editCategoryOpen,
    createExpenseOpen,
    shareDialogOpen,
    deleteCategoryOpen,
    creating,
    updating,
    sharing,
    deleting,
    collapsedCategories,
    categoryId,
    authLoading,
    user,

    // Actions
    setMenuOpen,
    setCreateCategoryOpen,
    setEditCategoryOpen,
    setCreateExpenseOpen,
    setShareDialogOpen,
    setDeleteCategoryOpen,
    handleCreateCategory,
    handleUpdateCategory,
    handleShareCategory,
    handleDeleteCategory,
    handleToggleCollapse,
    refetch,
  } = useCategoryDetailQuery(id as string)

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  // Handler for saving category options
  const handleSaveCategoryOptions = async (options: CategoryOptions) => {
    try {
      await updateCategoryOptionsMutation.mutateAsync({
        id: categoryId.toString(),
        data: {
          require_receipt: options.requireReceiptForApproval,
          allow_guest_submissions: options.allowGuestSubmissions,
          allow_user_submissions: options.allowUserSubmissions,
        },
      })

      // Refetch the category data to update the UI with new values
      await refetch()

      toast.show('Options saved successfully', {
        message: 'Category options have been updated.',
      })
    } catch (error) {
      console.error('Failed to save category options:', error)
      throw error // Re-throw so the component can handle it
    }
  }

  // Update document title when category data is available
  React.useEffect(() => {
    // Only run on client side web
    if (typeof document === 'undefined') return
    if (typeof window !== 'undefined' && category?.name) {
      document.title = `${category.name} - Keystone`
    }
  }, [category])

  // Focus-based auto refresh removed; manual refresh via UI or mutation invalidation

  // Batch operation handlers
  const handleExpenseSelectionChange = (expenseId: number, selected: boolean) => {
    setSelectedExpenses((prev) =>
      selected ? [...prev, expenseId] : prev.filter((id) => id !== expenseId)
    )
  }

  const handleBatchApprove = async () => {
    if (selectedExpenses.length === 0) {
      toast.show('No expenses selected', {
        message: 'Please select expenses to approve.',
      })
      return
    }

    try {
      // Update all selected expenses to approved status
      if (isGuest && guestSession?.token) {
        // Use guest API endpoint for each expense
        await Promise.all(
          selectedExpenses.map((expenseId) =>
            updateGuestExpenseStatusMutation.mutateAsync({
              token: guestSession.token,
              id: expenseId.toString(),
              data: { status: 'APPROVED' },
            })
          )
        )
      } else {
        // Use regular API endpoint for authenticated users
        await Promise.all(
          selectedExpenses.map((expenseId) =>
            updateExpenseStatusMutation.mutateAsync({
              id: expenseId.toString(),
              data: { status: 'APPROVED' },
            })
          )
        )
      }

      // For guests, the actual status will be PENDING_ADMIN
      const statusMessage = isGuest
        ? `${selectedExpenses.length} expense(s) have been approved and forwarded to admin for final approval.`
        : `${selectedExpenses.length} expense(s) have been approved.`

      toast.show('Expenses approved successfully', {
        message: statusMessage,
      })

      setSelectedExpenses([])
      refetch() // Refresh the data
    } catch (error) {
      console.error('Failed to approve expenses:', error)
      toast.show('Failed to approve expenses', {
        message: error.message || 'Please try again.',
      })
    }
  }

  const handleBatchDeny = async () => {
    if (selectedExpenses.length === 0) {
      toast.show('No expenses selected', {
        message: 'Please select expenses to deny.',
      })
      return
    }

    try {
      // Update all selected expenses to denied status
      if (isGuest && guestSession?.token) {
        // Use guest API endpoint for each expense
        await Promise.all(
          selectedExpenses.map((expenseId) =>
            updateGuestExpenseStatusMutation.mutateAsync({
              token: guestSession.token,
              id: expenseId.toString(),
              data: { status: 'DENIED' },
            })
          )
        )
      } else {
        // Use regular API endpoint for authenticated users
        await Promise.all(
          selectedExpenses.map((expenseId) =>
            updateExpenseStatusMutation.mutateAsync({
              id: expenseId.toString(),
              data: { status: 'DENIED' },
            })
          )
        )
      }

      toast.show('Expenses denied successfully', {
        message: `${selectedExpenses.length} expense(s) have been denied.`,
      })

      setSelectedExpenses([])
      refetch() // Refresh the data
    } catch (error) {
      console.error('Failed to deny expenses:', error)
      toast.show('Failed to deny expenses', {
        message: 'Please try again.',
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedExpenses.length === 0) {
      toast.show('No expenses selected', {
        message: 'Please select expenses to delete.',
      })
      return
    }

    try {
      // Delete all selected expenses
      await Promise.all(
        selectedExpenses.map((expenseId) => deleteExpenseMutation.mutateAsync(expenseId.toString()))
      )

      toast.show('Expenses deleted successfully', {
        message: `${selectedExpenses.length} expense(s) have been deleted.`,
      })

      setSelectedExpenses([])
      refetch() // Refresh the data
    } catch (error) {
      console.error('Failed to delete expenses:', error)
      toast.show('Failed to delete expenses', {
        message: 'Please try again.',
      })
    }
  }

  if (loading || authLoading) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
        bg="$background"
      >
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!user && !isGuest) {
    return <LoginScreen />
  }

  if (error) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
        gap="$4"
        bg="$background"
      >
        <Paragraph color="$red10">{error}</Paragraph>
        <BackButton />
      </YStack>
    )
  }

  return (
    <>
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
      <YStack
        flex={1}
        bg="$background"
      >
        <RefreshableScrollView
          flex={1}
          p="$4"
          pb="$-4"
          pt={screenTopPadding}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          <YStack
            flex={1}
            justify="space-between"
            minH="calc(100vh - 150px)"
            maxW={1200}
            width="100%"
            mx="auto"
            mb="$6"
          >
            <YStack gap="$4">
              <CategoryHeader
                category={category}
                userRole={userRole}
                hasDirectPermission={hasDirectPermission}
                onEditPress={() => setEditCategoryOpen(true)}
                onDeletePress={() => setDeleteCategoryOpen(true)}
                onSharePress={() => setShareDialogOpen(true)}
                onLinksPress={() => setGuestLinksOpen(true)}
                onOptionsPress={() => setCategoryOptionsOpen(true)}
              />
              <Separator />

              {/* Categories and Expenses - Responsive Grid Layout */}
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
                  <CategoryList
                    categories={category?.children || []}
                    collapsedCategories={collapsedCategories}
                    onToggleCollapse={handleToggleCollapse}
                    onCreateSubcategory={
                      canCreateCategory(userRole)
                        ? () => {
                            setCreateCategoryOpen(true)
                          }
                        : undefined
                    }
                  />
                </YStack>

                {/* Right Column on Desktop / Continues Sequential on Mobile */}
                <YStack
                  gap="$4"
                  flex={1}
                  $md={{ maxW: '50%', minW: '45%' }}
                >
                  <ExpenseList
                    expenses={expenses}
                    onCreateExpense={() => setCreateExpenseOpen(true)}
                    selectedExpenses={selectedExpenses}
                    onExpenseSelectionChange={handleExpenseSelectionChange}
                    onBatchApprove={handleBatchApprove}
                    onBatchDeny={handleBatchDeny}
                    onBatchDelete={handleBatchDelete}
                  />
                </YStack>
              </XStack>
            </YStack>
          </YStack>
          <Footer />
        </RefreshableScrollView>
      </YStack>

      <CreateCategorySheet
        isOpen={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onCreateCategory={handleCreateCategory}
        creating={creating}
        title="Create New Sub-Category"
      />

      <EditCategorySheet
        isOpen={editCategoryOpen}
        onOpenChange={setEditCategoryOpen}
        onUpdateCategory={handleUpdateCategory}
        updating={updating}
        category={category}
      />

      {createExpenseOpen && (
        <>
          {}
          <CreateExpenseSheet
            isOpen={createExpenseOpen}
            onClose={() => setCreateExpenseOpen(false)}
            categoryId={categoryId}
            categoryData={category || undefined}
            userRole={userRole || undefined}
            onExpenseCreated={refetch}
          />
        </>
      )}

      <ShareCategoryDialog
        categoryId={categoryId}
        isOpen={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onShare={handleShareCategory}
        sharing={sharing}
        categoryName={category?.name || 'Category'}
      />

      <DeleteCategoryDialog
        isOpen={deleteCategoryOpen}
        onOpenChange={setDeleteCategoryOpen}
        onDelete={handleDeleteCategory}
        deleting={deleting}
        category={category}
      />

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />

      <GuestLinkDialog
        isOpen={guestLinksOpen}
        onOpenChange={setGuestLinksOpen}
        categoryId={categoryId}
      />

      <CategoryOptionsSheet
        isOpen={categoryOptionsOpen}
        onOpenChange={setCategoryOptionsOpen}
        category={category}
        onSaveOptions={handleSaveCategoryOptions}
        saving={updateCategoryOptionsMutation.isPending}
      />
    </>
  )
}

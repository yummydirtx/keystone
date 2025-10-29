import { Button, H1, Paragraph, XStack, YStack, ScrollView, useToastController } from '@my/ui'
import { RefreshCw } from '@tamagui/lucide-icons'
import React, { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../provider/AuthProvider'
import { LoginScreen } from '../auth/LoginScreen'
import { WelcomeScreen } from '../onboarding/WelcomeScreen'
import { Footer } from '../../components/Footer'
import { NavigationBar } from '../../components/NavigationBar'
import { UserMenu } from '../../components/UserMenu'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import {
  DashboardCard,
  AdminWorkspacesWidget,
  RecentExpensesWidget,
  AwaitingReviewWidget,
  SharedCategoriesWidget,
  CreateWorkspaceDialog,
  DeleteWorkspaceDialog,
  RenameWorkspaceDialog,
} from './components'
import { queryKeys } from '../../utils/queries.optimized'
import { type Workspace, SharedCategory } from '../../types'
import { useCurrentUser, useWorkspaces } from '../../utils/queries.optimized'
// Removed focus-based refresh; rely on query invalidation and per-query settings
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'

/**
 * Renders the main home screen with dashboard overview and expense management.
 * This component serves as the primary dashboard, displaying recent expenses,
 * Workspaces, categories, and providing navigation to other features. It handles
 * authentication state and shows appropriate content based on user login status.
 *
 * @param {object} props - The component's props.
 * @param {boolean} [props.pagesMode=false] - Whether the component is running in Next.js pages mode.
 * @returns {JSX.Element} The rendered home screen with dashboard content or login screen.
 *
 * @example
 * // Basic home screen for app router
 * <HomeScreen />
 *
 * @example
 * // Home screen for pages router mode
 * <HomeScreen pagesMode={true} />
 *
 * @example
 * // Usage in a route component
 * export default function HomePage() {
 *   return <HomeScreen />
 * }
 */
export function HomeScreen({ pagesMode = false }: { pagesMode?: boolean }) {
  const {
    user,
    loading,
    getUserDisplayName,
    refreshUserProfile,
    showWelcomeScreen,
    completeOnboarding,
  } = useAuth()
  const { data: currentUser } = useCurrentUser()
  const toast = useToastController()
  const queryClient = useQueryClient()
  const screenTopPadding = useScreenTopPadding()

  const [menuOpen, setMenuOpen] = useState(false)
  const [isCreateWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] = useState(false)
  const [isDeleteWorkspaceDialogOpen, setDeleteWorkspaceDialogOpen] = useState(false)
  const [isRenameWorkspaceDialogOpen, setRenameWorkspaceDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<number[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  // Use TanStack Query hook for Workspaces
  const {
    data: Workspaces = [],
    isLoading: loadingWorkspaces,
    refetch: refetchWorkspaces,
  } = useWorkspaces()

  // Refresh all widgets (expenses, shared categories, Workspaces) and user profile using TanStack Query
  const refreshWidgets = useCallback(async () => {
    setRefreshing(true)
    try {
      // Force refetch all the queries that the widgets use - this ensures fresh data
      await Promise.all([
        queryClient.refetchQueries(
          { queryKey: queryKeys.userExpenses({ limit: 4 }), type: 'active' },
          { cancelRefetch: false }
        ),
        // Also refresh the unfiltered userExpenses for count summaries
        queryClient.refetchQueries(
          { queryKey: queryKeys.userExpenses({}), type: 'active' },
          { cancelRefetch: false }
        ),
        queryClient.refetchQueries(
          { queryKey: queryKeys.expensesAwaitingReview({ limit: 5 }), type: 'active' },
          { cancelRefetch: false }
        ),
        queryClient.refetchQueries(
          { queryKey: queryKeys.sharedCategories({}), type: 'active' },
          { cancelRefetch: false }
        ),
        // Align workspaces/reports keys
        queryClient.refetchQueries(
          { queryKey: queryKeys.reports(), type: 'active' },
          { cancelRefetch: false }
        ),
        queryClient.refetchQueries(
          { queryKey: queryKeys.workspaces(), type: 'active' },
          { cancelRefetch: false }
        ),
      ])

      // Also refresh Workspaces key for components that still use it

      // Also refresh user profile to update display name
      try {
        await refreshUserProfile()
      } catch (error) {
        console.error('Failed to refresh user profile:', error)
      }
    } finally {
      setRefreshing(false)
    }
  }, [queryClient, refreshUserProfile])

  // Refresh shared categories specifically
  const refreshSharedCategories = useCallback(async () => {
    // Force refetch shared categories query
    await queryClient.refetchQueries(
      { queryKey: queryKeys.sharedCategories({}), type: 'active' },
      { cancelRefetch: false }
    )
  }, [queryClient])

  // Fetch Workspaces to get full Workspace data for dialogs
  useEffect(() => {
    if (user) {
      refetchWorkspaces()
    }
  }, [user, refetchWorkspaces]) // Add user as dependency

  // Focus-based auto refresh removed; manual refresh via UI or mutation invalidation

  const handleWorkspaceCreated = () => {
    // Invalidate the Workspaces query cache to force a refresh
    queryClient.invalidateQueries({ queryKey: queryKeys.reports() })
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() })
    setSelectedWorkspaces([]) // Clear selection when Workspaces are refreshed
  }

  const handleWorkspaceSelectionChange = (workspaceId: number, selected: boolean) => {
    setSelectedWorkspaces((prev) =>
      selected ? [...prev, workspaceId] : prev.filter((id) => id !== workspaceId)
    )
  }

  const handleDeleteWorkspaces = () => {
    if (selectedWorkspaces.length > 0) {
      setDeleteWorkspaceDialogOpen(true)
    } else {
      toast.show('Please select at least one workspace to delete', {
        message: 'Select the workspaces you want to delete and try again.',
      })
    }
  }

  const handleRenameWorkspace = () => {
    if (selectedWorkspaces.length === 1) {
      setRenameWorkspaceDialogOpen(true)
    } else if (selectedWorkspaces.length === 0) {
      toast.show('Please select a workspace to rename', {
        message: 'Select exactly one workspace and try again.',
      })
    } else {
      toast.show('Please select only one workspace to rename', {
        message: 'Select exactly one workspace and try again.',
      })
    }
  }

  const handleRenameIndividualWorkspace = (workspace: Workspace & { rootCategoryId?: number }) => {
    // Set the selected workspace for the dialog
    setSelectedWorkspaces([workspace.id])
    setRenameWorkspaceDialogOpen(true)
  }

  const handleWorkspaceDeleted = () => {
    setSelectedWorkspaces([])
    refreshWidgets() // Refresh widgets when workspaces are deleted
  }

  const handleWorkspaceRenamed = () => {
    setSelectedWorkspaces([])
  }

  // Get selected workspace objects for dialogs
  const selectedWorkspaceObjects = Workspaces.filter((workspace) =>
    selectedWorkspaces.includes(workspace.id)
  )
  const workspaceToRename = selectedWorkspaces.length === 1 ? selectedWorkspaceObjects[0] : null

  if (loading) {
    return (
      <YStack
        flex={1}
        justify="center"
        items="center"
        minH="100vh"
        bg="$background"
      >
        <Paragraph>Loading...</Paragraph>
      </YStack>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  // Show welcome screen for new users who need onboarding
  if (showWelcomeScreen) {
    return <WelcomeScreen onComplete={completeOnboarding} />
  }

  return (
    <YStack
      flex={1}
      minH="100vh"
      bg="$background"
    >
      <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="dropdown"
      />
      <CreateWorkspaceDialog
        isOpen={isCreateWorkspaceDialogOpen}
        onClose={() => setCreateWorkspaceDialogOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
      <DeleteWorkspaceDialog
        isOpen={isDeleteWorkspaceDialogOpen}
        onClose={() => setDeleteWorkspaceDialogOpen(false)}
        onWorkspaceDeleted={handleWorkspaceDeleted}
        workspacesToDelete={selectedWorkspaceObjects}
      />
      <RenameWorkspaceDialog
        isOpen={isRenameWorkspaceDialogOpen}
        onClose={() => setRenameWorkspaceDialogOpen(false)}
        onWorkspaceRenamed={handleWorkspaceRenamed}
        workspaceToRename={workspaceToRename}
      />
      <RefreshableScrollView
        flex={1}
        onRefresh={refreshWidgets}
        refreshing={refreshing}
      >
        <YStack
          maxW={1200}
          width="100%"
          mx="auto"
        >
          <YStack
            minH="93vh"
            gap="$6"
            p="$4"
            pt={screenTopPadding}
            pb="$8"
            flex={1}
          >
            <YStack gap="$3">
              <XStack
                gap="$2"
                items="center"
                justify="space-between"
              >
                <H1>Dashboard</H1>
                {/* Mobile button - icon only */}
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={refreshWidgets}
                  disabled={refreshing}
                  icon={
                    <RefreshCw
                      size={16}
                      color="$color11"
                    />
                  }
                  pressStyle={{ scale: 0.95 }}
                  display="flex"
                  $md={{ display: 'none' }}
                />

                {/* Desktop button - icon + text */}
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={refreshWidgets}
                  disabled={refreshing}
                  icon={
                    <RefreshCw
                      size={16}
                      color="$color11"
                    />
                  }
                  pressStyle={{ scale: 0.95 }}
                  px="$3"
                  display="none"
                  $md={{ display: 'flex' }}
                >
                  <Paragraph
                    size="$3"
                    color="$color11"
                  >
                    Refresh
                  </Paragraph>
                </Button>
              </XStack>
              <Paragraph color="$color10">
                Welcome back, {currentUser?.name || getUserDisplayName()}! Here's your financial
                overview.
              </Paragraph>
            </YStack>

            {/* Desktop layout - 2x2 grid */}
            <YStack gap="$6">
              {/* First Row */}
              <XStack
                gap="$4"
                flexDirection="column"
                $md={{ flexDirection: 'row' }}
              >
                {/* Left Column - Workspaces Section */}
                <YStack
                  flex={1}
                  gap="$4"
                  $md={{ width: '50%' }}
                >
                  <AdminWorkspacesWidget
                    selectedWorkspaces={selectedWorkspaces}
                    onWorkspaceSelectionChange={handleWorkspaceSelectionChange}
                    onWorkspaceRename={handleRenameIndividualWorkspace}
                    onCreateWorkspace={() => setCreateWorkspaceDialogOpen(true)}
                    onDeleteWorkspaces={handleDeleteWorkspaces}
                  />
                </YStack>

                {/* Right Column - Awaiting Review */}
                <YStack
                  flex={1}
                  gap="$4"
                  $md={{ width: '50%' }}
                >
                  <AwaitingReviewWidget />
                </YStack>
              </XStack>

              {/* Second Row */}
              <XStack
                gap="$4"
                flexDirection="column"
                $md={{ flexDirection: 'row' }}
              >
                {/* Left Column - Recent Expenses */}
                <YStack
                  flex={1}
                  gap="$4"
                  $md={{ width: '50%' }}
                >
                  <RecentExpensesWidget />
                </YStack>

                {/* Right Column - Shared Categories */}
                <YStack
                  flex={1}
                  gap="$4"
                  $md={{ width: '50%' }}
                >
                  <SharedCategoriesWidget onRefresh={refreshWidgets} />
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
        <Footer />
      </RefreshableScrollView>
    </YStack>
  )
}

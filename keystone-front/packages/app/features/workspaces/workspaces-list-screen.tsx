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
  Text,
} from '@my/ui'
import {
  ChevronLeft,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Trash,
  Edit3,
  Check,
} from '@tamagui/lucide-icons'
import { useRouter } from 'solito/navigation'
import { useMemo, useRef, useState, useCallback } from 'react'
import { deleteReport, updateReport, getReportRootCategory } from '../../utils/api'
import { useWorkspaces } from '../../utils/queries.optimized'
import type { Workspace } from '../../types'
import { useAuth } from '../../provider/AuthProvider'
import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '../../utils/queries.optimized'
import { LoginScreen } from '../auth/LoginScreen'
import { NavigationBar } from '../../components/NavigationBar'
import { Footer } from 'app/components/Footer'
import { RefreshableScrollView } from '../../components/RefreshableScrollView'
import { UserMenu } from '../../components/UserMenu'
import { formatCurrency } from '../../utils/currency'
import { BackButton } from 'app/components/BackButton'
import { useScreenTopPadding } from '../../hooks/useSafeAreaPadding'
import { Platform } from 'react-native'

export function WorkspacesListScreen() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const screenTopPadding = useScreenTopPadding()
  const [refreshing, setRefreshing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Uncontrolled search input
  const searchQueryRef = useRef('')
  const [searchUiTick, setSearchUiTick] = useState(0)
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestSearchUiUpdate = () => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current)
    searchDebounceTimer.current = setTimeout(() => setSearchUiTick((t) => t + 1), 120)
  }
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<number>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameLoading, setRenameLoading] = useState(false)
  // Uncontrolled rename input
  const renameNameRef = useRef('')
  const [renameUiTick, setRenameUiTick] = useState(0)
  const [renameInputResetKey, setRenameInputResetKey] = useState(0)
  const renameDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRenameUiUpdate = () => {
    if (renameDebounceTimer.current) clearTimeout(renameDebounceTimer.current)
    renameDebounceTimer.current = setTimeout(() => setRenameUiTick((t) => t + 1), 120)
  }

  const {
    data: workspaces = [],
    isLoading: loading,
    error,
    refetch: refetchWorkspaces,
  } = useWorkspaces({
    enabled: !!user && !!userProfile && !authLoading,
  })

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchWorkspaces()
    } finally {
      setRefreshing(false)
    }
  }, [refetchWorkspaces])

  // Fetch root category for each workspace using useQueries
  const rootCategoryQueries = useQueries({
    queries: workspaces.map((workspace) => ({
      queryKey: [...queryKeys.reports(), workspace.id, 'root-category'],
      queryFn: async ({ signal }) => {
        const response = await getReportRootCategory(workspace.id.toString(), signal)
        return (response as any).data?.category
      },
      enabled: !!workspace.id,
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Retry failed queries 2 times
      retry: 2,
    })),
  })

  // Create a map of workspace ID to root category ID for easy lookup
  const workspaceRootCategoryMap = useMemo(() => {
    const map: Record<number, number | undefined> = {}
    workspaces.forEach((workspace, index) => {
      const rootCategoryQuery = rootCategoryQueries[index]
      map[workspace.id] = rootCategoryQuery.data?.id
    })
    return map
  }, [workspaces, rootCategoryQueries])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQueryRef.current.toLowerCase())
  )

  const toggleWorkspaceSelection = (workspaceId: number) => {
    const newSelected = new Set(selectedWorkspaces)
    if (newSelected.has(workspaceId)) {
      newSelected.delete(workspaceId)
    } else {
      newSelected.add(workspaceId)
    }
    setSelectedWorkspaces(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedWorkspaces.size === filteredWorkspaces.length && filteredWorkspaces.length > 0) {
      setSelectedWorkspaces(new Set())
    } else {
      setSelectedWorkspaces(new Set(filteredWorkspaces.map((workspace) => workspace.id)))
    }
  }

  const handleBulkDelete = async () => {
    try {
      setBulkDeleteLoading(true)

      // Delete each selected workspace
      const deletePromises = Array.from(selectedWorkspaces).map((workspaceId) =>
        deleteReport(workspaceId)
      )

      await Promise.all(deletePromises)

      // Refresh the workspaces list
      refetchWorkspaces()
      setSelectedWorkspaces(new Set())
      setSelectionMode(false)
      setShowBulkDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting workspaces:', error)
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const handleRenameWorkspace = async () => {
    if (selectedWorkspaces.size !== 1) return

    const workspaceId = Array.from(selectedWorkspaces)[0]
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (!workspace) return

    try {
      setRenameLoading(true)
      const name = renameNameRef.current.trim()
      if (!name) return
      await updateReport(workspaceId, name)

      // Refresh the workspaces list
      refetchWorkspaces()
      setSelectedWorkspaces(new Set())
      setSelectionMode(false)
      setShowRenameDialog(false)
      renameNameRef.current = ''
      setRenameInputResetKey((k) => k + 1)
    } catch (error) {
      console.error('Error renaming workspace:', error)
    } finally {
      setRenameLoading(false)
    }
  }

  const enterSelectionMode = () => {
    setSelectionMode(true)
    setSelectedWorkspaces(new Set())
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedWorkspaces(new Set())
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

  const renderWorkspaceItem = (workspace: Workspace) => (
    <Card
      key={workspace.id}
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
            // Navigate to the category detail screen for the root category of the workspace
            const rootCategoryId = workspaceRootCategoryMap[workspace.id]
            if (rootCategoryId) {
              router.push(`/category/${rootCategoryId}`)
            } else {
              // Fallback to workspace ID if root category ID is not available
              router.push(`/category/${workspace.id}`)
            }
          }
        }}
        cursor="pointer"
      >
        {/* Checkbox for selection mode */}
        {selectionMode && (
          <XStack
            onPress={(e) => {
              e?.stopPropagation?.()
              toggleWorkspaceSelection(workspace.id)
            }}
            mr="$3"
            cursor="pointer"
            pointerEvents="box-only"
          >
            <Checkbox
              id={`workspace-${workspace.id}`}
              checked={!!selectedWorkspaces.has(workspace.id)}
              onCheckedChange={() => toggleWorkspaceSelection(workspace.id)}
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
            {workspace.name}
          </Paragraph>
          <Paragraph
            size="$3"
            color="$color10"
          >
            {formatDate(workspace.createdAt)}
          </Paragraph>
          <XStack
            gap="$3"
            items="center"
          >
            <Paragraph
              size="$3"
              color="$color10"
            >
              {(workspace.categoriesCount || 0).toString()} categories
            </Paragraph>
            <Paragraph
              size="$3"
              color="$color8"
            >
              •
            </Paragraph>
            <Paragraph
              size="$3"
              color="$color10"
            >
              {(workspace.expensesCount || 0).toString()} expenses
            </Paragraph>
          </XStack>
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
            Loading workspaces...
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
          <H3 color="$red10">Error Loading Workspaces</H3>
          <Paragraph
            color="$red10"
            text="center"
          >
            {error?.message || 'Failed to load workspaces'}
          </Paragraph>
          <Button
            onPress={() => refetchWorkspaces()}
            variant="outlined"
          >
            Try Again
          </Button>
        </YStack>
      )
    }

    if (filteredWorkspaces.length === 0) {
      return (
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$3"
        >
          <Briefcase
            size={64}
            color="$color8"
          />
          <H3 color="$color11">
            {searchQueryRef.current ? 'No matching workspaces' : 'No workspaces yet'}
          </H3>
          <Paragraph
            color="$color10"
            text="center"
          >
            {searchQueryRef.current
              ? 'Try adjusting your search terms'
              : 'Your workspaces will appear here'}
          </Paragraph>
          {!searchQueryRef.current && (
            <Button
              onPress={() => router.push('/home')}
              icon={Plus}
            >
              Create First Workspace
            </Button>
          )}
        </YStack>
      )
    }

    return <YStack gap="$2">{filteredWorkspaces.map(renderWorkspaceItem)}</YStack>
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
            {Platform.OS === 'web' ? (
              <BackButton />
            ) : !selectionMode ? (
              <Button
                onPress={enterSelectionMode}
                icon={Check}
                size="$3"
                variant="outlined"
              >
                Select
              </Button>
            ) : (
              <YStack />
            )}

            <XStack gap="$2">
              {!selectionMode ? (
                <>
                  {Platform.OS === 'web' && (
                    <Button
                      onPress={enterSelectionMode}
                      icon={Check}
                      size="$3"
                      variant="outlined"
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    onPress={() => router.push('/home')}
                    icon={Plus}
                    size="$3"
                  >
                    New Workspace
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onPress={exitSelectionMode}
                    size="$3"
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                  {selectedWorkspaces.size === 1 && (
                    <Button
                      onPress={() => {
                        const workspaceId = Array.from(selectedWorkspaces)[0]
                        const workspace = workspaces.find((w) => w.id === workspaceId)
                        if (workspace) {
                          renameNameRef.current = workspace.name
                          setRenameInputResetKey((k) => k + 1)
                          setShowRenameDialog(true)
                        }
                      }}
                      icon={Edit3}
                      size="$3"
                    >
                      Rename
                    </Button>
                  )}
                  {selectedWorkspaces.size > 0 && (
                    <Button
                      onPress={() => setShowBulkDeleteDialog(true)}
                      icon={Trash}
                      theme="red"
                      size="$3"
                      disabled={bulkDeleteLoading}
                    >
                      Delete ({selectedWorkspaces.size.toString()})
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
            <H2 size="$8">My Workspaces</H2>
            <Paragraph
              size="$4"
              color="$color10"
            >
              {workspaces.length.toString()} total workspaces
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
                id="select-all-workspaces"
                checked={
                  selectedWorkspaces.size === filteredWorkspaces.length &&
                  filteredWorkspaces.length > 0
                }
                onCheckedChange={toggleSelectAll}
              >
                <Checkbox.Indicator>
                  <Check />
                </Checkbox.Indicator>
              </Checkbox>
              <Paragraph>Select all workspaces</Paragraph>
            </XStack>
          )}

          {/* Search Bar */}
          <XStack
            gap="$3"
            mb="$4"
          >
            <Input
              flex={1}
              placeholder="Search workspaces..."
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
            <H4>Delete Workspaces</H4>
            <Paragraph color="$color11">
              Are you sure you want to delete {selectedWorkspaces.size.toString()} workspace
              {selectedWorkspaces.size > 1 ? 's' : ''}? This action cannot be undone and will delete
              all associated categories and expenses.
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
                onPress={handleBulkDelete}
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

      {/* Rename Workspace Dialog */}
      <Sheet
        modal
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
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
            <H4>Rename Workspace</H4>
            <TextArea
              key={`rename-${renameInputResetKey}`}
              placeholder="Enter new workspace name..."
              defaultValue={renameNameRef.current}
              onChangeText={(text) => {
                renameNameRef.current = text
                requestRenameUiUpdate()
              }}
              size="$4"
              minH={80}
            />

            <XStack
              gap="$3"
              justify="flex-end"
              pt="$2"
            >
              <Button
                variant="outlined"
                disabled={renameLoading}
                onPress={() => {
                  setShowRenameDialog(false)
                  renameNameRef.current = ''
                  setRenameInputResetKey((k) => k + 1)
                }}
                flex={1}
              >
                Cancel
              </Button>

              <Button
                onPress={handleRenameWorkspace}
                disabled={renameLoading || !renameNameRef.current.trim()}
                icon={renameLoading ? Spinner : Edit3}
                flex={1}
              >
                {renameLoading ? 'Renaming...' : 'Rename'}
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

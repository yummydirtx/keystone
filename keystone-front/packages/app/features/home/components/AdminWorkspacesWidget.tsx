import {
  Paragraph,
  XStack,
  YStack,
  Checkbox,
  DashboardWidget,
  DashboardWidgetItem,
  AdaptiveActionButton,
} from '@my/ui'
import { Briefcase, Check, Edit3, PlusCircle, Trash2 } from '@tamagui/lucide-icons'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../provider/AuthProvider'
import { useWorkspaces } from '../../../utils/queries.optimized'
import { type Workspace, Category } from '../../../types'
import { useRouter } from 'solito/navigation'
import { formatDate } from '../utils/formatDate'
import { formatCurrency } from '../../../utils/currency'
import { useWorkspaceBudgets } from '../hooks/useWorkspaceBudgets'

interface AdminWorkspacesWidgetProps {
  selectedWorkspaces: number[]
  onWorkspaceSelectionChange: (workspaceId: number, selected: boolean) => void
  onWorkspaceRename?: (workspace: WorkspaceWithBudget) => void
  onCreateWorkspace?: () => void
  onDeleteWorkspaces?: () => void
}

interface WorkspaceWithBudget extends Workspace {
  rootCategoryBudget?: string
  rootCategoryId?: number
}

export const AdminWorkspacesWidget = ({
  selectedWorkspaces,
  onWorkspaceSelectionChange,
  onWorkspaceRename,
  onCreateWorkspace,
  onDeleteWorkspaces,
}: AdminWorkspacesWidgetProps) => {
  const { userProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const {
    data: allWorkspaces = [],
    isLoading: workspacesLoading,
    error: workspacesError,
  } = useWorkspaces({
    enabled: !!userProfile,
  })

  // Filter admin workspaces and limit to 3 most recent
  const adminWorkspaces = allWorkspaces
    .filter((workspace) => userProfile && workspace.owner.id === userProfile.id)
    .slice(0, 3)

  // Use custom hook to get workspaces with budgets
  const {
    workspacesWithBudgets,
    isLoading: budgetsLoading,
    error: budgetsError,
  } = useWorkspaceBudgets(adminWorkspaces)

  // Combine loading and error states
  const isLoading = workspacesLoading || budgetsLoading
  const combinedError = error || workspacesError || budgetsError

  const handleWorkspacePress = async (workspace: WorkspaceWithBudget) => {
    // Navigate to the category detail screen for the root category of the workspace
    if (workspace.rootCategoryId) {
      router.push(`/category/${workspace.rootCategoryId}`)
    } else {
      // Fallback to workspace ID if root category ID is not available
      router.push(`/category/${workspace.id}`)
    }
  }

  const renderHeaderActions = () => {
    return (
      <>
        {onCreateWorkspace && (
          <AdaptiveActionButton
            icon={PlusCircle}
            text="New Workspace"
            onPress={onCreateWorkspace}
            iconColor="$green10"
            textColor="$green10"
            buttonProps={{ pressStyle: { scale: 0.95 } }}
            aria-label="Create new workspace"
          />
        )}
        {onDeleteWorkspaces && (
          <AdaptiveActionButton
            icon={Trash2}
            text="Delete"
            iconColor="$red10"
            textColor="$red10"
            onPress={onDeleteWorkspaces}
            aria-label="Delete selected workspaces"
          />
        )}
      </>
    )
  }

  const renderSelectAllRow = () => {
    if (workspacesWithBudgets.length <= 1) return null

    const allSelected =
      workspacesWithBudgets.length > 0 &&
      workspacesWithBudgets.every((workspace) => selectedWorkspaces.includes(workspace.id))
    const someSelected = selectedWorkspaces.length > 0

    return (
      <XStack
        p="$3"
        items="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              workspacesWithBudgets.forEach((workspace) => {
                if (!selectedWorkspaces.includes(workspace.id)) {
                  onWorkspaceSelectionChange(workspace.id, true)
                }
              })
            } else {
              selectedWorkspaces.forEach((workspaceId) => {
                onWorkspaceSelectionChange(workspaceId, false)
              })
            }
          }}
        >
          <Checkbox.Indicator>
            <Check />
          </Checkbox.Indicator>
        </Checkbox>
        <YStack flex={1}>
          <Paragraph
            size="$3"
            color="$color10"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
            {someSelected && !allSelected && ` (${selectedWorkspaces.length} selected)`}
          </Paragraph>
        </YStack>
      </XStack>
    )
  }

  const renderWorkspaceItems = () => {
    if (workspacesWithBudgets.length === 0) {
      return null // Let the empty state handle this
    }

    return (
      <>
        {renderSelectAllRow()}
        {workspacesWithBudgets.map((workspace, index) => {
          let checkboxPressed = false

          return (
            <DashboardWidgetItem
              key={workspace.id}
              onPress={() => {
                if (!checkboxPressed) {
                  handleWorkspacePress(workspace)
                }
                checkboxPressed = false
              }}
              showSeparator={index < workspacesWithBudgets.length - 1}
              showChevron={true}
            >
              <XStack
                gap="$3"
                items="center"
                flex={1}
              >
                <XStack
                  onPress={() => {
                    checkboxPressed = true
                  }}
                >
                  <Checkbox
                    id={`workspace-${workspace.id}`}
                    checked={selectedWorkspaces.includes(workspace.id)}
                    onCheckedChange={(checked) =>
                      onWorkspaceSelectionChange(workspace.id, !!checked)
                    }
                  >
                    <Checkbox.Indicator>
                      <Check />
                    </Checkbox.Indicator>
                  </Checkbox>
                </XStack>
                <YStack
                  flex={1}
                  cursor="pointer"
                >
                  <XStack
                    items="center"
                    gap="$2"
                  >
                    <Paragraph
                      fontWeight="600"
                      color="$color12"
                    >
                      {workspace.name}
                    </Paragraph>
                    {onWorkspaceRename && (
                      <AdaptiveActionButton
                        icon={Edit3}
                        text="Edit"
                        size="$2"
                        onPress={(e) => {
                          e?.stopPropagation?.()
                          onWorkspaceRename(workspace)
                        }}
                        buttonProps={{
                          onPress: (e: any) => {
                            e.stopPropagation()
                            onWorkspaceRename(workspace)
                          },
                        }}
                        aria-label="Edit workspace name"
                      />
                    )}
                  </XStack>
                  <XStack
                    gap="$3"
                    items="center"
                    mt="$1"
                  >
                    <Paragraph
                      size="$3"
                      color="$color10"
                    >
                      Created {formatDate(workspace.createdAt)}
                    </Paragraph>
                  </XStack>
                  {workspace.rootCategoryBudget && Number(workspace.rootCategoryBudget) > 0 && (
                    <Paragraph
                      size="$3"
                      color="$color10"
                    >
                      Budget: {formatCurrency(Number(workspace.rootCategoryBudget))}
                    </Paragraph>
                  )}
                </YStack>
              </XStack>
            </DashboardWidgetItem>
          )
        })}
      </>
    )
  }

  return (
    <DashboardWidget
      title="Your Workspaces"
      icon={Briefcase}
      iconColor="$blue10"
      headerActions={renderHeaderActions()}
      isLoading={isLoading}
      error={combinedError}
      emptyState={{
        icon: Briefcase,
        title: 'No workspaces created yet',
        description: 'Your workspaces will appear here',
      }}
      viewAllButton={{
        label: `View All (${allWorkspaces.length})`,
        onPress: () => router.push('/workspaces'),
      }}
    >
      {renderWorkspaceItems()}
    </DashboardWidget>
  )
}

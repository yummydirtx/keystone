import { Button, XStack, Spinner, Dialog, Input, Fieldset, Label } from '@my/ui'
import React, { useState, useEffect } from 'react'
import { useUpdateReport, useUpdateCategory, useCategories } from '../../../utils/queries.optimized'
import type { Workspace } from '../../../types'

interface RenameWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceRenamed?: () => void
  workspaceToRename: (Workspace & { rootCategoryId?: number }) | null
}

export const RenameWorkspaceDialog = ({
  isOpen,
  onClose,
  onWorkspaceRenamed,
  workspaceToRename,
}: RenameWorkspaceDialogProps) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const { mutateAsync: updateReport, isPending: isUpdatingWorkspace } = useUpdateReport()
  const { mutateAsync: updateCategory } = useUpdateCategory()
  const { data: categoriesData } = useCategories(workspaceToRename?.id.toString() || '', {
    enabled: !!workspaceToRename,
  })

  // Set initial name when dialog opens or workspace changes
  useEffect(() => {
    if (isOpen && workspaceToRename) {
      setNewWorkspaceName(workspaceToRename.name)
    }
  }, [isOpen, workspaceToRename])

  const handleRenameWorkspace = async () => {
    if (!newWorkspaceName.trim() || !workspaceToRename) {
      return
    }

    // Don't make API call if name hasn't changed
    if (newWorkspaceName.trim() === workspaceToRename.name) {
      onClose()
      return
    }

    try {
      // First, update the workspace name
      await updateReport({ id: workspaceToRename.id, name: newWorkspaceName.trim() })

      // Then find and update the root category name to match
      try {
        const categories = categoriesData || []
        const rootCategory = categories.find(
          (c: any) => c.name === workspaceToRename.name && !c.parentCategoryId
        )

        if (rootCategory) {
          // Update the root category name to match the new workspace name
          await updateCategory({
            id: rootCategory.id.toString(),
            data: {
              name: newWorkspaceName.trim(),
            },
          })
        }
      } catch (categoryError) {
        console.error('Failed to update root category name:', categoryError)
        // Continue despite category update failure - the workspace name was still updated
      }

      onClose()
      onWorkspaceRenamed?.()
    } catch (error) {
      console.error('Failed to rename workspace:', error)
      // TODO: Show error toast/notification
    }
  }

  const handleClose = () => {
    setNewWorkspaceName('')
    onClose()
  }

  const isNameChanged =
    newWorkspaceName.trim() !== workspaceToRename?.name && newWorkspaceName.trim() !== ''

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={handleClose}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          opacity={0.5}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          p="$6"
          gap="$4"
        >
          <Dialog.Title>Rename Workspace</Dialog.Title>
          <Dialog.Description>Enter a new name for "{workspaceToRename?.name}".</Dialog.Description>
          <Fieldset>
            <Label htmlFor="new-workspace-name">New Workspace Name</Label>
            <Input
              id="new-workspace-name"
              value={newWorkspaceName}
              onChangeText={setNewWorkspaceName}
              placeholder="Enter new workspace name"
            />
          </Fieldset>
          <XStack
            justify="flex-end"
            gap="$3"
          >
            <Dialog.Close asChild>
              <Button variant="outlined">Cancel</Button>
            </Dialog.Close>
            <Button
              theme="blue"
              onPress={handleRenameWorkspace}
              disabled={isUpdatingWorkspace || !isNameChanged}
              icon={isUpdatingWorkspace ? <Spinner /> : undefined}
            >
              {isUpdatingWorkspace ? 'Renaming...' : 'Rename'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

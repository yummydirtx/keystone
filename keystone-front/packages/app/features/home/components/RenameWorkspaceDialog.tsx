import { Button, YStack, H2, Sheet, Input, Label, XStack, Spinner } from '@my/ui'
import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
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
  // Uncontrolled input to reduce per-keystroke re-rendering
  const nameRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }
  const { mutateAsync: updateReport, isPending: isUpdatingWorkspace } = useUpdateReport()
  const { mutateAsync: updateCategory } = useUpdateCategory()
  const { data: categoriesData } = useCategories(workspaceToRename?.id.toString() || '', {
    enabled: !!workspaceToRename,
  })

  // Set initial name when dialog opens or workspace changes
  useEffect(() => {
    if (isOpen && workspaceToRename) {
      nameRef.current = workspaceToRename.name
      setInputResetKey((k) => k + 1)
      requestUiUpdate()
    }
  }, [isOpen, workspaceToRename])

  const handleRenameWorkspace = async () => {
    const name = nameRef.current.trim()
    if (!name || !workspaceToRename) {
      return
    }

    // Don't make API call if name hasn't changed
    if (name === workspaceToRename.name) {
      onClose()
      return
    }

    try {
      // First, update the workspace name
      await updateReport({ id: workspaceToRename.id, name })

      // Then find and update the root category name to match
      try {
        const categories = categoriesData || []

        // Find the root category (no parentCategory)
        const rootCategory = categories.find((category) => !category.parentCategory)

        if (rootCategory) {
          // Update the root category name to match the workspace name
          await updateCategory({
            id: rootCategory.id.toString(),
            data: {
              name,
              budget: rootCategory.budget ? Number.parseFloat(rootCategory.budget) : undefined,
            },
          })
        }
      } catch (categoryError) {
        console.error('Failed to update root category:', categoryError)
        // Don't throw here as the workspace was successfully renamed
      }

      onClose()
      onWorkspaceRenamed?.()
    } catch (error) {
      console.error('Failed to rename workspace:', error)
    }
  }

  const handleClose = () => {
    nameRef.current = workspaceToRename?.name || ''
    setInputResetKey((k) => k + 1)
    requestUiUpdate()
    onClose()
  }

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      moveOnKeyboardChange
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame p="$4">
        <Sheet.Handle />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <YStack gap="$4">
            <H2 size="$6">Rename Workspace</H2>

            <YStack gap="$2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                key={`name-${inputResetKey}`}
                id="workspace-name"
                placeholder="Enter workspace name"
                defaultValue={nameRef.current}
                onChangeText={(text) => {
                  nameRef.current = text
                  requestUiUpdate()
                }}
              />
            </YStack>

            <XStack
              justify="flex-end"
              gap="$3"
              pt="$2"
            >
              <Button
                variant="outlined"
                onPress={handleClose}
                disabled={isUpdatingWorkspace}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                onPress={handleRenameWorkspace}
                disabled={
                  isUpdatingWorkspace ||
                  !nameRef.current.trim() ||
                  nameRef.current.trim() === workspaceToRename?.name
                }
                opacity={isUpdatingWorkspace ? 0.5 : 1}
                theme="blue"
                flex={1}
                icon={isUpdatingWorkspace ? <Spinner size="small" /> : undefined}
              >
                {isUpdatingWorkspace ? 'Renaming...' : 'Rename'}
              </Button>
            </XStack>
          </YStack>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  )
}

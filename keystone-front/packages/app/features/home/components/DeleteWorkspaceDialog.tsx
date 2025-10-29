import { Button, XStack, Spinner, Dialog, Paragraph } from '@my/ui'
import React, { useState } from 'react'
import { useDeleteReport } from '../../../utils/queries.optimized'
import type { Workspace } from '../../../types'

interface DeleteWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceDeleted?: () => void
  workspacesToDelete: Workspace[]
}

export const DeleteWorkspaceDialog = ({
  isOpen,
  onClose,
  onWorkspaceDeleted,
  workspacesToDelete,
}: DeleteWorkspaceDialogProps) => {
  const { mutateAsync: deleteReport, isPending: isDeleting } = useDeleteReport()

  const handleDeleteWorkspaces = async () => {
    try {
      // Delete all selected workspaces
      await Promise.all(workspacesToDelete.map((workspace) => deleteReport(workspace.id)))
      onClose()
      onWorkspaceDeleted?.()
    } catch (error) {
      console.error('Failed to delete workspaces:', error)
      // TODO: Show error toast/notification
    }
  }

  const handleClose = () => {
    onClose()
  }

  const workspaceCount = workspacesToDelete.length
  const isMultiple = workspaceCount > 1

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
          <Dialog.Title>Delete Workspace{isMultiple ? 's' : ''}</Dialog.Title>
          <Dialog.Description>
            {isMultiple
              ? `Are you sure you want to delete these ${workspaceCount} workspaces? This action cannot be undone and will permanently delete all categories and expenses within these workspaces.`
              : `Are you sure you want to delete "${workspacesToDelete[0]?.name}"? This action cannot be undone and will permanently delete all categories and expenses within this workspace.`}
          </Dialog.Description>

          {workspacesToDelete.length > 0 && (
            <Paragraph
              size="$3"
              color="$color10"
            >
              {isMultiple ? 'Workspaces to delete:' : 'Workspace to delete:'}
            </Paragraph>
          )}

          {workspacesToDelete.map((workspace) => (
            <Paragraph
              key={workspace.id}
              size="$3"
              fontWeight="600"
              color="$red10"
            >
              • {workspace.name}
            </Paragraph>
          ))}

          <XStack
            justify="flex-end"
            gap="$3"
            mt="$4"
          >
            <Dialog.Close asChild>
              <Button variant="outlined">Cancel</Button>
            </Dialog.Close>
            <Button
              theme="red"
              onPress={handleDeleteWorkspaces}
              disabled={isDeleting}
              icon={isDeleting ? <Spinner /> : undefined}
            >
              {isDeleting ? 'Deleting...' : `Delete ${isMultiple ? 'Workspaces' : 'Workspace'}`}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

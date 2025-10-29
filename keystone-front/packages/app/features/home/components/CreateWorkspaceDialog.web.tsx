import { Button, XStack, Spinner, Dialog, Input, Fieldset, Label } from '@my/ui'
import React, { useState } from 'react'
import { useCreateReport } from '../../../utils/queries.optimized'

interface CreateWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceCreated?: () => void
}

export const CreateWorkspaceDialog = ({
  isOpen,
  onClose,
  onWorkspaceCreated,
}: CreateWorkspaceDialogProps) => {
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [budget, setBudget] = useState('')
  const { mutateAsync: createReport, isPending: isCreatingWorkspace } = useCreateReport()

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      return
    }

    // Validate budget if provided
    if (
      budget.trim() !== '' &&
      (Number.isNaN(Number.parseFloat(budget)) || Number.parseFloat(budget) < 0)
    ) {
      console.error('Invalid budget value')
      return
    }

    try {
      const budgetValue = budget.trim() !== '' ? Number.parseFloat(budget) : undefined
      await createReport({ name: newWorkspaceName, budget: budgetValue })

      setNewWorkspaceName('')
      setBudget('')
      onClose()
      onWorkspaceCreated?.()
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleClose = () => {
    setNewWorkspaceName('')
    setBudget('')
    onClose()
  }

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={handleClose}
      disableRemoveScroll
    >
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          opacity={0.5}
          style={{
            backdropFilter: 'blur(8px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100000,
          }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          p="$6"
          gap="$4"
        >
          <Dialog.Title>Create New Workspace</Dialog.Title>
          <Dialog.Description>
            Enter a name for your new workspace and optionally set a budget for the root category.
          </Dialog.Description>
          <Fieldset>
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={newWorkspaceName}
              onChangeText={setNewWorkspaceName}
              placeholder="e.g., Q3 Team Budget"
            />
          </Fieldset>
          <Fieldset>
            <Label htmlFor="budget">Workspace Budget (optional)</Label>
            <Input
              id="budget"
              value={budget}
              onChangeText={setBudget}
              placeholder="0.00"
              keyboardType="numeric"
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
              onPress={handleCreateWorkspace}
              disabled={
                isCreatingWorkspace ||
                !newWorkspaceName.trim() ||
                (budget.trim() !== '' &&
                  (Number.isNaN(Number.parseFloat(budget)) || Number.parseFloat(budget) < 0))
              }
              icon={isCreatingWorkspace ? <Spinner /> : undefined}
            >
              Create
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

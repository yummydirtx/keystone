import { Button, YStack, H2, Sheet, Input, Label, XStack, Spinner } from '@my/ui'
import { useRef, useState } from 'react'
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
  // Use uncontrolled inputs with refs to avoid re-rendering on each keystroke
  const nameRef = useRef('')
  const budgetRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  // Debounced tick to update UI elements (e.g., disabled state) without per-keystroke re-rendering
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }
  const { mutateAsync: createReport, isPending: isCreatingWorkspace } = useCreateReport()

  const handleCreateWorkspace = async () => {
    const name = nameRef.current.trim()
    const budgetStr = budgetRef.current.trim()
    if (!name) {
      return
    }

    // Validate budget if provided
    if (
      budgetStr !== '' &&
      (Number.isNaN(Number.parseFloat(budgetStr)) || Number.parseFloat(budgetStr) < 0)
    ) {
      console.error('Invalid budget value')
      return
    }

    try {
      const budgetValue = budgetStr !== '' ? Number.parseFloat(budgetStr) : undefined
      await createReport({ name, budget: budgetValue })

      nameRef.current = ''
      budgetRef.current = ''
      setInputResetKey((k) => k + 1)
      onClose()
      onWorkspaceCreated?.()
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleClose = () => {
    nameRef.current = ''
    budgetRef.current = ''
    setInputResetKey((k) => k + 1)
    onClose()
  }

  const isDisabled =
    isCreatingWorkspace ||
    !nameRef.current.trim() ||
    (budgetRef.current.trim() !== '' &&
      (Number.isNaN(Number.parseFloat(budgetRef.current)) ||
        Number.parseFloat(budgetRef.current) < 0))

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      snapPoints={[50, 85]}
      dismissOnSnapToBottom
      moveOnKeyboardChange
    >
      <Sheet.Frame
        p="$4"
        gap="$4"
      >
        <Sheet.Handle />
        <H2>Create New Workspace</H2>

        <YStack gap="$3">
          <YStack gap="$2">
            <Label>Workspace Name</Label>
            <Input
              key={`name-${inputResetKey}`}
              placeholder="e.g., Q3 Team Budget"
              defaultValue=""
              onChangeText={(text) => {
                nameRef.current = text
                requestUiUpdate()
              }}
            />
          </YStack>

          <YStack gap="$2">
            <Label>Workspace Budget (optional)</Label>
            <Input
              key={`budget-${inputResetKey}`}
              placeholder="0.00"
              defaultValue=""
              onChangeText={(text) => {
                budgetRef.current = text
                requestUiUpdate()
              }}
              keyboardType="numeric"
            />
          </YStack>

          <XStack
            gap="$2"
            justify="flex-end"
          >
            <Button
              variant="outlined"
              onPress={handleClose}
              disabled={isCreatingWorkspace}
            >
              Cancel
            </Button>
            <Button
              theme="blue"
              onPress={handleCreateWorkspace}
              disabled={isDisabled}
              icon={isCreatingWorkspace ? <Spinner /> : undefined}
            >
              Create
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

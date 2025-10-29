import { Button, YStack, H2, Sheet, Input, Label, XStack } from '@my/ui'
import { Plus } from '@tamagui/lucide-icons'
import { useRef, useState } from 'react'

interface CreateCategorySheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateCategory: (name: string, budget: number) => Promise<void>
  creating: boolean
  title?: string
}

export function CreateCategorySheet({
  isOpen,
  onOpenChange,
  onCreateCategory,
  creating,
  title = 'Create New Category',
}: CreateCategorySheetProps) {
  // Use uncontrolled inputs to reduce re-renders on Native
  const nameRef = useRef('')
  const budgetRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }

  const handleCreate = async () => {
    const name = nameRef.current.trim()
    const budgetStr = budgetRef.current.trim()
    if (!name) return

    // Make budget optional - default to 0 if empty or invalid
    let budget = 0
    if (budgetStr !== '') {
      const parsedBudget = Number.parseFloat(budgetStr)
      if (!Number.isNaN(parsedBudget) && parsedBudget >= 0) {
        budget = parsedBudget
      } else {
        // Invalid budget value, don't proceed
        return
      }
    }

    try {
      await onCreateCategory(name, budget)

      // Reset form
      nameRef.current = ''
      budgetRef.current = ''
      setInputResetKey((k) => k + 1)
    } catch (error) {
      // Error will be handled by the parent component
      console.error('Failed to create category:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    nameRef.current = ''
    budgetRef.current = ''
    setInputResetKey((k) => k + 1)
  }

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[50, 85]}
      dismissOnSnapToBottom
      moveOnKeyboardChange
    >
      <Sheet.Frame
        p="$4"
        gap="$4"
      >
        <Sheet.Handle />

        {/* Header */}
        <XStack
          items="center"
          gap="$2"
        >
          <Plus size={20} />
          <H2>{title}</H2>
        </XStack>

        <YStack gap="$3">
          <YStack gap="$2">
            <Label>Category Name</Label>
            <Input
              key={`name-${inputResetKey}`}
              placeholder="Enter category name"
              defaultValue=""
              onChangeText={(text) => {
                nameRef.current = text
                requestUiUpdate()
              }}
            />
          </YStack>

          <YStack gap="$2">
            <Label>Budget ($)</Label>
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
              onPress={handleCancel}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onPress={handleCreate}
              disabled={creating || !nameRef.current.trim()}
              opacity={creating ? 0.5 : 1}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

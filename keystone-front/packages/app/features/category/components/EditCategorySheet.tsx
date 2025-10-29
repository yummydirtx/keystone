import { Button, YStack, H2, Sheet, Input, Label, XStack } from '@my/ui'
import { Edit3 } from '@tamagui/lucide-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category } from '../../../types'

interface EditCategorySheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateCategory: (name: string, budget: number) => Promise<void>
  updating: boolean
  category: Category | null
}

export function EditCategorySheet({
  isOpen,
  onOpenChange,
  onUpdateCategory,
  updating,
  category,
}: EditCategorySheetProps) {
  // Use uncontrolled inputs to reduce per-keystroke re-renders
  const nameRef = useRef('')
  const budgetRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 250)
  }

  const handleNameChange = useCallback((text: string) => {
    nameRef.current = text
    requestUiUpdate()
  }, [])

  const handleBudgetChange = useCallback((text: string) => {
    budgetRef.current = text
    requestUiUpdate()
  }, [])

  // Initialize form with category data when the sheet opens
  useEffect(() => {
    if (isOpen && category) {
      nameRef.current = category.name
      budgetRef.current = category.budget?.toString() || '0'
      setInputResetKey((k) => k + 1)
      requestUiUpdate()
    }
  }, [isOpen, category])

  const handleUpdate = async () => {
    const name = nameRef.current.trim()
    if (!name) return

    const budget = Number.parseFloat(budgetRef.current)
    if (Number.isNaN(budget) || budget < 0) return

    try {
      await onUpdateCategory(name, budget)

      // Don't reset form here - let the parent handle closing
    } catch (error) {
      // Error will be handled by the parent component
      console.error('Failed to update category:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    // Reset form to original values
    if (category) {
      nameRef.current = category.name
      budgetRef.current = category.budget?.toString() || '0'
      setInputResetKey((k) => k + 1)
      requestUiUpdate()
    }
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
          <Edit3 size={20} />
          <H2>Edit Category</H2>
        </XStack>

        <YStack gap="$3">
          <YStack gap="$2">
            <Label>Category Name</Label>
            <Input
              key={`name-${inputResetKey}`}
              placeholder="Enter category name"
              defaultValue={nameRef.current}
              onChangeText={handleNameChange}
            />
          </YStack>

          <YStack gap="$2">
            <Label>Budget ($)</Label>
            <Input
              key={`budget-${inputResetKey}`}
              placeholder="0.00"
              defaultValue={budgetRef.current}
              onChangeText={handleBudgetChange}
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
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onPress={handleUpdate}
              disabled={updating || !nameRef.current.trim() || !budgetRef.current.trim()}
            >
              {updating ? 'Updating...' : 'Update'}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
      <Sheet.Overlay />
    </Sheet>
  )
}

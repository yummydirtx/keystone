import React, { useState, useEffect } from 'react'
import { Card, XStack, YStack, H3, Button, Select, Adapt, Sheet, Paragraph, Spinner, isWeb, ScrollView } from '@my/ui'
import { Tag, ChevronDown, ChevronUp, Check } from '@tamagui/lucide-icons'
import { useAuth } from '../../../provider/AuthProvider'
import { useSubmitterCategories, useUpdateExpense } from '../../../utils/queries.optimized'
import type { Expense, SharedCategory } from '../../../types'
import { useToastController } from '@my/ui'

interface MoveCategoryWidgetProps {
  expense: Expense
  onExpenseUpdate: (updatedExpense: Expense) => void
  canMoveCategory: boolean
}

export function MoveCategoryWidget({ expense, onExpenseUpdate, canMoveCategory }: MoveCategoryWidgetProps) {
  const { user, userProfile, isGuest } = useAuth()
  const toast = useToastController()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    expense.category?.id ? String(expense.category.id) : ''
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Get available categories that user can submit to
  const { data: submitterCategories = [], isLoading: categoriesLoading } = useSubmitterCategories()
  
  // Use mutation hook for updating expense
  const updateExpenseMutation = useUpdateExpense()
  const isLoading = updateExpenseMutation.isPending

  // Update hasChanges when selection changes
  useEffect(() => {
    const currentCategoryId = expense.category?.id ? String(expense.category.id) : ''
    setHasChanges(selectedCategoryId !== currentCategoryId)
  }, [selectedCategoryId, expense.category?.id])

  // Don't show the widget if user can't move categories or is a guest
  if (!canMoveCategory || isGuest) {
    return null
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    if (!isWeb) {
      setSheetOpen(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!hasChanges) return

    try {
      const categoryId = selectedCategoryId ? parseInt(selectedCategoryId) : null
      
      const response = await updateExpenseMutation.mutateAsync({
        id: String(expense.id),
        data: { categoryId: categoryId },
      })

      if (response?.expense) {
        onExpenseUpdate(response.expense)
        toast.show('Category updated successfully', {
          type: 'success',
        })
        setHasChanges(false)
      } else {
        throw new Error('Failed to update expense')
      }
    } catch (error) {
      console.error('Error updating expense category:', error)
      toast.show('Failed to update category', {
        type: 'error',
      })
      // Reset to original category on error
      setSelectedCategoryId(expense.category?.id ? String(expense.category.id) : '')
    }
  }

  const handleCancelChanges = () => {
    setSelectedCategoryId(expense.category?.id ? String(expense.category.id) : '')
    setHasChanges(false)
  }

  // Flatten categories for the select dropdown - only show categories from the same workspace
  const availableCategories = submitterCategories
    .filter((item: SharedCategory) => {
      // Only show categories from the same workspace as the current expense
      const sameWorkspace = item.category.report?.id === expense.report?.id
      // Only show categories that allow user submissions
      const allowsSubmissions = item.category.allow_user_submissions
      return sameWorkspace && allowsSubmissions
    })
    .map((item: SharedCategory) => ({
      id: item.category.id,
      name: item.category.name,
      role: item.role,
    }))

  const selectedCategory = availableCategories.find(cat => String(cat.id) === selectedCategoryId)

  if (categoriesLoading) {
    return (
      <Card p="$4" bg="$background">
        <XStack items="center" gap="$2" mb="$2">
          <Tag size="$1" color="$color11" />
          <H3>Move to Category</H3>
        </XStack>
        <YStack items="center" p="$3">
          <Spinner size="small" />
          <Paragraph size="$3" color="$color10" mt="$2">
            Loading categories...
          </Paragraph>
        </YStack>
      </Card>
    )
  }

  if (availableCategories.length === 0) {
    return (
      <Card p="$4" bg="$background">
        <XStack items="center" gap="$2" mb="$2">
          <Tag size="$1" color="$color11" />
          <H3>Move to Category</H3>
        </XStack>
        <Paragraph size="$3" color="$color10">
          No categories available for moving this expense. Categories must be in the same workspace and allow expense submissions.
        </Paragraph>
      </Card>
    )
  }

  return (
    <>
      <Card p="$4" bg="$background">
        <XStack items="center" gap="$2" mb="$3">
          <Tag size="$1" color="$color11" />
          <H3>Move to Category</H3>
        </XStack>

        <YStack gap="$3">
          <YStack gap="$2">
            <Paragraph size="$3" color="$color10">
              Current: {expense.category?.name || 'No category'}
            </Paragraph>
            <Paragraph size="$2" color="$color9">
              Categories from workspace: {expense.report?.name}
            </Paragraph>
            
            {isWeb ? (
              <Select
                value={selectedCategoryId}
                onValueChange={handleCategoryChange}
              >
                <Select.Trigger width="100%" iconAfter={ChevronDown}>
                  <Select.Value placeholder="Select a category" />
                </Select.Trigger>

                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>

                <Select.Content zIndex={200000}>
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Label>Categories in {expense.report?.name}</Select.Label>
                      {availableCategories.map((category) => (
                        <Select.Item
                          key={category.id}
                          index={category.id}
                          value={String(category.id)}
                        >
                          <Select.ItemText>
                            {category.name}
                          </Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            ) : (
              <Button
                variant="outlined"
                iconAfter={ChevronDown}
                onPress={() => setSheetOpen(true)}
                width="100%"
              >
                {selectedCategory?.name || 'Select a category'}
              </Button>
            )}
          </YStack>

          {hasChanges && (
            <XStack gap="$2" ml="auto">
              <Button
                variant="outlined"
                size="$3"
                onPress={handleCancelChanges}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="$3"
                onPress={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="small" color="white" /> : 'Save'}
              </Button>
            </XStack>
          )}
        </YStack>
      </Card>

      {!isWeb && (
        <Sheet
          modal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
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
            
            <YStack gap="$3">
              <XStack justify="space-between" items="center">
                <H3>Select Category</H3>
                <Button
                  size="$3"
                  circular
                  variant="outlined"
                  icon={ChevronUp}
                  onPress={() => setSheetOpen(false)}
                />
              </XStack>
              
              <Paragraph size="$2" color="$color9" mb="$2">
                Categories in {expense.report?.name}
              </Paragraph>

              <ScrollView height={400} showsVerticalScrollIndicator={false}>
                <YStack gap="$2" pb="$4">
                  {availableCategories.map((category) => {
                    const isSelected = String(category.id) === selectedCategoryId
                    return (
                      <Button
                        key={category.id}
                        variant="outlined"
                        size="$4"
                        onPress={() => handleCategoryChange(String(category.id))}
                        justify="space-between"
                        iconAfter={isSelected ? Check : undefined}
                        bg={isSelected ? "$blue2" : undefined}
                        borderColor={isSelected ? "$blue8" : undefined}
                      >
                        {category.name}
                      </Button>
                    )
                  })}
                </YStack>
              </ScrollView>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      )}
    </>
  )
}
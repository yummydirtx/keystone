import React from 'react'
import { XStack, YStack, Checkbox, Select, Adapt, Sheet, Paragraph, Button } from '@my/ui'
import { Check, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from '@tamagui/lucide-icons'
import type { Expense } from '../../../../types'

interface ExpenseListControlsProps {
  allExpenses: Expense[]
  allSelected: boolean
  selectedExpenses: number[]
  someSelected: boolean
  sortBy: 'date' | 'amount'
  sortDirection: 'asc' | 'desc'
  onExpenseSelectionChange?: (expenseId: number, selected: boolean) => void
  onSortByChange: (value: 'date' | 'amount') => void
  onSortDirectionChange: () => void
}

export function ExpenseListControls({
  allExpenses,
  allSelected,
  selectedExpenses,
  someSelected,
  sortBy,
  sortDirection,
  onExpenseSelectionChange,
  onSortByChange,
  onSortDirectionChange,
}: ExpenseListControlsProps) {
  return (
    <XStack
      px="$3"
      py="$3"
      items="center"
      gap="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      justify="space-between"
    >
      {/* Left side - Select All (only show if selection is enabled) */}
      {onExpenseSelectionChange && allExpenses.length >= 1 && (
        <XStack
          items="center"
          gap="$3"
        >
          <Checkbox
            id="select-all-expenses"
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                allExpenses.forEach((expense) => {
                  if (!selectedExpenses.includes(expense.id)) {
                    onExpenseSelectionChange!(expense.id, true)
                  }
                })
              } else {
                selectedExpenses.forEach((expenseId) => {
                  onExpenseSelectionChange!(expenseId, false)
                })
              }
            }}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
          <YStack
            display="none"
            $lg={{ display: 'flex' }}
          >
            <Paragraph
              size="$3"
              color="$color10"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
              {someSelected && !allSelected && ` (${selectedExpenses.length} selected)`}
            </Paragraph>
          </YStack>
        </XStack>
      )}

      {/* Right side - Sort Controls */}
      <XStack
        items="center"
        gap="$2"
      >
        <Paragraph
          size="$3"
          color="$color10"
        >
          Sort by:
        </Paragraph>

        {/* Sort Type Dropdown */}
        <Select
          value={sortBy}
          onValueChange={(value) => onSortByChange(value as 'date' | 'amount')}
          size="$2"
        >
          <Select.Trigger
            width={85}
            size="$2"
          >
            <Select.Value placeholder="Sort by" />
          </Select.Trigger>

          <Adapt platform="touch">
            <Sheet
              modal
              dismissOnSnapToBottom
              snapPoints={[35, 50]}
              snapPointsMode="percent"
              dismissOnOverlayPress
            >
              <Sheet.Frame>
                <Sheet.Handle />
                <YStack
                  p="$4"
                  gap="$2"
                >
                  <Adapt.Contents />
                </YStack>
              </Sheet.Frame>
              <Sheet.Overlay
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                opacity={0.25}
              />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton>
              <ChevronUp size={20} />
            </Select.ScrollUpButton>

            <Select.Viewport>
              <Select.Group>
                <Select.Label>Sort Options</Select.Label>
                <Select.Item
                  index={0}
                  value="date"
                >
                  <Select.ItemText>Date</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item
                  index={1}
                  value="amount"
                >
                  <Select.ItemText>Amount</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              </Select.Group>
            </Select.Viewport>

            <Select.ScrollDownButton>
              <ChevronDown size={20} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>

        {/* Sort Direction Toggle */}
        <Button
          size="$2"
          variant="outlined"
          onPress={onSortDirectionChange}
          icon={sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          pressStyle={{ scale: 0.95 }}
        >
          <Paragraph
            size="$2"
            color="$color11"
          >
            {sortBy === 'date'
              ? sortDirection === 'desc'
                ? 'Newest'
                : 'Oldest'
              : sortDirection === 'desc'
                ? 'High'
                : 'Low'}
          </Paragraph>
        </Button>
      </XStack>
    </XStack>
  )
}

import React from 'react'
import { YStack, XStack, Separator, Paragraph, AnimatePresence } from '@my/ui'
import { Eye, EyeOff, ChevronUp, ChevronDown } from '@tamagui/lucide-icons'
import type { Expense } from '../../../../types'
import { ExpenseItem } from './ExpenseItem'

interface ProcessedExpensesSectionProps {
  processedExpenses: Expense[]
  showProcessedExpenses: boolean
  onToggleShowProcessed: () => void
  selectedExpenses: number[]
  onExpenseSelectionChange?: (expenseId: number, selected: boolean) => void
  onNavigate: (expenseId: number) => void
}

export function ProcessedExpensesSection({
  processedExpenses,
  showProcessedExpenses,
  onToggleShowProcessed,
  selectedExpenses,
  onExpenseSelectionChange,
  onNavigate,
}: ProcessedExpensesSectionProps) {
  if (processedExpenses.length === 0) {
    return null
  }

  return (
    <>
      <Separator />
      <XStack
        px="$3"
        py="$3"
        justify="space-between"
        items="center"
        pressStyle={{ scale: 0.98 }}
        onPress={onToggleShowProcessed}
        cursor="pointer"
      >
        <XStack
          gap="$2"
          items="center"
        >
          {showProcessedExpenses ? (
            <EyeOff
              size={16}
              color="$color10"
            />
          ) : (
            <Eye
              size={16}
              color="$color10"
            />
          )}
          <Paragraph
            color="$color11"
            fontWeight="500"
          >
            Processed Expenses ({processedExpenses.length})
          </Paragraph>
        </XStack>
        <XStack
          gap="$2"
          items="center"
        >
          <Paragraph
            size="$3"
            color="$color10"
          >
            {showProcessedExpenses ? 'Hide' : 'Show'}
          </Paragraph>
          {showProcessedExpenses ? (
            <ChevronUp
              size={16}
              color="$color11"
            />
          ) : (
            <ChevronDown
              size={16}
              color="$color11"
            />
          )}
        </XStack>
      </XStack>

      <AnimatePresence>
        {showProcessedExpenses && (
          <YStack
            key="processed-expenses"
            animation="medium"
            enterStyle={{
              opacity: 0,
              height: 0,
              y: -10,
            }}
            exitStyle={{
              opacity: 0,
              height: 0,
              y: -10,
            }}
            opacity={1}
            height="auto"
            y={0}
            overflow="hidden"
          >
            <Separator />
            {processedExpenses.map((expense, index) => (
              <React.Fragment key={expense.id}>
                {index > 0 && <Separator />}
                <ExpenseItem
                  expense={expense}
                  isSelected={selectedExpenses.includes(expense.id)}
                  onExpenseSelectionChange={onExpenseSelectionChange}
                  onNavigate={onNavigate}
                />
              </React.Fragment>
            ))}
          </YStack>
        )}
      </AnimatePresence>
    </>
  )
}

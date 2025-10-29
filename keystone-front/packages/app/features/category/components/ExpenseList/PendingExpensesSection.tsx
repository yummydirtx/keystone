import React from 'react'
import { YStack, XStack, Separator, Paragraph } from '@my/ui'
import { Receipt } from '@tamagui/lucide-icons'
import type { Expense } from '../../../../types'
import { ExpenseItem } from './ExpenseItem'

interface PendingExpensesSectionProps {
  pendingExpenses: Expense[]
  selectedExpenses: number[]
  onExpenseSelectionChange?: (expenseId: number, selected: boolean) => void
  onNavigate: (expenseId: number) => void
}

export function PendingExpensesSection({
  pendingExpenses,
  selectedExpenses,
  onExpenseSelectionChange,
  onNavigate,
}: PendingExpensesSectionProps) {
  if (pendingExpenses.length === 0) {
    return (
      <YStack
        gap="$2"
        items="center"
        py="$4"
      >
        <Receipt
          size={32}
          color="$color8"
        />
        <Paragraph color="$color11">No pending expenses</Paragraph>
        <Paragraph
          color="$color10"
          size="$3"
        >
          New expenses awaiting review will appear here
        </Paragraph>
      </YStack>
    )
  }

  return (
    <>
      {pendingExpenses.map((expense, index) => (
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
    </>
  )
}

import React, { useState, useMemo } from 'react'
import { Card, Paragraph, XStack, YStack, H2 } from '@my/ui'
import { Receipt } from '@tamagui/lucide-icons'
import { useRouter, useSearchParams } from 'solito/navigation'
import type { Expense } from '../../../types'
import { formatCurrency } from '../../../utils/currency'
import { useAuth } from '../../../provider/AuthProvider'

import { ApprovedTotal } from './ExpenseList/ApprovedTotal'
import { BatchActionButtons } from './ExpenseList/BatchActionButtons'
import { ExpenseListControls } from './ExpenseList/ExpenseListControls'
import { ExpenseListHeader } from './ExpenseList/ExpenseListHeader'
import { PendingExpensesSection } from './ExpenseList/PendingExpensesSection'
import { PendingTotal } from './ExpenseList/PendingTotal'
import { ProcessedExpensesSection } from './ExpenseList/ProcessedExpensesSection'
import { calculateTotal } from './ExpenseList/utils'

interface ExpenseListProps {
  expenses: Expense[]
  onCreateExpense?: () => void
  selectedExpenses?: number[]
  onExpenseSelectionChange?: (expenseId: number, selected: boolean) => void
  onBatchApprove?: () => void
  onBatchDeny?: () => void
  onBatchDelete?: () => void
}

export function ExpenseList({
  expenses,
  onCreateExpense,
  selectedExpenses = [],
  onExpenseSelectionChange,
  onBatchApprove,
  onBatchDeny,
  onBatchDelete,
}: ExpenseListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isGuest } = useAuth()
  const [showProcessedExpenses, setShowProcessedExpenses] = useState(false)

  // Function to handle expense navigation with guest token preservation
  const handleExpenseNavigation = (expenseId: number) => {
    const guestToken = searchParams?.get('guestToken')
    if (isGuest && guestToken) {
      // For guest users, preserve the guest token in the URL
      router.push(`/expense/${expenseId}?guestToken=${guestToken}`)
    } else {
      // For authenticated users, navigate normally
      router.push(`/expense/${expenseId}`)
    }
  }

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc') // desc = most recent first, high to low

  // Separate and sort expenses
  const pendingExpenses = useMemo(() => {
    const pending = expenses.filter((expense) =>
      ['PENDING_REVIEW', 'PENDING_ADMIN'].includes(expense.status)
    )
    return [...pending].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.transaction_date).getTime()
        const dateB = new Date(b.transaction_date).getTime()
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      }

      if (sortBy === 'amount') {
        return sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount
      }
      return 0
    })
  }, [expenses, sortBy, sortDirection])

  const processedExpenses = useMemo(() => {
    const processed = expenses.filter((expense) =>
      ['APPROVED', 'DENIED', 'REIMBURSED'].includes(expense.status)
    )
    return [...processed].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.transaction_date).getTime()
        const dateB = new Date(b.transaction_date).getTime()
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      }

      if (sortBy === 'amount') {
        return sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount
      }
      return 0
    })
  }, [expenses, sortBy, sortDirection])

  const approvedExpenses = useMemo(() => {
    const approved = expenses.filter((expense) =>
      ['APPROVED', 'REIMBURSED'].includes(expense.status)
    )
    return approved
  }, [expenses])

  const pendingTotal = calculateTotal(pendingExpenses)
  const approvedTotal = calculateTotal(approvedExpenses)

  // Calculate selection states
  const allExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.transaction_date).getTime()
        const dateB = new Date(b.transaction_date).getTime()
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB
      }
      if (sortBy === 'amount') {
        return sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount
      }
      return 0
    })
  }, [expenses, sortBy, sortDirection])
  const allSelected =
    allExpenses.length > 0 && allExpenses.every((expense) => selectedExpenses.includes(expense.id))
  const someSelected = selectedExpenses.length > 0
  const selectedExpenseObjects = allExpenses.filter((expense) =>
    selectedExpenses.includes(expense.id)
  )
  const hasPendingSelected = selectedExpenseObjects.some((expense) =>
    ['PENDING_REVIEW', 'PENDING_ADMIN'].includes(expense.status)
  )

  if (expenses.length === 0) {
    return (
      <Card
        p="$4"
        gap="$3"
      >
        <ExpenseListHeader onCreateExpense={onCreateExpense} />
        <Card>
          <YStack
            gap="$2"
            items="center"
            py="$4"
          >
            <Receipt
              size={32}
              color="$color8"
            />
            <Paragraph color="$color11">No expenses found</Paragraph>
            <Paragraph
              color="$color10"
              size="$3"
            >
              Expenses in this category will appear here
            </Paragraph>
          </YStack>
        </Card>
      </Card>
    )
  }

  return (
    <YStack gap="$3">
      <Card
        p="$4"
        gap="$3"
      >
        <XStack
          gap="$2"
          items="center"
          justify="space-between"
        >
          <XStack
            gap="$2"
            items="center"
          >
            <Receipt
              size={24}
              color="$blue10"
            />
            <H2 size="$6">Expenses</H2>
          </XStack>
          <BatchActionButtons
            someSelected={someSelected}
            hasPendingSelected={hasPendingSelected}
            onBatchApprove={onBatchApprove}
            onBatchDeny={onBatchDeny}
            onBatchDelete={onBatchDelete}
            onCreateExpense={onCreateExpense}
          />
        </XStack>

        {allExpenses.length > 0 && (
          <ExpenseListControls
            allExpenses={allExpenses}
            allSelected={allSelected}
            selectedExpenses={selectedExpenses}
            someSelected={someSelected}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onExpenseSelectionChange={onExpenseSelectionChange}
            onSortByChange={setSortBy}
            onSortDirectionChange={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
          />
        )}

        <Card>
          <PendingExpensesSection
            pendingExpenses={pendingExpenses}
            selectedExpenses={selectedExpenses}
            onExpenseSelectionChange={onExpenseSelectionChange}
            onNavigate={handleExpenseNavigation}
          />
          <ProcessedExpensesSection
            processedExpenses={processedExpenses}
            showProcessedExpenses={showProcessedExpenses}
            onToggleShowProcessed={() => setShowProcessedExpenses(!showProcessedExpenses)}
            selectedExpenses={selectedExpenses}
            onExpenseSelectionChange={onExpenseSelectionChange}
            onNavigate={handleExpenseNavigation}
          />
        </Card>
      </Card>

      <PendingTotal
        pendingTotal={pendingTotal}
        pendingExpensesCount={pendingExpenses.length}
      />
      <ApprovedTotal
        approvedTotal={approvedTotal}
        showProcessedExpenses={showProcessedExpenses}
        processedExpensesCount={processedExpenses.length}
      />
    </YStack>
  )
}

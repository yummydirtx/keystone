import React, { useState } from 'react'
import { XStack, YStack, Checkbox, Paragraph, Image } from '@my/ui'
import { Check, ChevronRight, FolderOpen } from '@tamagui/lucide-icons'
import type { Expense } from '../../../../types'
import { formatCurrency } from '../../../../utils/currency'
import { ProfilePicture } from '../../../../components/ProfilePicture'

interface ExpenseItemProps {
  expense: Expense
  isSelected: boolean
  onExpenseSelectionChange?: (expenseId: number, selected: boolean) => void
  onNavigate: (expenseId: number) => void
}

export function ExpenseItem({
  expense,
  isSelected,
  onExpenseSelectionChange,
  onNavigate,
}: ExpenseItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '$green10'
      case 'PENDING_REVIEW':
      case 'PENDING_ADMIN':
        return '$yellow10'
      case 'DENIED':
        return '$red10'
      case 'REIMBURSED':
        return '$blue10'
      default:
        return '$color11'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pending Review'
      case 'PENDING_ADMIN':
        return 'Pending Admin'
      case 'APPROVED':
        return 'Approved'
      case 'DENIED':
        return 'Denied'
      case 'REIMBURSED':
        return 'Reimbursed'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <XStack
      key={expense.id}
      justify="space-between"
      items="center"
      gap="$3"
      px="$3"
      py="$3"
      onPress={() => {
        onNavigate(expense.id)
      }}
      pressStyle={{ scale: 0.98 }}
      cursor="pointer"
    >
      {onExpenseSelectionChange && (
        <XStack
          onPress={(e) => {
            e.stopPropagation()
          }}
        >
          <Checkbox
            id={`expense-${expense.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onExpenseSelectionChange(expense.id, !!checked)}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
        </XStack>
      )}
      <YStack
        gap="$1"
        flex={1}
        cursor="pointer"
      >
        <XStack
          gap="$2"
          items="center"
        >
          <Paragraph
            fontWeight="600"
            color="$color12"
          >
            {expense.description}
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
            {formatDate(expense.transaction_date)}
          </Paragraph>
        </XStack>
        <XStack
          gap="$2"
          items="center"
        >
          <ProfilePicture
            avatarUrl={expense.submitter?.avatar_url}
            name={expense.guest_name || expense.submitter?.name || 'Anonymous'}
            size={20}
            borderRadius="$10"
          />
          <Paragraph
            size="$3"
            color={expense.submitter ? '$color10' : '$color9'}
          >
            {expense.guest_name || expense.submitter?.name || 'Anonymous User'}
          </Paragraph>
        </XStack>
        {expense.category && (
          <XStack
            gap="$1"
            items="center"
          >
            <FolderOpen
              size={12}
              color="$color10"
            />
            <Paragraph
              size="$3"
              color="$color10"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {expense.category.name}
            </Paragraph>
          </XStack>
        )}
      </YStack>
      <YStack
        items="flex-end"
        gap="$1"
      >
        <Paragraph
          fontWeight="600"
          size="$5"
          color="$color12"
        >
          {formatCurrency(expense.amount)}
        </Paragraph>
        <Paragraph
          size="$3"
          color={getStatusColor(expense.status)}
          fontWeight="500"
        >
          {formatStatus(expense.status)}
        </Paragraph>
        {expense.guest_name && (
          <Paragraph
            bg="$yellow4"
            color="$yellow11"
            fontSize="$1"
            fontWeight="600"
            px="$1"
            py="$0.5"
          >
            GUEST
          </Paragraph>
        )}
      </YStack>
      <ChevronRight
        size={16}
        color="$color11"
      />
    </XStack>
  )
}

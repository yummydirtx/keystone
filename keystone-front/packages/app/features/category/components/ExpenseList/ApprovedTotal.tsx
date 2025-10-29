import React from 'react'
import { XStack, YStack, Paragraph } from '@my/ui'
import { formatCurrency } from '../../../../utils/currency'

interface ApprovedTotalProps {
  approvedTotal: number
  showProcessedExpenses: boolean
  processedExpensesCount: number
}

export function ApprovedTotal({
  approvedTotal,
  showProcessedExpenses,
  processedExpensesCount,
}: ApprovedTotalProps) {
  if (!showProcessedExpenses || processedExpensesCount === 0) {
    return null
  }

  return (
    <XStack
      justify="flex-end"
      px="$4"
    >
      <YStack
        items="flex-end"
        gap="$1"
      >
        <Paragraph
          size="$3"
          color="$color10"
          fontWeight="500"
        >
          Approved Total
        </Paragraph>
        <Paragraph
          fontWeight="600"
          size="$5"
          color="$color12"
        >
          {formatCurrency(approvedTotal)}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

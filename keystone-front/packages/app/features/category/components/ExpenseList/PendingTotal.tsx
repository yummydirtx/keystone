import React from 'react'
import { XStack, YStack, Paragraph } from '@my/ui'
import { formatCurrency } from '../../../../utils/currency'

interface PendingTotalProps {
  pendingTotal: number
  pendingExpensesCount: number
}

export function PendingTotal({ pendingTotal, pendingExpensesCount }: PendingTotalProps) {
  if (pendingExpensesCount === 0) {
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
          Pending Total
        </Paragraph>
        <Paragraph
          fontWeight="600"
          size="$5"
          color="$color12"
        >
          {formatCurrency(pendingTotal)}
        </Paragraph>
      </YStack>
    </XStack>
  )
}

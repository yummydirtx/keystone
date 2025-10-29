import React from 'react'
import { XStack, YStack, H2, Button } from '@my/ui'
import { Receipt, Plus } from '@tamagui/lucide-icons'

interface ExpenseListHeaderProps {
  onCreateExpense?: () => void
}

export function ExpenseListHeader({ onCreateExpense }: ExpenseListHeaderProps) {
  return (
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
      {onCreateExpense && (
        <Button
          size="$3"
          variant="outlined"
          onPress={onCreateExpense}
          icon={
            <Plus
              size={16}
              color="$color11"
            />
          }
          pressStyle={{ scale: 0.95 }}
        />
      )}
    </XStack>
  )
}

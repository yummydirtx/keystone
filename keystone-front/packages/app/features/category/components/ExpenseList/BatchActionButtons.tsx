import React from 'react'
import { XStack, Button, Paragraph } from '@my/ui'
import { CheckCircle, XCircle, Trash2, Plus } from '@tamagui/lucide-icons'

interface BatchActionButtonsProps {
  someSelected: boolean
  hasPendingSelected: boolean
  onBatchApprove?: () => void
  onBatchDeny?: () => void
  onBatchDelete?: () => void
  onCreateExpense?: () => void
}

export function BatchActionButtons({
  someSelected,
  hasPendingSelected,
  onBatchApprove,
  onBatchDeny,
  onBatchDelete,
  onCreateExpense,
}: BatchActionButtonsProps) {
  return (
    <XStack
      gap="$2"
      items="center"
    >
      {/* Batch action buttons */}
      {someSelected && onBatchApprove && hasPendingSelected && (
        <>
          {/* Mobile button - icon only */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchApprove}
            icon={
              <CheckCircle
                size={16}
                color="$green10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            display="flex"
            $md={{ display: 'none' }}
            aria-label="Approve selected expenses"
          />

          {/* Desktop button - icon + text */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchApprove}
            icon={
              <CheckCircle
                size={16}
                color="$green10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            px="$3"
            display="none"
            $md={{ display: 'flex' }}
          >
            <Paragraph
              size="$3"
              color="$green10"
            >
              Approve
            </Paragraph>
          </Button>
        </>
      )}
      {someSelected && onBatchDeny && hasPendingSelected && (
        <>
          {/* Mobile button - icon only */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchDeny}
            icon={
              <XCircle
                size={16}
                color="$red10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            display="flex"
            $md={{ display: 'none' }}
            aria-label="Deny selected expenses"
          />

          {/* Desktop button - icon + text */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchDeny}
            icon={
              <XCircle
                size={16}
                color="$red10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            px="$3"
            display="none"
            $md={{ display: 'flex' }}
          >
            <Paragraph
              size="$3"
              color="$red10"
            >
              Deny
            </Paragraph>
          </Button>
        </>
      )}
      {someSelected && onBatchDelete && (
        <>
          {/* Mobile button - icon only */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchDelete}
            icon={
              <Trash2
                size={16}
                color="$red10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            display="flex"
            $md={{ display: 'none' }}
            aria-label="Delete selected expenses"
          />

          {/* Desktop button - icon + text */}
          <Button
            size="$3"
            variant="outlined"
            onPress={onBatchDelete}
            icon={
              <Trash2
                size={16}
                color="$red10"
              />
            }
            pressStyle={{ scale: 0.95 }}
            px="$3"
            display="none"
            $md={{ display: 'flex' }}
          >
            <Paragraph
              size="$3"
              color="$red10"
            >
              Delete
            </Paragraph>
          </Button>
        </>
      )}
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
          aria-label="Create new expense"
        />
      )}
    </XStack>
  )
}

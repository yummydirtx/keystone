import { useState } from 'react'
import { Button, XStack, YStack, Sheet, H4, Paragraph, Spinner, ScrollView, Card, H3 } from '@my/ui'
import { Trash } from '@tamagui/lucide-icons'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useDeleteExpense } from '../../../utils/queries.optimized'
import { useRouter } from 'solito/navigation'

interface DeleteExpenseButtonProps {
  expenseId: string
  expenseDescription?: string
  canDelete?: boolean
  onDeleted?: () => void
  size?: '$2' | '$3' | '$4' | '$5'
}

export function DeleteExpenseButton({
  expenseId,
  expenseDescription,
  canDelete = false,
  onDeleted,
  size = '$4',
}: DeleteExpenseButtonProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const deleteExpenseMutation = useDeleteExpense()

  const loading = deleteExpenseMutation.isPending

  // Temporarily show for debugging
  // if (!canDelete) {
  //   return null
  // }

  const handleDelete = async () => {
    try {
      await deleteExpenseMutation.mutateAsync(expenseId)
      setShowDeleteDialog(false)

      if (onDeleted) {
        onDeleted()
      } else {
        // Default behavior: navigate back
        router.back()
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  return (
    <>
      <Card
        p="$4"
        bg="$background"
        flex={1}
        minW="47%"
      >
        <XStack
          items="center"
          gap="$2"
          mb="$2"
        >
          <Trash
            size="$1"
            color="$color11"
          />
          <H3>Delete</H3>
        </XStack>
        <Button
          theme="red"
          size={size}
          icon={Trash}
          onPress={() => setShowDeleteDialog(true)}
          disabled={loading}
          width="100%"
        >
          Delete
        </Button>
      </Card>

      {/* Delete Confirmation Sheet */}
      <Sheet
        modal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        snapPointsMode="fit"
        dismissOnSnapToBottom
        moveOnKeyboardChange
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame p="$4">
          <Sheet.Handle />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView>
              <YStack gap="$4">
                <H4>Delete Expense</H4>
                <Paragraph color="$color11">
                  Are you sure you want to delete this expense
                  {expenseDescription ? ` "${expenseDescription}"` : ''}? This action cannot be
                  undone.
                </Paragraph>

                <XStack
                  gap="$3"
                  justify="flex-end"
                  pt="$2"
                >
                  <Button
                    variant="outlined"
                    disabled={loading}
                    onPress={() => setShowDeleteDialog(false)}
                    flex={1}
                  >
                    Cancel
                  </Button>

                  <Button
                    theme="red"
                    onPress={handleDelete}
                    disabled={loading}
                    icon={loading ? Spinner : Trash}
                    flex={1}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

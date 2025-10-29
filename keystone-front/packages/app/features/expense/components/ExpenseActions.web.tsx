import { useState } from 'react'
import {
  Button,
  XStack,
  YStack,
  TextArea,
  Dialog,
  Adapt,
  Sheet,
  H4,
  Paragraph,
  Spinner,
  VisuallyHidden,
  useToastController,
} from '@my/ui'
import { Check, X } from '@tamagui/lucide-icons'
import {
  useUpdateExpenseStatus,
  useUpdateGuestExpenseStatus,
} from '../../../utils/queries.optimized'
import { useAuth } from '../../../provider/AuthProvider'

interface ExpenseActionsProps {
  expenseId: string
  currentStatus: 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'
  onStatusUpdate?: (newStatus: string) => void
  canApprove?: boolean
}

export function ExpenseActions({
  expenseId,
  currentStatus,
  onStatusUpdate,
  canApprove = false,
}: ExpenseActionsProps) {
  const { isGuest, guestSession } = useAuth()
  const toast = useToastController()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [notes, setNotes] = useState('')

  const updateExpenseStatusMutation = useUpdateExpenseStatus()
  const updateGuestExpenseStatusMutation = useUpdateGuestExpenseStatus()

  const loading =
    updateExpenseStatusMutation.isPending || updateGuestExpenseStatusMutation.isPending

  // Don't show actions if expense is already approved, denied, or reimbursed
  if (!canApprove || ['APPROVED', 'DENIED', 'REIMBURSED'].includes(currentStatus)) {
    return null
  }

  const handleApprove = async () => {
    try {
      if (isGuest && guestSession?.token) {
        // Use guest API endpoint
        const response = await updateGuestExpenseStatusMutation.mutateAsync({
          token: guestSession.token,
          id: expenseId,
          data: {
            status: 'APPROVED',
            notes: notes.trim() || undefined,
          },
        })

        // For guests, approval becomes PENDING_ADMIN, so show appropriate message
        toast.show('Success', {
          message: 'Expense approved and forwarded to admin for final approval',
        })

        // The actual status will be PENDING_ADMIN, so update accordingly
        onStatusUpdate?.('PENDING_ADMIN')
      } else {
        // Use regular API endpoint for authenticated users
        await updateExpenseStatusMutation.mutateAsync({
          id: expenseId,
          data: {
            status: 'APPROVED',
            notes: notes.trim() || undefined,
          },
        })

        toast.show('Success', { message: 'Expense approved successfully' })
        onStatusUpdate?.('APPROVED')
      }

      setShowApproveDialog(false)
      setNotes('')
    } catch (error) {
      console.error('Error approving expense:', error)
      toast.show('Error', { message: 'Failed to approve expense. Please try again.' })
    }
  }

  const handleReject = async () => {
    try {
      if (isGuest && guestSession?.token) {
        // Use guest API endpoint
        await updateGuestExpenseStatusMutation.mutateAsync({
          token: guestSession.token,
          id: expenseId,
          data: {
            status: 'DENIED',
            notes: notes.trim() || undefined,
          },
        })
      } else {
        // Use regular API endpoint for authenticated users
        await updateExpenseStatusMutation.mutateAsync({
          id: expenseId,
          data: {
            status: 'DENIED',
            notes: notes.trim() || undefined,
          },
        })
      }

      toast.show('Success', { message: 'Expense denied successfully' })
      onStatusUpdate?.('DENIED')
      setShowRejectDialog(false)
      setNotes('')
    } catch (error) {
      console.error('Error rejecting expense:', error)
      toast.show('Error', { message: 'Failed to deny expense. Please try again.' })
    }
  }

  return (
    <>
      <XStack
        gap="$3"
        items="center"
        justify="center"
      >
        <Button
          theme="green"
          size="$4"
          icon={Check}
          onPress={() => setShowApproveDialog(true)}
          disabled={loading}
        >
          Approve
        </Button>

        <Button
          theme="red"
          size="$4"
          icon={X}
          onPress={() => setShowRejectDialog(true)}
          disabled={loading}
        >
          Reject
        </Button>
      </XStack>

      {/* Approve Dialog */}
      <Dialog
        modal
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
      >
        <Adapt
          when="sm"
          platform="touch"
        >
          <Sheet
            animation="medium"
            zIndex={200000}
            modal
            dismissOnSnapToBottom
          >
            <Sheet.Frame
              p="$4"
              gap="$4"
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            p="$6"
          >
            <YStack gap="$4">
              <Dialog.Title asChild>
                <H4>Approve Expense</H4>
              </Dialog.Title>
              <Paragraph color="$color11">
                Are you sure you want to approve this expense? You can optionally add approval
                notes.
              </Paragraph>

              <TextArea
                placeholder="Add approval notes (optional)"
                value={notes}
                onChangeText={setNotes}
                minH={80}
              />

              <XStack
                gap="$3"
                justify="flex-end"
              >
                <Dialog.Close asChild>
                  <Button
                    variant="outlined"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>

                <Button
                  theme="green"
                  onPress={handleApprove}
                  disabled={loading}
                  icon={loading ? Spinner : Check}
                >
                  {loading ? 'Approving...' : 'Approve'}
                </Button>
              </XStack>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        modal
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
      >
        <Adapt
          when="sm"
          platform="touch"
        >
          <Sheet
            animation="medium"
            zIndex={200000}
            modal
            dismissOnSnapToBottom
          >
            <Sheet.Frame
              p="$4"
              gap="$4"
            >
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />

          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={['transform', 'opacity']}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            p="$6"
          >
            <YStack gap="$4">
              <Dialog.Title asChild>
                <H4>Reject Expense</H4>
              </Dialog.Title>
              <Paragraph color="$color11">
                Are you sure you want to reject this expense? Please provide a reason for rejection.
              </Paragraph>

              <TextArea
                placeholder="Reason for rejection (required)"
                value={notes}
                onChangeText={setNotes}
                minH={80}
              />

              <XStack
                gap="$3"
                justify="flex-end"
              >
                <Dialog.Close asChild>
                  <Button
                    variant="outlined"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>

                <Button
                  theme="red"
                  onPress={handleReject}
                  disabled={loading || !notes.trim()}
                  icon={loading ? Spinner : X}
                >
                  {loading ? 'Rejecting...' : 'Reject'}
                </Button>
              </XStack>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

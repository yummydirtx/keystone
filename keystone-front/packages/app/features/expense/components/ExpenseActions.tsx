import { useRef, useState } from 'react'
import {
  Button,
  XStack,
  YStack,
  TextArea,
  Sheet,
  H4,
  Paragraph,
  Spinner,
  ScrollView,
  useToastController,
} from '@my/ui'
import { Check, X } from '@tamagui/lucide-icons'
import { KeyboardAvoidingView, Platform } from 'react-native'
import {
  useUpdateExpenseStatus,
  useUpdateGuestExpenseStatus,
} from '../../../utils/queries.optimized'
import { useAuth } from '../../../provider/AuthProvider'

interface ExpenseActionsProps {
  expenseId: string
  currentStatus: 'PENDING_REVIEW' | 'PENDING_ADMIN' | 'APPROVED' | 'DENIED' | 'REIMBURSED'
  onStatusUpdate?: (newStatus: string) => void
  onStatusUpdateSuccess?: () => void
  canApprove?: boolean
}

export function ExpenseActions({
  expenseId,
  currentStatus,
  onStatusUpdate,
  onStatusUpdateSuccess,
  canApprove = false,
}: ExpenseActionsProps) {
  const { isGuest, guestSession } = useAuth()
  const toast = useToastController()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  // Uncontrolled notes to avoid re-renders while typing
  const notesRef = useRef('')
  const [notesInputResetKey, setNotesInputResetKey] = useState(0)
  // Debounced UI state for reject button enablement
  const [canReject, setCanReject] = useState(false)
  const notesDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestNotesUiUpdate = () => {
    if (notesDebounceTimer.current) clearTimeout(notesDebounceTimer.current)
    notesDebounceTimer.current = setTimeout(() => {
      setCanReject(!!notesRef.current.trim())
    }, 120)
  }

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
            notes: notesRef.current.trim() || undefined,
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
            notes: notesRef.current.trim() || undefined,
          },
        })

        toast.show('Success', { message: 'Expense approved successfully' })
        onStatusUpdate?.('APPROVED')
      }

      setShowApproveDialog(false)
      notesRef.current = ''
      setNotesInputResetKey((k) => k + 1)
      onStatusUpdateSuccess?.()
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
            notes: notesRef.current.trim() || undefined,
          },
        })
      } else {
        // Use regular API endpoint for authenticated users
        await updateExpenseStatusMutation.mutateAsync({
          id: expenseId,
          data: {
            status: 'DENIED',
            notes: notesRef.current.trim() || undefined,
          },
        })
      }

      toast.show('Success', { message: 'Expense denied successfully' })
      onStatusUpdate?.('DENIED')
      setShowRejectDialog(false)
      notesRef.current = ''
      setNotesInputResetKey((k) => k + 1)
      setCanReject(false)
      onStatusUpdateSuccess?.()
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

      {/* Approve Sheet */}
      <Sheet
        modal
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
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
                <H4>Approve Expense</H4>
                <Paragraph color="$color11">
                  Are you sure you want to approve this expense? You can optionally add approval
                  notes.
                </Paragraph>

                <TextArea
                  key={`approve-notes-${notesInputResetKey}`}
                  placeholder="Add approval notes (optional)"
                  defaultValue={notesRef.current}
                  onChangeText={(text) => {
                    notesRef.current = text
                    // No immediate UI dependency for approve, so no tick needed
                  }}
                  minH={80}
                />

                <XStack
                  gap="$3"
                  justify="flex-end"
                  pt="$2"
                >
                  <Button
                    variant="outlined"
                    disabled={loading}
                    onPress={() => setShowApproveDialog(false)}
                    flex={1}
                  >
                    Cancel
                  </Button>

                  <Button
                    theme="green"
                    onPress={handleApprove}
                    disabled={loading}
                    icon={loading ? Spinner : Check}
                    flex={1}
                  >
                    {loading ? 'Approving...' : 'Approve'}
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </Sheet.Frame>
      </Sheet>

      {/* Reject Sheet */}
      <Sheet
        modal
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
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
                <H4>Reject Expense</H4>
                <Paragraph color="$color11">
                  Are you sure you want to reject this expense? Please provide a reason for
                  rejection.
                </Paragraph>

                <TextArea
                  key={`reject-notes-${notesInputResetKey}`}
                  placeholder="Reason for rejection (required)"
                  defaultValue={notesRef.current}
                  onChangeText={(text) => {
                    notesRef.current = text
                    requestNotesUiUpdate()
                  }}
                  minH={80}
                />

                <XStack
                  gap="$3"
                  justify="flex-end"
                  pt="$2"
                >
                  <Button
                    variant="outlined"
                    disabled={loading}
                    onPress={() => setShowRejectDialog(false)}
                    flex={1}
                  >
                    Cancel
                  </Button>

                  <Button
                    theme="red"
                    onPress={handleReject}
                    disabled={loading || !canReject}
                    icon={loading ? Spinner : X}
                    flex={1}
                  >
                    {loading ? 'Rejecting...' : 'Reject'}
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

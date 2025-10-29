import React from 'react'
import { AlertDialog, Button, Paragraph, YStack, XStack, Spinner } from '@my/ui'

interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAccountDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay key="overlay" />
        <AlertDialog.Content
          key="content"
          maxW={400}
        >
          <YStack gap="$4">
            <AlertDialog.Title>Delete Account</AlertDialog.Title>
            <AlertDialog.Description>
              <YStack gap="$3">
                <Paragraph
                  color="$red10"
                  fontWeight="bold"
                >
                  This action cannot be undone.
                </Paragraph>
                <Paragraph>Deleting your account will:</Paragraph>
                <YStack
                  gap="$1"
                  pl="$2"
                >
                  <Paragraph>• Delete all workspaces you own</Paragraph>
                  <Paragraph>• Anonymize your expense submissions</Paragraph>
                  <Paragraph>• Anonymize your approval history</Paragraph>
                  <Paragraph>• Remove all your permissions</Paragraph>
                  <Paragraph>• Delete all uploaded files (avatars, receipts)</Paragraph>
                  <Paragraph>• Permanently delete your authentication account</Paragraph>
                  <Paragraph>• Permanently delete your profile</Paragraph>
                </YStack>
                <Paragraph fontWeight="bold">Are you sure you want to continue?</Paragraph>
              </YStack>
            </AlertDialog.Description>

            <XStack
              gap="$3"
              justify="flex-end"
            >
              <AlertDialog.Cancel asChild>
                <Button
                  variant="outlined"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  theme="red"
                  onPress={handleConfirm}
                  disabled={isDeleting}
                  icon={
                    isDeleting ? (
                      <Spinner
                        size="small"
                        color="white"
                      />
                    ) : undefined
                  }
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

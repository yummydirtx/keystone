import { Button, YStack, H2, Dialog, XStack, Adapt, Paragraph, Sheet, Text } from '@my/ui'
import { AlertTriangle } from '@tamagui/lucide-icons'
import type { Category } from '../../../types'

interface DeleteCategoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
  deleting: boolean
  category: Category | null
}

export function DeleteCategoryDialog({
  isOpen,
  onOpenChange,
  onDelete,
  deleting,
  category,
}: DeleteCategoryDialogProps) {
  const handleDelete = async () => {
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const subcategoriesCount = category?.children?.length || 0
  const hasSubcategories = subcategoriesCount > 0

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={onOpenChange}
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
          animation="slow"
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
          p="$4"
        >
          <Dialog.Title asChild>
            <XStack
              gap="$2"
              items="center"
            >
              <AlertTriangle
                size={24}
                color="$red10"
              />
              <H2>Delete Category</H2>
            </XStack>
          </Dialog.Title>

          <YStack gap="$3">
            <Paragraph
              size="$4"
              color="$color11"
            >
              Are you sure you want to delete "
              <Text
                fontWeight="600"
                color="$color12"
              >
                {category?.name}
              </Text>
              "?
            </Paragraph>

            <YStack
              gap="$2"
              p="$3"
              theme="red"
              borderWidth={1}
              borderColor="$red6"
            >
              <Paragraph
                size="$3"
                color="$red11"
                fontWeight="600"
              >
                ⚠️ This action cannot be undone
              </Paragraph>

              <Paragraph
                size="$3"
                color="$red10"
              >
                This will permanently delete:
              </Paragraph>

              <YStack
                gap="$1"
                pl="$3"
              >
                <Paragraph
                  size="$3"
                  color="$red10"
                >
                  • The category and all its data
                </Paragraph>
                {hasSubcategories && (
                  <Paragraph
                    size="$3"
                    color="$red10"
                  >
                    • All {subcategoriesCount} subcategories
                  </Paragraph>
                )}
                <Paragraph
                  size="$3"
                  color="$red10"
                >
                  • All expenses associated with this category
                </Paragraph>
              </YStack>
            </YStack>
          </YStack>

          <XStack
            gap="$3"
            items="center"
            justify="flex-end"
          >
            <Dialog.Close
              displayWhenAdapted
              asChild
            >
              <Button
                variant="outlined"
                onPress={handleCancel}
                disabled={deleting}
              >
                Cancel
              </Button>
            </Dialog.Close>

            <Button
              theme="red"
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Category'}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

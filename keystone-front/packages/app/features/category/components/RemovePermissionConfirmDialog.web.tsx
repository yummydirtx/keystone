// packages/app/features/category/components/RemovePermissionConfirmDialog.web.tsx
import React from 'react'
import {
  Button,
  YStack,
  H2,
  Dialog,
  Sheet,
  XStack,
  Paragraph,
  Separator,
  Text,
} from '@my/ui'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useState, useEffect } from 'react'

interface Permission {
  id: number | null
  user: {
    id: number
    name: string
    email: string
    avatar_url?: string
  }
  role: string
  sourceCategory?: {
    id: number
    name: string
  } | null
  isDirect?: boolean
  isInherited?: boolean
}

interface RemovePermissionConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  permission: Permission | null
  currentCategoryName: string
  removing: boolean
}

export function RemovePermissionConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  permission,
  currentCategoryName,
  removing,
}: RemovePermissionConfirmDialogProps) {
  // Simple mobile detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Only run on web platforms where window exists
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
    // On native, assume mobile layout
    setIsMobile(true)
  }, [])

  if (!permission) return null

  const sourceCategory = permission.sourceCategory?.name || currentCategoryName
  const isDirectPermission = permission.isDirect ?? true

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <>
      {isMobile ? (
        // Mobile version using Sheet
        <Sheet
          modal
          open={isOpen}
          onOpenChange={onOpenChange}
          snapPointsMode="fit"
          dismissOnSnapToBottom
        >
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Sheet.Frame p="$4">
            <Sheet.Handle />
            <YStack gap="$4">
              {/* Header */}
              <XStack
                items="center"
                gap="$2"
              >
                <AlertTriangle
                  size={20}
                  color="orange"
                />
                <H2 size="$4">Remove Permission</H2>
              </XStack>

              <YStack gap="$3">
                <Paragraph>
                  Are you sure you want to remove{' '}
                  <Text fontWeight="600">{permission.user.name}</Text> from this category?
                </Paragraph>

                <YStack
                  gap="$2"
                  p="$3"
                  bg="$color2"
                >
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                  >
                    Permission Details:
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">User:</Text> {permission.user.name} ({permission.user.email})
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">Role:</Text> {permission.role}
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">Originally granted on:</Text> {sourceCategory}
                  </Text>
                  {!isDirectPermission && (
                    <Text fontSize="$3">
                      • <Text fontWeight="600">Permission type:</Text> Inherited from parent category
                    </Text>
                  )}
                </YStack>

                <YStack
                  gap="$2"
                  p="$3"
                  background="$orange2"
                >
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="orange"
                  >
                    Impact of removal:
                  </Text>
                  <Text
                    fontSize="$3"
                    color="orange"
                  >
                    {isDirectPermission
                      ? `This will remove ${permission.user.name}'s access to "${sourceCategory}" and all of its subcategories.`
                      : `This will remove ${permission.user.name}'s inherited permission from "${sourceCategory}", affecting their access to "${currentCategoryName}" and its subcategories.`}
                  </Text>
                </YStack>
              </YStack>

              <XStack
                justify="flex-end"
                gap="$3"
                pt="$2"
              >
                <Button
                  variant="outlined"
                  onPress={handleCancel}
                  disabled={removing}
                  flex={1}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleConfirm}
                  disabled={removing}
                  theme="red"
                  flex={1}
                >
                  {removing ? 'Removing...' : 'Remove Permission'}
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      ) : (
        // Desktop version using Dialog
        <Dialog
          modal
          open={isOpen}
          onOpenChange={onOpenChange}
        >
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="quick"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              style={{ zIndex: 999 }}
            />
            <Dialog.Content
              bordered
              elevate
              key="content"
              animateOnly={['transform', 'opacity']}
              animation={['quick', { opacity: { overshoot: -1 } }]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
              gap="$4"
              width={500}
              style={{ zIndex: 1000 }}
            >
              <XStack
                justify="space-between"
                items="center"
              >
                <XStack
                  items="center"
                  gap="$2"
                >
                  <AlertTriangle
                    size={20}
                    color="orange"
                  />
                  <Dialog.Title>Remove Permission</Dialog.Title>
                </XStack>
              </XStack>

              <YStack gap="$4">
                <Paragraph>
                  Are you sure you want to remove{' '}
                  <Text fontWeight="600">{permission.user.name}</Text> from this category?
                </Paragraph>

                <YStack
                  gap="$2"
                  p="$3"
                  bg="$color2"
                >
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                  >
                    Permission Details:
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">User:</Text> {permission.user.name} ({permission.user.email})
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">Role:</Text> {permission.role}
                  </Text>
                  <Text fontSize="$3">
                    • <Text fontWeight="600">Originally granted on:</Text> {sourceCategory}
                  </Text>
                  {!isDirectPermission && (
                    <Text fontSize="$3">
                      • <Text fontWeight="600">Permission type:</Text> Inherited from parent category
                    </Text>
                  )}
                </YStack>

                <YStack
                  gap="$2"
                  p="$3"
                  background="$orange2"
                >
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="orange"
                  >
                    Impact of removal:
                  </Text>
                  <Text
                    fontSize="$3"
                    color="orange"
                  >
                    {isDirectPermission
                      ? `This will remove ${permission.user.name}'s access to "${sourceCategory}" and all of its subcategories.`
                      : `This will remove ${permission.user.name}'s inherited permission from "${sourceCategory}", affecting their access to "${currentCategoryName}" and its subcategories.`}
                  </Text>
                </YStack>
              </YStack>

              <XStack
                justify="flex-end"
                gap="$4"
              >
                <Button
                  variant="outlined"
                  onPress={handleCancel}
                  disabled={removing}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleConfirm}
                  disabled={removing}
                  theme="red"
                >
                  {removing ? 'Removing...' : 'Remove Permission'}
                </Button>
              </XStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      )}
    </>
  )
}
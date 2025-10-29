// packages/app/features/category/components/RemovePermissionConfirmDialog.tsx
import React from 'react'
import {
  Button,
  YStack,
  H2,
  XStack,
  Paragraph,
  Text,
  useTheme,
} from '@my/ui'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { Modal, Pressable } from 'react-native'

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
  // In the native version, always use React Native Modal for proper stacking
  const theme = useTheme()

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
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}
        onPress={handleCancel}
      >
        <Pressable
          style={{
            backgroundColor: theme.background.get(),
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            minHeight: 200,
          }}
          onPress={(e) => e.stopPropagation()}
        >
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
        </Pressable>
      </Pressable>
    </Modal>
  )
}
// packages/app/features/category/components/SharedUserList.tsx
import React, { useState } from 'react'
import { YStack, XStack, Paragraph, Avatar, Button, Spinner, Separator, Text } from '@my/ui'
import { X, Link2 } from '@tamagui/lucide-icons'
import { Platform } from 'react-native'
import { RemovePermissionConfirmDialog } from './RemovePermissionConfirmDialog'

interface SharedUser {
  id: number
  name: string
  email: string
  avatar_url?: string
}

interface Permission {
  id: number | null
  user: SharedUser
  role: string
  sourceCategory?: {
    id: number
    name: string
  } | null
  isDirect?: boolean
  isInherited?: boolean
}

interface SharedUserListProps {
  users: Permission[]
  onRemoveUser: (userId: number, permission: Permission) => void
  loading: boolean
  removingUserId: number | null
  currentCategoryName: string
}

export function SharedUserList({
  users,
  onRemoveUser,
  loading,
  removingUserId,
  currentCategoryName,
}: SharedUserListProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    permission: Permission | null
  }>({
    isOpen: false,
    permission: null,
  })

  if (loading) {
    return <Spinner />
  }

  if (users.length === 0) {
    return <Paragraph>This category hasn't been shared with anyone.</Paragraph>
  }

  const handleRemoveClick = (permission: Permission) => {
    setConfirmDialog({
      isOpen: true,
      permission,
    })
  }

  const handleConfirmRemove = () => {
    if (confirmDialog.permission) {
      onRemoveUser(confirmDialog.permission.user.id, confirmDialog.permission)
      setConfirmDialog({ isOpen: false, permission: null })
    }
  }

  const handleCancelRemove = () => {
    setConfirmDialog({ isOpen: false, permission: null })
  }

  return (
    <>
      <YStack gap="$3">
        {users.map((permission, index) => {
          const isOwner = permission.role === 'OWNER'
          const canRemove = !isOwner && permission.id !== null
          const isInherited = permission.isInherited || false
          const sourceCategory = permission.sourceCategory?.name || currentCategoryName

          return (
            <React.Fragment key={permission.user.id || `owner-${index}`}>
              {index > 0 && <Separator />}
              <XStack
                items="center"
                justify="space-between"
              >
                <XStack
                  items="center"
                  gap="$3"
                  flex={1}
                >
                  <Avatar
                    circular
                    size="$3"
                  >
                    <Avatar.Image
                      src={
                        permission.user.avatar_url ||
                        'https://ui-avatars.com/api/?name=' + permission.user.name
                      }
                    />
                    <Avatar.Fallback>
                      <Text>{permission.user.name?.charAt(0).toUpperCase()}</Text>
                    </Avatar.Fallback>
                  </Avatar>
                  <YStack
                    flex={1}
                  >
                    <XStack
                      items="center"
                      gap="$2"
                    >
                      <Paragraph>{permission.user.name}</Paragraph>
                      {isOwner && (
                        <YStack
                          bg="$color4"
                          px="$1.5"
                          py="$0.5"
                        >
                          <Text
                            fontSize="$2"
                            color="$color10"
                          >
                            Owner
                          </Text>
                        </YStack>
                      )}
                    </XStack>
                    <Paragraph
                      size="$3"
                      color="$color11"
                      style={Platform.OS === 'web' ? { wordBreak: 'break-word' } : undefined}
                    >
                      {permission.user.email}
                    </Paragraph>
                    {isInherited && sourceCategory !== currentCategoryName && (
                      <Paragraph
                        size="$2"
                        color="$color10"
                      >
                        From: {sourceCategory}
                      </Paragraph>
                    )}
                  </YStack>
                </XStack>
                <XStack
                  items="center"
                  gap="$2"
                >
                  <YStack gap="$2" items="flex-end">
                    {!isOwner && (
                      <YStack
                        bg={
                          permission.role === 'ADMIN'
                            ? '$red4'
                            : permission.role === 'REVIEWER'
                              ? '$blue4'
                              : '$yellow4'
                        }
                        px="$1.5"
                        py="$0.5"
                      >
                        <Text
                          fontSize="$2"
                          color={
                            permission.role === 'ADMIN'
                              ? '$red11'
                              : permission.role === 'REVIEWER'
                                ? '$blue11'
                                : '$yellow11'
                          }
                        >
                          {permission.role}
                        </Text>
                      </YStack>
                    )}
                    {isInherited && (
                      <XStack
                        items="center"
                        gap="$1"
                        bg="$color3"
                        px="$1.5"
                        py="$0.5"
                      >
                        <Link2 size={10} color="$color10" />
                        <Text
                          fontSize="$2"
                          color="$color10"
                        >
                          Inherited
                        </Text>
                      </XStack>
                    )}
                  </YStack>
                  {canRemove && (
                    <Button
                      size="$2"
                      circular
                      icon={removingUserId === permission.user.id ? <Spinner /> : <X size={12} />}
                      onPress={() => handleRemoveClick(permission)}
                      disabled={removingUserId === permission.user.id}
                      aria-label={`Remove ${permission.user.name || permission.user.email} from category`}
                    />
                  )}
                </XStack>
              </XStack>
            </React.Fragment>
          )
        })}
      </YStack>

      <RemovePermissionConfirmDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        permission={confirmDialog.permission}
        currentCategoryName={currentCategoryName}
        removing={removingUserId === confirmDialog.permission?.user.id}
      />
    </>
  )
}

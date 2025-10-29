// packages/app/features/category/components/ShareCategoryDialog.tsx
import {
  Button,
  YStack,
  H2,
  Dialog,
  Sheet,
  Input,
  Label,
  XStack,
  Spinner,
  Separator,
  useToastController,
  ScrollView,
  useMedia,
} from '@my/ui'
import { Link, Check, X, HelpCircle, Share } from '@tamagui/lucide-icons'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { SharedUserList } from './SharedUserList'
import { RolePicker } from './RolePicker'
import {
  useCategoryPermissions,
  useRevokeCategoryPermission,
} from '../../../utils/queries.optimized'

interface ShareCategoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onShare: (email: string, role: string) => Promise<void>
  sharing: boolean
  categoryId: number
  categoryName?: string
}

export function ShareCategoryDialog({
  isOpen,
  onOpenChange,
  onShare,
  sharing,
  categoryId,
  categoryName = 'Category',
}: ShareCategoryDialogProps) {
  const media = useMedia()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('SUBMITTER')
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)
  const toast = useToastController()
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false)

  // Use TanStack Query hooks for category permissions
  const {
    data: sharedUsers = [],
    isLoading: loadingUsers,
    refetch: refetchSharedUsers,
  } = useCategoryPermissions(categoryId.toString(), {
    enabled: isOpen && !!categoryId,
  })

  const revokePermissionMutation = useRevokeCategoryPermission()

  const roles = useMemo(
    () => [
      { name: 'Submitter', value: 'SUBMITTER' },
      { name: 'Reviewer', value: 'REVIEWER' },
      { name: 'Admin', value: 'ADMIN' },
    ],
    []
  )

  type PermissionItem = { label: string; allowed: boolean; note?: string }

  const getPermissionItemsForRole = (roleValue: string): PermissionItem[] => {
    const isAdmin = roleValue === 'ADMIN'
    const isReviewer = roleValue === 'REVIEWER'
    const isSubmitter = roleValue === 'SUBMITTER'

    return [
      // Expense actions
      { label: 'Submit expenses', allowed: isSubmitter || isReviewer || isAdmin },
      {
        label: 'Approve expenses',
        allowed: isReviewer || isAdmin,
        note: isReviewer && !isAdmin ? '(Pending an Admin)' : undefined,
      },
      { label: 'Deny expenses', allowed: isReviewer || isAdmin },
      // Category actions
      { label: 'Create subcategories', allowed: isReviewer || isAdmin },
      { label: 'Edit this category', allowed: isAdmin },
      { label: 'Edit subcategories', allowed: isReviewer || isAdmin },
      { label: 'Delete this category', allowed: isAdmin },
      { label: 'Delete subcategories (empty)', allowed: isReviewer || isAdmin },
      // Sharing
      { label: 'Manage sharing', allowed: isAdmin },
    ]
  }

  const permissionItems = useMemo<PermissionItem[]>(() => getPermissionItemsForRole(role), [role])

  const handleRoleChange = useCallback((newRole: string) => {
    setRole(newRole)
  }, [])

  useEffect(() => {
    if (isOpen) {
      refetchSharedUsers()
    }
  }, [isOpen, categoryId, refetchSharedUsers])

  const handleShare = async () => {
    if (!email.trim()) return

    try {
      await onShare(email.trim(), role)
      setEmail('')
      setRole('SUBMITTER')
      refetchSharedUsers() // Refresh the list
    } catch (error) {
      // Error is handled by the parent, but you could add a toast here if needed
      console.error('Failed to share category:', error)
    }
  }

  const handleRemoveUser = async (userId: number, permission: any) => {
    setRemovingUserId(userId)
    try {
      // Always remove from the source category (where permission was originally granted)
      const sourceId = permission.sourceCategory?.id || categoryId
      await revokePermissionMutation.mutateAsync({
        categoryId: sourceId.toString(),
        userId: userId.toString(),
      })
      toast.show('Success', { message: 'User removed from category.' })
      refetchSharedUsers() // Refresh the list
    } catch (error) {
      toast.show('Error', { message: 'Failed to remove user.' })
    } finally {
      setRemovingUserId(null)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setEmail('')
    setRole('SUBMITTER')
  }

  // Shared content that will be used in both Dialog and Sheet
  const SharedContent = () => (
    <YStack gap="$4">
      {/* Header */}
      <XStack items="center" gap="$2">
        <Share size={20} />
        <H2 size="$6">Share Category</H2>
      </XStack>

      {/* People with access section */}
      <YStack gap="$3">
        <H2 size="$4">People with access</H2>
        <SharedUserList
          users={sharedUsers}
          onRemoveUser={handleRemoveUser}
          loading={loadingUsers}
          removingUserId={removingUserId}
          currentCategoryName={categoryName}
        />
      </YStack>

      <Separator />

      {/* Invite new people section */}
      <YStack gap="$3">
        <H2 size="$4">Invite new people</H2>
        
        <YStack gap="$2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </YStack>

        <XStack items="center" justify="space-between">
          <XStack items="center" gap="$1">
            <Label>Role</Label>
            <Button
              size="$2"
              circular
              variant="outlined"
              icon={HelpCircle}
              onPress={() => setShowPermissionsInfo((v) => !v)}
              aria-label="Role permissions info"
            />
          </XStack>
        </XStack>
        
        <RolePicker
          role={role}
          setRole={handleRoleChange}
          roles={roles}
          label=""
        />

        {showPermissionsInfo && (
          <YStack gap="$2" pt="$1">
            <Label>Permissions</Label>
            <YStack gap="$1">
              {permissionItems.map((item) => (
                <XStack key={item.label} items="center" gap="$2">
                  {item.allowed ? (
                    <Check size={16} color="$green10" />
                  ) : (
                    <X size={16} color="$red10" />
                  )}
                  <span style={{ fontSize: 14 }}>
                    {item.label}{' '}
                    {item.note && (
                      <span style={{ color: 'var(--color10)' }}>{item.note}</span>
                    )}
                  </span>
                </XStack>
              ))}
            </YStack>
          </YStack>
        )}
      </YStack>

      {/* Action buttons */}
      <XStack justify="flex-end" gap="$3" pt="$2">
        <Button
          variant="outlined"
          onPress={handleCancel}
          disabled={sharing}
          flex={1}
        >
          Cancel
        </Button>
        <Button
          onPress={handleShare}
          disabled={sharing || !email.trim()}
          opacity={sharing ? 0.5 : 1}
          theme="blue"
          flex={1}
        >
          {sharing ? 'Sharing...' : 'Share'}
        </Button>
      </XStack>
    </YStack>
  )

  return (
    <>
      {media.maxMd ? (
        // Mobile: Sheet
        <Sheet
          modal
          open={isOpen}
          onOpenChange={onOpenChange}
          snapPointsMode="fit"
          dismissOnSnapToBottom
          moveOnKeyboardChange
        >
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Sheet.Frame p="$4" height="90vh">
            <Sheet.Handle />
            <ScrollView flex={1} showsVerticalScrollIndicator={true}>
              <YStack pb="$8">
                <SharedContent />
              </YStack>
            </ScrollView>
          </Sheet.Frame>
        </Sheet>
      ) : (
        // Desktop: Dialog
        <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
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
              animation={['quick', { opacity: { overshoot: -1 } }]}
              enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
              exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
              gap="$4"
              width={600}
            >
              <ScrollView maxH="60vh">
                <SharedContent />
              </ScrollView>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      )}
    </>
  )
}

// packages/app/features/category/components/ShareCategoryDialog.tsx
import {
  Button,
  YStack,
  H2,
  Sheet,
  Input,
  Label,
  XStack,
  Spinner,
  Separator,
  useToastController,
  ScrollView,
  Paragraph,
} from '@my/ui'
import { Check, ChevronDown, X, Share } from '@tamagui/lucide-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { getCategoryPermissions, revokeCategoryPermission } from '../../../utils/api'
import { SharedUserList } from './SharedUserList'

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
  // Uncontrolled email input to reduce re-renders on Native
  const emailRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [uiTick, setUiTick] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestUiUpdate = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setUiTick((t) => t + 1), 120)
  }
  const [role, setRole] = useState('SUBMITTER')
  const [sharedUsers, setSharedUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)
  const toast = useToastController()

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

  const fetchSharedUsers = async () => {
    if (!categoryId) return
    setLoadingUsers(true)
    try {
      const response = await getCategoryPermissions(categoryId.toString())
      if ((response as any).permissions) {
        setSharedUsers((response as any).permissions)
      }
    } catch (error) {
      toast.show('Error', { message: 'Could not load shared users.' })
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchSharedUsers()
    }
  }, [isOpen, categoryId])

  const handleShare = async () => {
    const email = emailRef.current.trim()
    if (!email) return

    try {
      await onShare(email, role)
      emailRef.current = ''
      setInputResetKey((k) => k + 1)
      setRole('SUBMITTER')
      fetchSharedUsers() // Refresh the list
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
      await revokeCategoryPermission(sourceId.toString(), userId.toString())
      toast.show('Success', { message: 'User removed from category.' })
      fetchSharedUsers() // Refresh the list
    } catch (error) {
      toast.show('Error', { message: 'Failed to remove user.' })
    } finally {
      setRemovingUserId(null)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    emailRef.current = ''
    setInputResetKey((k) => k + 1)
    setRole('SUBMITTER')
  }

  return (
    <>
      <Sheet
        modal
        open={isOpen}
        onOpenChange={onOpenChange}
        snapPoints={[90]}
        position={0}
        moveOnKeyboardChange
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame p="$4">
          <Sheet.Handle />
          <ScrollView>
        <YStack gap="$4">
          {/* Header */}
          <XStack
            items="center"
            gap="$2"
          >
            <Share size={20} />
            <H2 size="$6">Share Category</H2>
          </XStack>

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

          <YStack gap="$3">
            <H2 size="$4">Invite new people</H2>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <YStack gap="$2">
            <Label htmlFor="share-email">User's Email</Label>
            <Input
              key={`email-${inputResetKey}`}
              id="share-email"
              placeholder="Enter user's email"
              defaultValue=""
              onChangeText={(text) => {
            emailRef.current = text
            requestUiUpdate()
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </YStack>
            </KeyboardAvoidingView>

            <YStack gap="$2">
          <Label>Role</Label>
          <Button
            variant="outlined"
            iconAfter={ChevronDown}
            onPress={() => {
              if (Platform.OS === 'ios') {
            const handleRoleSelect = (selectedRole: string) => {
              // Use setTimeout to defer state update until after render
              setTimeout(() => setRole(selectedRole), 0)
            }

            Alert.alert('Select Role', 'Choose a role for this user', [
              ...roles.map((roleItem) => ({
                text: roleItem.name,
                onPress: () => handleRoleSelect(roleItem.value),
                style: 'default' as const,
              })),
              {
                text: 'Cancel',
                style: 'cancel' as const,
              },
            ])
              }
            }}
          >
            {roles.find((r) => r.value === role)?.name || 'Select a role...'}
          </Button>
            </YStack>

            <YStack
          gap="$2"
          pt="$1"
            >
          <Label>Permissions</Label>
          <YStack gap="$1">
            {permissionItems.map((item) => (
              <XStack
            key={item.label}
            items="center"
            gap="$2"
              >
            {item.allowed ? (
              <Check
                size={16}
                color="$green10"
              />
            ) : (
              <X
                size={16}
                color="$red10"
              />
            )}
            <Paragraph size="$3">
              {item.label}{' '}
              {item.note ? (
                <Paragraph
              size="$3"
              color="$color10"
              display="inline"
                >
              {item.note}
                </Paragraph>
              ) : null}
            </Paragraph>
              </XStack>
            ))}
          </YStack>
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
          disabled={sharing}
          flex={1}
            >
          Cancel
            </Button>
            <Button
          onPress={handleShare}
          disabled={sharing || !emailRef.current.trim()}
          opacity={sharing ? 0.5 : 1}
          theme="blue"
          flex={1}
            >
          {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </XStack>
        </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

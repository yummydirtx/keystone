import {
  Button,
  Sheet,
  Input,
  Label,
  Spinner,
  Separator,
  Text,
  useToastController,
  XStack,
  YStack,
  ScrollView,
  H2,
} from '@my/ui'
import { Link, Copy, ChevronDown } from '@tamagui/lucide-icons'
import { createShareLink, getGuestLinks, revokeGuestLink } from 'app/utils/api'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Alert } from 'react-native'

// --- Component Props Interface ---
interface GuestLinkDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  categoryId: number
}

// --- Main Component ---
export function GuestLinkDialog({ isOpen, onOpenChange, categoryId }: GuestLinkDialogProps) {
  // --- State Management ---
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [permissionLevel, setPermissionLevel] = useState<'SUBMIT_ONLY' | 'REVIEW_ONLY'>(
    'SUBMIT_ONLY'
  )
  // Capture description without causing re-renders on each keystroke
  const descriptionRef = useRef('')
  const [inputResetKey, setInputResetKey] = useState(0)
  const [validity, setValidity] = useState('7') // Default to 7 days
  const [shareLinks, setShareLinks] = useState<any[]>([])
  const toast = useToastController()

  // Resolve a base URL that works on both native and web
  const getFrontendBaseUrl = () => {
    try {
      // Use window when available (web)
      if (typeof window !== 'undefined' && (window as any).location) {
        const { protocol, host } = window.location
        return `${protocol}//${host}`
      }
    } catch {}
    // Prefer Expo env var on native, fallback to Next/public, then production site
    const envUrl =
      (process as any)?.env?.EXPO_PUBLIC_FRONTEND_URL ||
      (process as any)?.env?.NEXT_PUBLIC_FRONTEND_URL
    return envUrl || 'https://gokeystone.org'
  }

  // --- Data Fetching ---
  const fetchShareLinks = async () => {
    if (!categoryId) return
    try {
      // Fetching guest links for category: categoryId
      const response = await getGuestLinks(categoryId.toString())
      // Guest links response: response

      // The response is an array of links directly, not wrapped in a 'links' property
      if (Array.isArray(response)) {
        // Setting share links: response
        setShareLinks(response)
      } else {
        // No links found in response, setting empty array
        setShareLinks([])
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error)
      toast.show('Error', { message: 'Failed to fetch existing guest links.' })
    }
  }

  // --- Event Handlers ---
  const handleCreateGuestLink = async () => {
    const currentDescription = descriptionRef.current?.trim() ?? ''
    if (!currentDescription) {
      toast.show('Heads up!', { message: 'Please add a description for the link.' })
      return
    }

    setIsCreatingLink(true)
    try {
      const expires_at = new Date()
      expires_at.setDate(expires_at.getDate() + Number.parseInt(validity, 10))

      const payload = {
        permission_level: permissionLevel,
        description: currentDescription,
        expires_at: expires_at.toISOString(),
      }

      const response = await createShareLink(categoryId.toString(), payload)

      // The backend returns the link data directly, not wrapped in shareLink property
      if (response && response.token) {
        const { token } = response
        const baseUrl = getFrontendBaseUrl()

        // Route based on permission level
        const basePath = permissionLevel === 'SUBMIT_ONLY' ? 'submitter' : 'category'
        const shareUrl = `${baseUrl}/${basePath}/${categoryId.toString()}?guestToken=${token}`

        // Handle clipboard copying for mobile
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          try {
            const { Clipboard } = require('react-native')
            await Clipboard.setString(shareUrl)
            toast.show('Success', { message: 'Guest link copied to clipboard!' })
          } catch (error) {
            // Show link in alert if clipboard fails
            Alert.alert(
              'Guest Link Created',
              `Link: ${shareUrl}\n\nPermission: ${permissionLevel === 'SUBMIT_ONLY' ? 'Submitter' : 'Reviewer'}`,
              [{ text: 'OK' }]
            )
          }
        } else {
          // For web mobile, use navigator.clipboard
          try {
            await navigator.clipboard.writeText(shareUrl)
            toast.show('Success', { message: 'Guest link copied to clipboard!' })
          } catch (error) {
            toast.show('Guest Link Created', { message: shareUrl })
          }
        }

        // Reset input without causing controlled re-renders
        descriptionRef.current = ''
        setInputResetKey((k) => k + 1)
        fetchShareLinks()
      } else {
        throw new Error('API did not return a valid link.')
      }
    } catch (error) {
      console.error('Failed to create guest link:', error)
      toast.show('Error', { message: 'Could not create the guest link.' })
    } finally {
      setIsCreatingLink(false)
    }
  }

  const handleRevokeLink = async (token: string) => {
    try {
      await revokeGuestLink(token)
      toast.show('Success', { message: 'The link has been revoked.' })
      setShareLinks((prevLinks) => prevLinks.filter((link) => link.token !== token))
    } catch (error) {
      console.error('Failed to revoke link:', error)
      toast.show('Error', { message: 'Could not revoke the link.' })
    }
  }

  const handleCopyLink = async (token: string, permission_level: string) => {
    try {
      const baseUrl = getFrontendBaseUrl()

      // Route based on permission level
      const basePath = permission_level === 'SUBMIT_ONLY' ? 'submitter' : 'category'
      const shareUrl = `${baseUrl}/${basePath}/${categoryId.toString()}?guestToken=${token}`

      // Handle clipboard copying for mobile
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const { Clipboard } = require('react-native')
          await Clipboard.setString(shareUrl)
          toast.show('Success', { message: 'Guest link copied to clipboard!' })
        } catch (error) {
          Alert.alert('Guest Link', shareUrl, [{ text: 'OK' }])
        }
      } else {
        // For web mobile, use navigator.clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.show('Success', { message: 'Guest link copied to clipboard!' })
      }
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.show('Error', { message: 'Could not copy the link.' })
    }
  }

  const handlePermissionSelect = () => {
    if (Platform.OS === 'ios') {
      const handleSelect = (permission: 'SUBMIT_ONLY' | 'REVIEW_ONLY') => {
        setTimeout(() => setPermissionLevel(permission), 0)
      }

      Alert.alert('Select Permission Level', 'Choose a permission level for the guest link', [
        {
          text: 'Submitter',
          onPress: () => handleSelect('SUBMIT_ONLY'),
          style: 'default',
        },
        {
          text: 'Reviewer',
          onPress: () => handleSelect('REVIEW_ONLY'),
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ])
    }
  }

  const handleValiditySelect = () => {
    if (Platform.OS === 'ios') {
      const handleSelect = (days: string) => {
        setTimeout(() => setValidity(days), 0)
      }

      Alert.alert('Select Link Validity', 'Choose how long the link should remain valid', [
        {
          text: '1 Day',
          onPress: () => handleSelect('1'),
          style: 'default',
        },
        {
          text: '7 Days',
          onPress: () => handleSelect('7'),
          style: 'default',
        },
        {
          text: '30 Days',
          onPress: () => handleSelect('30'),
          style: 'default',
        },
        {
          text: '90 Days',
          onPress: () => handleSelect('90'),
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ])
    }
  }

  const getValidityLabel = (value: string) => {
    switch (value) {
      case '1':
        return '1 Day'
      case '7':
        return '7 Days'
      case '30':
        return '30 Days'
      case '90':
        return '90 Days'
      default:
        return '7 Days'
    }
  }

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      fetchShareLinks()
    }
  }, [isOpen, categoryId])

  // --- Render ---
  return (
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
      <Sheet.Frame p="$4">
        <Sheet.Handle />
        <ScrollView>
          <YStack gap="$4">
            {/* Header */}
            <XStack
              items="center"
              gap="$2"
            >
              <Link size={20} />
              <H2 size="$6">Guest Link Manager</H2>
            </XStack>
            <Text color="$color11">
              Manage existing links or generate a new one to share with external collaborators.
            </Text>

            <YStack gap="$3">
              <Text
                fontWeight="bold"
                fontSize="$4"
              >
                Active Links
              </Text>
              {shareLinks.length > 0 ? (
                <YStack
                  gap="$3"
                  borderTopWidth={1}
                  borderColor="$borderColor"
                  pt="$3"
                >
                  {shareLinks.map((link) => (
                    <YStack
                      key={link.id}
                      gap="$2"
                      p="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text fontWeight="bold">{link.description || 'No description'}</Text>
                      <Text
                        fontSize="$2"
                        color="gray"
                      >
                        Expires: {new Date(link.expires_at).toLocaleDateString()}
                      </Text>
                      <Text
                        fontSize="$2"
                        color="gray"
                      >
                        Permission:{' '}
                        {link.permission_level === 'SUBMIT_ONLY' ? 'Submitter' : 'Reviewer'}
                      </Text>
                      <XStack
                        gap="$2"
                        mt="$2"
                      >
                        <Button
                          size="$2"
                          theme="blue"
                          onPress={() => handleCopyLink(link.token, link.permission_level)}
                          flex={1}
                        >
                          <Copy size={14} />
                          Copy Link
                        </Button>
                        <Button
                          size="$2"
                          theme="red"
                          onPress={() => handleRevokeLink(link.token)}
                          flex={1}
                        >
                          Revoke
                        </Button>
                      </XStack>
                    </YStack>
                  ))}
                </YStack>
              ) : (
                <Text
                  color="gray"
                  fontStyle="italic"
                >
                  No active guest links for this category.
                </Text>
              )}
            </YStack>

            <Separator />

            <YStack gap="$4">
              <Text
                fontWeight="bold"
                fontSize="$4"
              >
                Generate New Guest Link
              </Text>

              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <YStack gap="$2">
                  <Label htmlFor="link-description">Description</Label>
                  <Input
                    key={inputResetKey}
                    id="link-description"
                    defaultValue=""
                    onChangeText={(text) => {
                      descriptionRef.current = text
                    }}
                    placeholder="e.g., For external design review"
                  />
                </YStack>
              </KeyboardAvoidingView>

              <YStack gap="$3">
                <YStack gap="$2">
                  <Label>Permission Level</Label>
                  <Button
                    variant="outlined"
                    iconAfter={ChevronDown}
                    onPress={handlePermissionSelect}
                  >
                    {permissionLevel === 'SUBMIT_ONLY' ? 'Submitter' : 'Reviewer'}
                  </Button>
                </YStack>

                <YStack gap="$2">
                  <Label>Link Validity</Label>
                  <Button
                    variant="outlined"
                    iconAfter={ChevronDown}
                    onPress={handleValiditySelect}
                  >
                    {getValidityLabel(validity)}
                  </Button>
                </YStack>
              </YStack>

              <Button
                theme="green"
                icon={isCreatingLink ? <Spinner /> : <Link />}
                onPress={handleCreateGuestLink}
                disabled={isCreatingLink}
                size="$4"
              >
                {isCreatingLink ? 'Creating Link...' : 'Generate and Copy Link'}
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}

import {
  Button,
  Dialog,
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
import { useEffect, useState, useMemo } from 'react'
import Select from 'react-select'
import { useGuestLinks, useCreateShareLink, useRevokeGuestLink } from 'app/utils/queries.optimized'

// --- Component Props Interface ---
interface GuestLinkDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  categoryId: number
}

// --- Main Component ---
export function GuestLinkDialog({ isOpen, onOpenChange, categoryId }: GuestLinkDialogProps) {
  // Simple mobile detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // --- State Management ---
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [permissionLevel, setPermissionLevel] = useState<'SUBMIT_ONLY' | 'REVIEW_ONLY'>(
    'SUBMIT_ONLY'
  )
  const [description, setDescription] = useState('')
  const [validity, setValidity] = useState('7') // Default to 7 days
  const toast = useToastController()

  // Use TanStack Query hooks for guest links
  const {
    data: shareLinks = [],
    isLoading: loadingLinks,
    refetch: refetchGuestLinks,
  } = useGuestLinks(categoryId.toString(), {
    enabled: isOpen && !!categoryId,
  })

  const createShareLinkMutation = useCreateShareLink()
  const revokeGuestLinkMutation = useRevokeGuestLink()

  // --- Data Fetching ---

  // --- Event Handlers ---
  const handleCreateGuestLink = async () => {
    if (!description) {
      toast.show('Heads up!', { message: 'Please add a description for the link.' })
      return
    }

    setIsCreatingLink(true)
    try {
      const expires_at = new Date()
      expires_at.setDate(expires_at.getDate() + Number.parseInt(validity, 10))

      const payload = {
        permission_level: permissionLevel,
        description: description,
        expires_at: expires_at.toISOString(),
      }

      const response = await createShareLinkMutation.mutateAsync({
        categoryId: categoryId.toString(),
        data: payload,
      })

      // The backend returns the link data directly, not wrapped in shareLink property
      if (response && response.token) {
        const { token } = response
        const protocol = window.location.protocol
        const host = window.location.host

        // Route based on permission level
        const basePath = permissionLevel === 'SUBMIT_ONLY' ? 'submitter' : 'category'
        const categoryUrl = `${protocol}//${host}/${basePath}/${categoryId.toString()}`
        const shareUrl = `${categoryUrl}?guestToken=${token}`

        navigator.clipboard.writeText(shareUrl)
        toast.show('Success', { message: 'Guest link copied to clipboard!' })

        setDescription('')
        refetchGuestLinks()
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

  // **FIX**: The function now accepts the link's token (string) instead of the ID.
  const handleRevokeLink = async (token: string) => {
    try {
      // **FIX**: Pass the token to the API function.
      await revokeGuestLinkMutation.mutateAsync(token)
      toast.show('Success', { message: 'The link has been revoked.' })
      refetchGuestLinks()
    } catch (error) {
      console.error('Failed to revoke link:', error)
      toast.show('Error', { message: 'Could not revoke the link.' })
    }
  }

  const handleCopyLink = async (token: string, permission_level: string) => {
    try {
      const protocol = window.location.protocol
      const host = window.location.host

      // Route based on permission level
      const basePath = permission_level === 'SUBMIT_ONLY' ? 'submitter' : 'category'
      const categoryUrl = `${protocol}//${host}/${basePath}/${categoryId.toString()}`
      const shareUrl = `${categoryUrl}?guestToken=${token}`

      await navigator.clipboard.writeText(shareUrl)
      toast.show('Success', { message: 'Guest link copied to clipboard!' })
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.show('Error', { message: 'Could not copy the link.' })
    }
  }

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      refetchGuestLinks()
    }
  }, [isOpen, categoryId, refetchGuestLinks])

  const validityItems = useMemo(
    () => [
      { label: '1 Day', value: '1' },
      { label: '7 Days', value: '7' },
      { label: '30 Days', value: '30' },
      { label: '90 Days', value: '90' },
    ],
    []
  )

  const permissionOptions = useMemo(
    () => [
      { label: 'Submitter', value: 'SUBMIT_ONLY' },
      { label: 'Reviewer', value: 'REVIEW_ONLY' },
    ],
    []
  )

  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#2a2a2a',
      borderColor: '#444',
      color: '#fff',
      '&:hover': {
        borderColor: '#666',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#2a2a2a',
      border: '1px solid #444',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#444' : state.isFocused ? '#333' : '#2a2a2a',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#333',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#fff',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#aaa',
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#fff',
    }),
  }

  // --- Render ---
  if (isMobile) {
    // Mobile version using Sheet
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
        <Sheet.Frame
          p="$4"
          height="90vh"
        >
          <Sheet.Handle />
          <ScrollView
            flex={1}
            showsVerticalScrollIndicator={true}
            minH="80vh"
          >
            <YStack
              gap="$4"
              pb="$8"
            >
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

                <YStack gap="$2">
                  <Label htmlFor="link-description">Description</Label>
                  <Input
                    id="link-description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="e.g., For external design review"
                  />
                </YStack>

                <YStack gap="$3">
                  <YStack gap="$2">
                    <Label>Permission Level</Label>
                    <Button
                      variant="outlined"
                      iconAfter={ChevronDown}
                      onPress={() => {
                        const options = [
                          { label: 'Submitter', value: 'SUBMIT_ONLY' },
                          { label: 'Reviewer', value: 'REVIEW_ONLY' },
                        ]
                        // Simple mobile selection - could be enhanced with a proper picker
                        if (typeof window !== 'undefined' && window.prompt) {
                          const selection = window.prompt(
                            'Select Permission Level:\n1. Submitter\n2. Reviewer\n\nEnter 1 or 2:'
                          )
                          if (selection === '1') setPermissionLevel('SUBMIT_ONLY')
                          if (selection === '2') setPermissionLevel('REVIEW_ONLY')
                        }
                      }}
                    >
                      {permissionLevel === 'SUBMIT_ONLY' ? 'Submitter' : 'Reviewer'}
                    </Button>
                  </YStack>

                  <YStack gap="$2">
                    <Label>Link Validity</Label>
                    <Button
                      variant="outlined"
                      iconAfter={ChevronDown}
                      onPress={() => {
                        if (typeof window !== 'undefined' && window.prompt) {
                          const selection = window.prompt(
                            'Select Link Validity:\n1. 1 Day\n2. 7 Days\n3. 30 Days\n4. 90 Days\n\nEnter 1-4:'
                          )
                          const validityMap: { [key: string]: string } = {
                            '1': '1',
                            '2': '7',
                            '3': '30',
                            '4': '90',
                          }
                          if (selection && validityMap[selection]) {
                            setValidity(validityMap[selection])
                          }
                        }
                      }}
                    >
                      {validityItems.find((item) => item.value === validity)?.label || '7 Days'}
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

  // Desktop version using Dialog
  return (
    <Dialog
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
          style={{ backdropFilter: 'blur(8px)' }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={['quick', { opacity: { overshoot: -1 } }]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          width={500}
          p="$4"
        >
          {/* Header */}
          <XStack
            items="center"
            gap="$2"
            mb="$2"
          >
            <Link size={20} />
            <Dialog.Title letterSpacing="$7">Guest Link Manager</Dialog.Title>
          </XStack>
          <Dialog.Description mb="$4">
            Manage existing links or generate a new one to share with external collaborators.
          </Dialog.Description>

          <YStack
            gap="$3"
            mb="$4"
          >
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
                  <XStack
                    key={link.id}
                    justify="space-between"
                    items="center"
                    gap="$3"
                  >
                    <YStack flex={1}>
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
                    </YStack>
                    <XStack gap="$2">
                      <Button
                        size="$2"
                        theme="blue"
                        onPress={() => handleCopyLink(link.token, link.permission_level)}
                      >
                        <Copy size={14} />
                        Copy Link
                      </Button>
                      {/* **FIX**: The button now calls handleRevokeLink with the link's token. */}
                      <Button
                        size="$2"
                        theme="red"
                        onPress={() => handleRevokeLink(link.token)}
                      >
                        Revoke
                      </Button>
                    </XStack>
                  </XStack>
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

          <YStack
            gap="$4"
            mt="$4"
          >
            <Text
              fontWeight="bold"
              fontSize="$4"
            >
              Generate New Guest Link
            </Text>
            <YStack gap="$2">
              <Label htmlFor="link-description">Description</Label>
              <Input
                id="link-description"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., For external design review"
              />
            </YStack>
            <XStack gap="$3">
              <YStack
                flex={1}
                gap="$2"
              >
                <Label htmlFor="permission-level">Permission Level</Label>
                <Select
                  inputId="permission-level"
                  value={permissionOptions.find((option) => option.value === permissionLevel)}
                  onChange={(selectedOption) => setPermissionLevel(selectedOption?.value as any)}
                  options={permissionOptions}
                  placeholder="Select permission..."
                  styles={customSelectStyles}
                />
              </YStack>
              <YStack
                flex={1}
                gap="$2"
              >
                <Label htmlFor="link-validity">Link Validity</Label>
                <Select
                  inputId="link-validity"
                  value={validityItems.find((option) => option.value === validity)}
                  onChange={(selectedOption) => setValidity(selectedOption?.value || '7')}
                  options={validityItems}
                  placeholder="Select validity..."
                  styles={customSelectStyles}
                />
              </YStack>
            </XStack>
            <Button
              theme="green"
              icon={isCreatingLink ? <Spinner /> : <Link />}
              onPress={handleCreateGuestLink}
              disabled={isCreatingLink}
            >
              {isCreatingLink ? 'Creating Link...' : 'Generate and Copy Link'}
            </Button>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

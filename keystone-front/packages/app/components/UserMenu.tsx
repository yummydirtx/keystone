import React from 'react'
import { Button, H2, Paragraph, Separator, Sheet, XStack, YStack, Stack, Image } from '@my/ui'
import {
  X,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Receipt,
  Briefcase,
  FolderOpen,
} from '@tamagui/lucide-icons'
import { useAuth } from '../provider/AuthProvider'
import { useCurrentUser } from '../utils/queries.optimized'
import { useRouter } from 'solito/navigation'

interface UserMenuProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'dropdown' | 'sheet'
}

/**
 * Renders a user menu with navigation options and user account controls.
 * This component can be displayed as either a dropdown overlay or a bottom sheet,
 * providing access to user settings, help, and sign-out functionality.
 *
 * @param {object} props - The component's props.
 * @param {boolean} props.isOpen - Whether the menu is currently visible.
 * @param {function} props.onClose - Callback function to close the menu.
 * @param {'dropdown' | 'sheet'} [props.variant='sheet'] - The display variant of the menu.
 * @returns {JSX.Element} The rendered user menu component.
 *
 * @example
 * // Basic sheet-style user menu
 * <UserMenu
 *   isOpen={menuOpen}
 *   onClose={() => setMenuOpen(false)}
 * />
 *
 * @example
 * // Dropdown-style user menu for desktop
 * <UserMenu
 *   isOpen={dropdownOpen}
 *   onClose={() => setDropdownOpen(false)}
 *   variant="dropdown"
 * />
 *
 * @example
 * // Controlled by a header menu button
 * function HeaderWithMenu() {
 *   const [menuOpen, setMenuOpen] = useState(false)
 *   return (
 *     <>
 *       <Button onPress={() => setMenuOpen(true)}>Menu</Button>
 *       <UserMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
 *     </>
 *   )
 * }
 */
export function UserMenu({ isOpen, onClose, variant = 'sheet' }: UserMenuProps) {
  const { signOut, user, userProfile, getUserDisplayName } = useAuth()
  const router = useRouter()
  const { data: currentUser } = useCurrentUser()

  const handleMenuAction = (action: () => void) => {
    onClose()
    action()
  }

  const menuItems = (
    <YStack gap={variant === 'dropdown' ? '$1' : '$2'}>
      {user && (
        <Button
          size={variant === 'dropdown' ? '$3' : '$5'}
          justify="flex-start"
          icon={Receipt}
          onPress={() =>
            handleMenuAction(() => {
              router.push('/expense')
            })
          }
          variant="outlined"
          chromeless
        >
          My Expenses
        </Button>
      )}

      {user && (
        <Button
          size={variant === 'dropdown' ? '$3' : '$5'}
          justify="flex-start"
          icon={Briefcase}
          onPress={() =>
            handleMenuAction(() => {
              router.push('/workspaces')
            })
          }
          variant="outlined"
          chromeless
        >
          My Workspaces
        </Button>
      )}

      {user && (
        <Button
          size={variant === 'dropdown' ? '$3' : '$5'}
          justify="flex-start"
          icon={FolderOpen}
          onPress={() =>
            handleMenuAction(() => {
              router.push('/shared-categories')
            })
          }
          variant="outlined"
          chromeless
        >
          Shared With You
        </Button>
      )}

      <Separator />

      {user && (
        <Button
          size={variant === 'dropdown' ? '$3' : '$5'}
          justify="flex-start"
          icon={Settings}
          onPress={() =>
            handleMenuAction(() => {
              router.push('/settings')
            })
          }
          variant="outlined"
          chromeless
        >
          Settings
        </Button>
      )}

      <Button
        size={variant === 'dropdown' ? '$3' : '$5'}
        justify="flex-start"
        icon={HelpCircle}
        onPress={() =>
          handleMenuAction(() => {
            router.push('/help')
          })
        }
        variant="outlined"
        chromeless
      >
        Help & Information
      </Button>
    </YStack>
  )

  const userInfo = user && (
    <>
      <XStack
        items="center"
        gap="$3"
        p={variant === 'dropdown' ? '$2' : '$3'}
        bg="$color2"
        borderTopLeftRadius={variant === 'dropdown' ? '$3' : 8}
        borderTopRightRadius={variant === 'dropdown' ? '$3' : 8}
        borderBottomLeftRadius={variant === 'dropdown' ? '$3' : 8}
        borderBottomRightRadius={variant === 'dropdown' ? '$3' : 8}
      >
        {/* Profile picture or fallback icon */}
        {currentUser?.avatar_url || userProfile?.avatar_url || user.photoURL ? (
          <Image
            source={{
              uri: currentUser?.avatar_url || userProfile?.avatar_url || user.photoURL || '',
              width: variant === 'dropdown' ? 32 : 40,
              height: variant === 'dropdown' ? 32 : 40,
            }}
            width={variant === 'dropdown' ? 32 : 40}
            height={variant === 'dropdown' ? 32 : 40}
            borderRadius="$12"
            bg="$color4"
          />
        ) : (
          <Button
            size={variant === 'dropdown' ? '$2' : '$3'}
            circular
            icon={User}
            disabled
          />
        )}

        <YStack flex={1}>
          <Paragraph
            fontWeight="600"
            color="$color12"
            size={variant === 'dropdown' ? '$3' : undefined}
          >
            {currentUser?.name || getUserDisplayName()}
          </Paragraph>
          <Paragraph
            size={variant === 'dropdown' ? '$1' : '$2'}
            color="$color10"
          >
            {user.email}
          </Paragraph>
        </YStack>
      </XStack>
      <Separator />
    </>
  )

  const signOutButton = user && (
    <Button
      size={variant === 'dropdown' ? '$3' : '$5'}
      justify="flex-start"
      icon={LogOut}
      onPress={() =>
        handleMenuAction(() => {
          signOut()
        })
      }
      color="$red10"
      variant="outlined"
      chromeless
    >
      Sign Out
    </Button>
  )

  if (variant === 'dropdown') {
    return (
      <>
        {isOpen && (
          <>
            {/* Overlay with absolute positioning */}
            <Stack
              position="absolute"
              t={0}
              l={0}
              r={0}
              b={0}
              width="100vw"
              height="100vh"
              z={999}
              background="rgba(0,0,0,0.3)"
              animation="quick"
              opacity={1}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              onPress={onClose}
            />

            {/* Dropdown Menu */}
            <YStack
              position="absolute"
              t={60}
              r="$4"
              width={280}
              bg="$background"
              borderWidth={1}
              borderColor="$borderColor"
              borderTopLeftRadius="$4"
              borderTopRightRadius="$4"
              borderBottomLeftRadius="$4"
              borderBottomRightRadius="$4"
              p="$3"
              style={{
                zIndex: 1001,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
              gap="$2"
              animation="quick"
              opacity={1}
              enterStyle={{ opacity: 0, y: -10 }}
              exitStyle={{ opacity: 0, y: -10 }}
            >
              {userInfo}
              {menuItems}
              {user && <Separator />}
              {signOutButton}
            </YStack>
          </>
        )}
      </>
    )
  }

  // Sheet variant (for mobile)
  return (
    <Sheet
      modal
      animation="medium"
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[85]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        bg="$shadow4"
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle bg="$color8" />
      <Sheet.Frame
        bg="$background"
        p="$4"
      >
        {/* Header with close button */}
        <XStack
          justify="space-between"
          items="center"
          mb="$4"
        >
          <H2 color="$color12">Menu</H2>
          <Button
            size="$4"
            circular
            icon={X}
            onPress={onClose}
            variant="outlined"
            chromeless
          />
        </XStack>

        <YStack
          gap="$3"
          flex={1}
        >
          {userInfo}
          {menuItems}
          {user && <Separator />}
          {signOutButton}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}

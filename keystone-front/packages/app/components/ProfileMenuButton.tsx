import { useState, useEffect } from 'react'
import { XStack, Button, Image } from '@my/ui'
import { UserMenu } from './UserMenu'
import { useAuth } from '../provider/AuthProvider'
import { useCurrentUser } from '../utils/queries.optimized'

/**
 * Renders a profile menu button that shows the user's profile picture and toggles a user menu sheet.
 * This component manages the open/closed state of the menu and provides
 * a consistent header navigation experience with user profile integration.
 *
 * @returns {JSX.Element} The rendered profile menu button with associated user menu.
 *
 * @example
 * // Basic usage in a header
 * <ProfileMenuButton />
 *
 * @example
 * // Typically used within a navigation header
 * <Header>
 *   <ProfileMenuButton />
 *   <HeaderTitle>App Name</HeaderTitle>
 * </Header>
 */
export function ProfileMenuButton() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, userProfile } = useAuth()
  const { data: currentUser } = useCurrentUser()

  // This effect ensures the component re-renders when userProfile changes
  useEffect(() => {
    // The effect doesn't need to do anything, but its presence ensures
    // the component re-renders when userProfile changes
  }, [userProfile])

  const profileImageUrl = currentUser?.avatar_url || userProfile?.avatar_url || user?.photoURL

  return (
    <>
      {/* Profile picture button for the header */}
      <XStack
        justify="center"
        items="center"
      >
        {profileImageUrl ? (
          <Button
            circular
            size="$3"
            onPress={() => setMenuOpen(!menuOpen)}
            bg="transparent"
            borderColor="transparent"
            aria-label="Open user menu"
            icon={
              <Image
                source={{ uri: profileImageUrl, width: 32, height: 32 }}
                width={32}
                height={32}
                borderRadius={16}
              />
            }
          />
        ) : (
          <Button
            circular
            size="$4"
            onPress={() => setMenuOpen(!menuOpen)}
            bg="transparent"
            borderColor="transparent"
            aria-label="Open user menu"
          >
            ☰
          </Button>
        )}
      </XStack>

      <UserMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="sheet"
      />
    </>
  )
}

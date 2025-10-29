import React from 'react'
import { Button, H2, XStack } from '@my/ui'
import Image from 'next/image'
import { ProfileMenuButton } from './ProfileMenuButton'

// Add an onPress prop to be controlled by the parent
interface NavigationBarProps {
  onMenuPress: () => void
}

/**
 * Renders the main navigation bar for the application.
 * This component currently serves as a placeholder for future navigation
 * functionality and provides access to authentication state.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onMenuPress - Callback function triggered when the menu button is pressed.
 * @returns {JSX.Element} The rendered navigation bar (currently empty).
 *
 * @example
 * // Basic navigation bar with menu handler
 * <NavigationBar onMenuPress={() => setMenuOpen(true)} />
 *
 * @example
 * // Navigation bar in app layout
 * function AppLayout() {
 *   const [menuOpen, setMenuOpen] = useState(false)
 *   return (
 *     <YStack flex={1}>
 *       <NavigationBar onMenuPress={() => setMenuOpen(!menuOpen)} />
 *       <MainContent />
 *     </YStack>
 *   )
 * }
 */
export function NavigationBar({ onMenuPress }: NavigationBarProps) {
  return (
    <XStack
      position="absolute"
      t="$0"
      l="$0"
      r="$0"
      style={{ zIndex: 1000 }}
      bg="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      p="$4"
      justify="space-between"
      items="center"
      height={60}
    >
      {/* Left side - Keystone brand */}
      <XStack
        items="center"
        gap="$2"
        onPress={() => (window.location.href = '/')}
        cursor="pointer"
      >
        <Image
          src="/favicon.ico"
          width={24}
          height={24}
          style={{ borderRadius: 4 }}
          alt="Keystone logo"
        />
        <H2
          color="$color12"
          fontWeight="700"
        >
          Keystone
        </H2>
      </XStack>

      {/* Right side - Profile menu button */}
      <ProfileMenuButton />
    </XStack>
  )
}

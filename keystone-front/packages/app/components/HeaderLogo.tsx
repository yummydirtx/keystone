import React from 'react'
import { H2, XStack, Image } from '@my/ui'

/**
 * Renders the Keystone logo and brand text for use in navigation headers.
 * This component provides a consistent brand presentation across the app.
 *
 * @returns {JSX.Element} The rendered header logo with brand text.
 *
 * @example
 * // Basic usage in a header
 * <HeaderLogo />
 *
 * @example
 * // Typically used within a Stack.Screen headerTitle
 * <Stack.Screen
 *   options={{
 *     headerTitle: () => <HeaderLogo />,
 *   }}
 * />
 *
 * @param {object} props - The component props.
 * @param {string} [props.title] - Optional title to display instead of the brand name.
 */
export function HeaderLogo({ title }: { title?: string }) {
  return (
    <XStack
      items="center"
      gap="$2"
      justify="center"
    >
      <Image
        source={require('../assets/favicon.png')}
        width={24}
        height={24}
        borderRadius={4}
      />
      <H2
        color="$color12"
        fontWeight="700"
        fontSize="$7"
        letterSpacing="$8"
        paddingEnd="$1"
      >
        {title || 'Keystone'}
      </H2>
    </XStack>
  )
}

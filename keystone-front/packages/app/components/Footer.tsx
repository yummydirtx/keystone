import React from 'react'
import { YStack, XStack, Paragraph, Separator, Anchor } from '@my/ui'
import { Platform } from 'react-native'

export function Footer() {
  // Only render on web
  if (Platform.OS !== 'web') {
    return null
  }

  return (
    <YStack
      p="$4"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      mt="auto"
      display="none"
      $md={{ display: 'flex' }}
    >
      <XStack
        justify="center"
        items="center"
        gap="$4"
        flexWrap="wrap"
      >
        <Paragraph
          size="$2"
          color="$color10"
        >
          © 2025 Alex Frutkin
        </Paragraph>
        <Separator
          vertical
          height="$1"
        />
        <Anchor
          href="/privacy"
          size="$2"
          color="$color10"
          hoverStyle={{ color: '$color12' }}
        >
          Privacy Policy
        </Anchor>
        <Separator
          vertical
          height="$1"
        />
        <Anchor
          href="/terms"
          size="$2"
          color="$color10"
          hoverStyle={{ color: '$color12' }}
        >
          Terms and Conditions
        </Anchor>
      </XStack>
    </YStack>
  )
}

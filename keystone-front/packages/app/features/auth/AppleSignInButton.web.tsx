import React from 'react'
import { Button, XStack, Text } from '@my/ui'
import { AppleIcon } from './AppleIcon'

interface AppleSignInButtonProps {
  onPress: () => void
  disabled?: boolean
  style?: object
}

export const AppleSignInButton = ({ onPress, disabled = false, style }: AppleSignInButtonProps) => {
  return (
    <Button
      size="$6"
      onPress={onPress}
      disabled={disabled}
      color="white"
      bg="$black1"
      borderColor="$black12"
      hoverStyle={{
        bg: '$black11',
        borderColor: '$black11',
      }}
      pressStyle={{
        bg: '$black10',
        borderColor: '$black10',
      }}
      style={style}
    >
      <XStack
        items="center"
        gap="$2"
      >
        <AppleIcon
          width={18}
          height={18}
          color="white"
        />
        {disabled ? <Text>Signing in...</Text> : <Text color="white">Sign in with Apple</Text>}
      </XStack>
    </Button>
  )
}

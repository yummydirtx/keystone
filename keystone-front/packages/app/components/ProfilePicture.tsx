import React, { useState } from 'react'
import { Image } from '@my/ui'
import type { RadiusTokens } from '@my/ui'

interface ProfilePictureProps {
  avatarUrl?: string | null
  name?: string | null
  size?: number
  borderRadius?: RadiusTokens
}

export function ProfilePicture({
  avatarUrl,
  name,
  size = 20,
  borderRadius = '$10',
}: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false)

  // On native, if no avatar URL or image failed to load, use blank profile pic
  if (!avatarUrl || imageError) {
    return (
      <Image
        source={require('../assets/blankpfp.png')}
        width={size}
        height={size}
        borderRadius={borderRadius}
      />
    )
  }

  return (
    <Image
      source={{
        uri: avatarUrl,
        width: size,
        height: size,
      }}
      width={size}
      height={size}
      borderRadius={borderRadius}
      onError={() => setImageError(true)}
    />
  )
}

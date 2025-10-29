import React from 'react'
import Image from 'next/image'
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
  // On web, use ui-avatars.com fallback as before
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Anonymous')}&background=6b7280&color=ffffff&size=${size}`

  return (
    <Image
      src={avatarUrl || fallbackUrl}
      width={size}
      height={size}
      style={{
        borderRadius: borderRadius === '$10' ? '50%' : '8px',
        objectFit: 'cover',
      }}
      alt={`${name || 'Anonymous'} profile picture`}
      unoptimized={!avatarUrl} // Don't optimize external fallback URLs
    />
  )
}

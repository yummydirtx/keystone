import React from 'react'
import { Image } from '@my/ui'

interface AlexProfilePictureProps {
  size?: number
}

export function AlexProfilePicture({ size = 140 }: AlexProfilePictureProps) {
  return (
    <Image
      source={require('../../../assets/profilepic.jpeg')}
      width={size}
      height={size}
      borderRadius={99999}
    />
  )
}

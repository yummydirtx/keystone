import React from 'react'
import Image from 'next/image'
import profilePic from '../../../assets/profilepic.jpeg'

interface AlexProfilePictureProps {
  size?: number
}

export function AlexProfilePicture({ size = 140 }: AlexProfilePictureProps) {
  return (
    <Image
      src={profilePic}
      width={size}
      height={size}
      style={{ borderRadius: 99999, objectFit: 'cover' }}
      alt="Alex Frutkin profile picture"
      priority
    />
  )
}

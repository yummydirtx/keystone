// packages/app/features/user/components/AvatarUploader.web.tsx
import type React from 'react'
import { useState, useRef } from 'react'
import { Button, Spinner, YStack } from '@my/ui'
import Image from 'next/image'
import { Edit3 } from '@tamagui/lucide-icons'
import type { UserProfile } from 'app/types'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from 'app/provider/AuthProvider'
import { ImageCropperModal } from './ImageCropperModal'
import { dataURLtoBlob } from 'app/utils/imageUtils'

interface AvatarUploaderProps {
  userProfile: UserProfile | null
  onAvatarChange: (url: string) => void
  isUpdating: boolean
}

export function AvatarUploader({ userProfile, onAvatarChange, isUpdating }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [isCropperOpen, setCropperOpen] = useState(false)
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async (image: Blob) => {
    if (!user) return
    setUploading(true)
    setCropperOpen(false)

    try {
      const storage = getStorage()
      const storageRef = ref(storage, `avatars/${user.uid}`)

      await uploadBytes(storageRef, image)
      const downloadURL = await getDownloadURL(storageRef)
      onAvatarChange(downloadURL)
    } catch (error) {
      console.error('Error uploading image: ', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={imageSrc}
        onSave={handleImageUpload}
      />
      <YStack
        items="center"
        gap="$3"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/png, image/jpeg"
        />
        <Image
          src={
            userProfile?.avatar_url ||
            `https://ui-avatars.com/api/?name=${userProfile?.name || user?.email}&background=random`
          }
          width={150}
          height={150}
          style={{ borderRadius: '12px', objectFit: 'cover' }}
          alt="Profile avatar"
          unoptimized={!userProfile?.avatar_url} // Don't optimize external fallback URLs
        />
        {uploading || isUpdating ? (
          <Spinner />
        ) : (
          <Button
            icon={Edit3}
            onPress={handlePickImage}
          >
            Change Picture
          </Button>
        )}
      </YStack>
    </>
  )
}

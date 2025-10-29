// packages/app/features/user/components/AvatarUploader.tsx
import React, { useState } from 'react'
import { Button, Image, Spinner, YStack } from '@my/ui'
import { Edit3 } from '@tamagui/lucide-icons'
import type { UserProfile } from 'app/types'
import * as ImagePicker from 'expo-image-picker'
import { getApp } from '@react-native-firebase/app'
import { ref, putFile, getStorage, getDownloadURL } from '@react-native-firebase/storage'
import { useAuth } from 'app/provider/AuthProvider'

interface AvatarUploaderProps {
  userProfile: UserProfile | null
  onAvatarChange: (url: string) => void
  isUpdating: boolean
}

export function AvatarUploader({ userProfile, onAvatarChange, isUpdating }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true, // Allow user to crop/edit the image
      aspect: [1, 1], // Force square aspect ratio for profile pictures
      quality: 0.9,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      handleImageUpload(asset.uri)
    }
  }

  const handleImageUpload = async (uri: string) => {
    if (!user) return
    setUploading(true)

    try {
      const storage = getStorage(getApp())
      const filename = `avatars/${user.uid}`
      const reference = ref(storage, filename)

      // Use putFile() for React Native Firebase
      await putFile(reference, uri)
      const downloadURL = await getDownloadURL(reference)
      onAvatarChange(downloadURL)
    } catch (error) {
      console.error('Error uploading image: ', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <YStack
      items="center"
      gap="$3"
    >
      <Image
        source={{
          uri:
            userProfile?.avatar_url ||
            `https://ui-avatars.com/api/?name=${userProfile?.name || user?.email}&background=random`,
          width: 150,
          height: 150,
        }}
        width={150}
        height={150}
        borderRadius="$12"
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
  )
}

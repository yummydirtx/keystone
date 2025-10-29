import React, { useState } from 'react'
import { Button, XStack, YStack, Image, Text, Spinner } from '@my/ui'
import { Camera, X, Upload } from '@tamagui/lucide-icons'
import * as ImagePicker from 'expo-image-picker'

interface ReceiptPickerProps {
  onReceiptSelected: (uri: string, skipAI?: boolean) => void
  onReceiptRemoved: () => void
  selectedReceipt?: string | null
  isUploading?: boolean
  disabled?: boolean
  isRequired?: boolean
  skipAI?: boolean
}

export function ReceiptPicker({
  onReceiptSelected,
  onReceiptRemoved,
  selectedReceipt,
  isUploading = false,
  disabled = false,
  isRequired = false,
  skipAI = false,
}: ReceiptPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false)

  const handleSelectImage = async () => {
    if (disabled || isUploading) return

    setIsSelecting(true)
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionResult.granted) {
        alert('Permission to access camera roll is required!')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        aspect: undefined, // Allow any aspect ratio for receipts
      })

      if (!result.canceled) {
        onReceiptSelected(result.assets[0].uri, skipAI)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  const handleTakePhoto = async () => {
    if (disabled || isUploading) return

    setIsSelecting(true)
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
      if (!permissionResult.granted) {
        alert('Permission to access camera is required!')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        aspect: undefined,
      })

      if (!result.canceled) {
        onReceiptSelected(result.assets[0].uri, skipAI)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  if (selectedReceipt) {
    return (
      <YStack gap="$2">
        <Text fontWeight="600">Receipt Image:</Text>
        <XStack
          gap="$3"
          items="center"
        >
          <Image
            source={{
              uri: selectedReceipt as string,
              width: 80,
              height: 80,
            }}
            width={80}
            height={80}
            borderRadius="$2"
            objectFit="cover"
          />
          <YStack
            gap="$2"
            flex={1}
          >
            <Text
              fontSize="$2"
              opacity={0.7}
            >
              Receipt attached
            </Text>
            {isUploading ? (
              <XStack
                gap="$2"
                items="center"
              >
                <Spinner size="small" />
                <Text
                  fontSize="$2"
                  color="$blue10"
                >
                  Uploading...
                </Text>
              </XStack>
            ) : (
              <Button
                size="$2"
                variant="outlined"
                icon={X}
                onPress={onReceiptRemoved}
                disabled={disabled}
              >
                Remove
              </Button>
            )}
          </YStack>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack gap="$2">
      <Text fontWeight="600">Receipt {isRequired ? '(Required)' : '(Optional)'}:</Text>
      <XStack gap="$2">
        <Button
          flex={1}
          variant="outlined"
          icon={Upload}
          onPress={handleSelectImage}
          disabled={disabled || isUploading || isSelecting}
          opacity={disabled || isUploading || isSelecting ? 0.5 : 1}
        >
          {isSelecting ? 'Selecting...' : 'Choose File'}
        </Button>
        <Button
          flex={1}
          variant="outlined"
          icon={Camera}
          onPress={handleTakePhoto}
          disabled={disabled || isUploading || isSelecting}
          opacity={disabled || isUploading || isSelecting ? 0.5 : 1}
        >
          Take Photo
        </Button>
      </XStack>
    </YStack>
  )
}

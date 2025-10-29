import React, { useState } from 'react'
import { Modal, Pressable, Dimensions, Alert, Share } from 'react-native'
import { YStack, XStack, Button, Image } from '@my/ui'
import { X, Download } from '@tamagui/lucide-icons'
import * as FileSystem from 'expo-file-system'

interface ImageViewerProps {
  visible: boolean
  imageUrl: string
  onClose: () => void
}

export function ImageViewer({ visible, imageUrl, onClose }: ImageViewerProps) {
  const screenDimensions = Dimensions.get('window')
  const [imageSize, setImageSize] = useState({
    width: screenDimensions.width,
    height: screenDimensions.height * 0.8,
  })

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source
    const aspectRatio = width / height
    const maxWidth = screenDimensions.width - 40
    const maxHeight = screenDimensions.height * 0.8

    let newWidth = maxWidth
    let newHeight = newWidth / aspectRatio

    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * aspectRatio
    }

    setImageSize({ width: newWidth, height: newHeight })
  }

  const handleDownload = async () => {
    try {
      // Download the image to a temporary file
      const fileUri = FileSystem.documentDirectory + `receipt-${Date.now()}.jpg`
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri)

      if (downloadResult.status === 200) {
        // Share the actual image file
        await Share.share({
          url: downloadResult.uri,
          message: 'Receipt Image',
        })
      } else {
        throw new Error('Failed to download image')
      }
    } catch (error) {
      console.error('Error sharing image:', error)
      Alert.alert('Error', 'Failed to share the image')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <YStack
          flex={1}
          justify="center"
          items="center"
          p="$4"
          gap="$4"
        >
          {/* Action Buttons */}
          <XStack
            justify="flex-end"
            width="100%"
            position="absolute"
            t="$10"
            r="$4"
            z={10}
          >
            <XStack gap="$2">
              <Button
                icon={Download}
                circular
                size="$3"
                bg="rgba(0, 0, 0, 0.5)"
                borderColor="transparent"
                color="white"
                onPress={handleDownload}
                aria-label="Share image"
              />
              <Button
                icon={X}
                circular
                size="$3"
                bg="rgba(0, 0, 0, 0.5)"
                borderColor="transparent"
                color="white"
                onPress={onClose}
                aria-label="Close image viewer"
              />
            </XStack>
          </XStack>

          {/* Image */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Image
              source={{ uri: imageUrl }}
              width={imageSize.width}
              height={imageSize.height}
              borderRadius="$2"
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  )
}

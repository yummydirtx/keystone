import type React from 'react'
import { useState, useRef, useCallback } from 'react'
import { Button, XStack, YStack, Text, Spinner } from '@my/ui'
import Image from 'next/image'
import { Camera, X, Upload } from '@tamagui/lucide-icons'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface ReceiptPickerProps {
  onReceiptSelected: (uri: string) => void
  onReceiptRemoved: () => void
  selectedReceipt?: string | null
  isUploading?: boolean
  disabled?: boolean
  isRequired?: boolean
}

export function ReceiptPicker({
  onReceiptSelected,
  onReceiptRemoved,
  selectedReceipt,
  isUploading = false,
  disabled = false,
  isRequired = false,
}: ReceiptPickerProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          onReceiptSelected(dataUrl)
          // Clear the input value to allow selecting the same file again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        reader.onerror = () => {
          console.error('FileReader error:', reader.error)
          // Clear the input value on error too
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        reader.readAsDataURL(file)
      }
    },
    [onReceiptSelected]
  )

  const handleSelectImage = () => {
    if (disabled || isUploading) return
    if (!fileInputRef.current) return

    const input = fileInputRef.current

    // Prevent page refresh during file selection by marking window with a flag
    ;(window as any).__filePickerActive = true

    try {
      input.click()

      // Clear the flag after a delay to allow normal refresh behavior
      setTimeout(() => {
        ;(window as any).__filePickerActive = false
      }, 3000)
    } catch (error) {
      ;(window as any).__filePickerActive = false
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
            src={selectedReceipt}
            width={80}
            height={80}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
            alt="Receipt preview"
            unoptimized={selectedReceipt.startsWith('data:')} // Don't optimize data URLs
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
      <input
        key="file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
      <Button
        variant="outlined"
        icon={Upload}
        onPress={handleSelectImage}
        disabled={disabled || isUploading || isSelecting}
        opacity={disabled || isUploading || isSelecting ? 0.5 : 1}
      >
        {isSelecting ? 'Selecting...' : 'Choose Receipt Image'}
      </Button>
    </YStack>
  )
}

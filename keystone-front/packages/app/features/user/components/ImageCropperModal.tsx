import { useState, useRef } from 'react'
import { Button, Dialog, Spinner, YStack, XStack, Paragraph } from '@my/ui'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { getCroppedImg, centerAspectCrop } from 'app/utils/imageUtils'

interface ImageCropperModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onSave: (croppedImage: Blob) => void
}

export function ImageCropperModal({ isOpen, onClose, imageSrc, onSave }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [loading, setLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const aspect = 1 / 1

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  async function handleSaveCrop() {
    if (!completedCrop || !imgRef.current) {
      return
    }
    setLoading(true)
    try {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop, 'new-avatar.jpeg')
      onSave(croppedImage)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={onClose}
    >
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content key="content">
          <YStack gap="$4">
            <Dialog.Title>Crop Image</Dialog.Title>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
            <XStack
              gap="$2"
              justify="flex-end"
            >
              <Button
                onPress={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveCrop}
                disabled={!completedCrop || loading}
                icon={loading ? <Spinner /> : undefined}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

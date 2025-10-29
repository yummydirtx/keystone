import { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'

export function dataURLtoBlob(dataurl: string): Blob | null {
  if (!dataurl || !dataurl.includes(',')) {
    console.error('Invalid data URL provided to dataURLtoBlob:', dataurl)
    return null
  }
  try {
    const arr = dataurl.split(',')
    if (!arr || arr.length < 2) {
      console.error('Could not split data URL:', dataurl)
      return null
    }
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch || mimeMatch.length < 2) {
      console.error('Could not extract mime type from data URL:', arr[0])
      return null
    }
    const mime = mimeMatch[1]
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  } catch (e) {
    console.error('Error in dataURLtoBlob:', e)
    return null
  }
}

export function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  fileName: string
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = Math.floor(pixelCrop.width * scaleX)
  canvas.height = Math.floor(pixelCrop.height * scaleY)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No 2d context')
  }

  const cropX = pixelCrop.x * scaleX
  const cropY = pixelCrop.y * scaleY

  ctx.drawImage(image, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      const file = new File([blob], fileName, { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg')
  })
}

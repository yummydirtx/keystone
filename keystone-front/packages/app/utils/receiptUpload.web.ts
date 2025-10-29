import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { dataURLtoBlob } from './imageUtils'

/**
 * Upload a receipt image to Firebase Storage (Web version)
 * @param imageDataUrl - The data URL of the image
 * @param userUid - The user's Firebase UID
 * @param expenseId - Optional expense ID for organizing receipts
 * @returns Promise<{ filePath: string, downloadURL: string, gsUri: string }> - File path for DB, URLs for immediate display
 */
export async function uploadReceipt(
  imageDataUrl: string,
  userUid: string,
  expenseId?: string
): Promise<{ filePath: string; downloadURL: string; gsUri: string }> {
  const timestamp = new Date().getTime()
  const filename = expenseId
    ? `receipts/${userUid}/${expenseId}/${timestamp}.jpg`
    : `receipts/${userUid}/${timestamp}.jpg`

  // Starting receipt upload to: filename

  const blob = dataURLtoBlob(imageDataUrl)
  if (!blob) {
    throw new Error('Failed to convert image data to blob')
  }

  const storage = getStorage()
  const storageRef = ref(storage, filename)

  try {
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    })

    const downloadURL = await getDownloadURL(snapshot.ref)
    const gsUri = `gs://${snapshot.ref.bucket}/${snapshot.ref.fullPath}`

    return {
      filePath: filename, // Store this in the database
      downloadURL, // Use for immediate display
      gsUri, // Use for AI processing
    }
  } catch (error) {
    console.error('Receipt upload failed:', error)
    throw error
  }
}

/**
 * Upload a receipt image for guest users using signed URLs
 * @param imageDataUrl - The data URL of the image
 * @param guestToken - The guest authentication token
 * @returns Promise<{ filePath: string, downloadURL: string, gsUri: string }> - File path for DB, URLs for immediate display
 */
export async function uploadReceiptAsGuest(
  imageDataUrl: string,
  guestToken: string
): Promise<{ filePath: string; downloadURL: string; gsUri: string }> {
  try {
    const blob = dataURLtoBlob(imageDataUrl)
    if (!blob) {
      throw new Error('Failed to convert image data to blob')
    }

    // Determine content type from blob
    const contentType = blob.type || 'image/jpeg'

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const fileName = `receipt_${timestamp}.jpg`

    // Getting signed upload URL for guest receipt...

    // Step 1: Get signed upload URL from backend
    const { getGuestSignedUploadUrl } = await import('./api')
    const uploadData = await getGuestSignedUploadUrl(guestToken, {
      fileName,
      contentType,
    })

    const { signedUrl, filePath } = uploadData

    // Got signed URL, uploading file...

    // Step 2: Upload directly to Firebase Storage using the signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`)
    }

    // Guest receipt upload successful

    // For guest uploads, we'll generate secure URLs on-demand from the backend
    // So we return the file path for storage and a placeholder for immediate display
    const downloadURL = `/api/guest/file/${encodeURIComponent(filePath)}?token=${guestToken}`
    const gsUri = `gs://keystone-a4799.firebasestorage.app/${filePath}`

    return {
      filePath, // Store this in the database
      downloadURL, // Secure backend URL for immediate display
      gsUri, // Use for AI processing
    }
  } catch (error) {
    console.error('Guest receipt upload failed:', error)
    throw error
  }
}

/**
 * Upload multiple receipt images
 * @param imageDataUrls - Array of data URL strings
 * @param userUid - The user's Firebase UID
 * @param expenseId - Optional expense ID for organizing receipts
 * @returns Promise<Array<{ downloadURL: string, gsUri: string }>> - Array of upload results
 */
export async function uploadMultipleReceipts(
  imageDataUrls: string[],
  userUid: string,
  expenseId?: string
): Promise<Array<{ downloadURL: string; gsUri: string }>> {
  const uploadPromises = imageDataUrls.map((dataUrl) => uploadReceipt(dataUrl, userUid, expenseId))
  return Promise.all(uploadPromises)
}

/**
 * Delete a receipt from Firebase Storage
 * @param receiptUrl - The download URL of the receipt to delete
 */
export async function deleteReceipt(receiptUrl: string): Promise<void> {
  const { ref: webRef, deleteObject } = await import('firebase/storage')
  const storage = getStorage()
  const storageRef = webRef(storage, receiptUrl)
  await deleteObject(storageRef)
}

import { getApp } from '@react-native-firebase/app'
import {
  ref,
  putFile,
  getStorage,
  getDownloadURL,
  refFromURL,
} from '@react-native-firebase/storage'

/**
 * Upload a receipt image to Firebase Storage (React Native version)
 * @param imageUri - The local URI of the image
 * @param userUid - The user's Firebase UID
 * @param expenseId - Optional expense ID for organizing receipts
 * @returns Promise<{ filePath: string, downloadURL: string, gsUri: string }> - File path for DB, URLs for immediate display
 */
export async function uploadReceipt(
  imageUri: string,
  userUid: string,
  expenseId?: string
): Promise<{ filePath: string; downloadURL: string; gsUri: string }> {
  const timestamp = new Date().getTime()
  const filename = expenseId
    ? `receipts/${userUid}/${expenseId}/${timestamp}.jpg`
    : `receipts/${userUid}/${timestamp}.jpg`

  // Starting receipt upload to: filename

  try {
    const storage = getStorage(getApp())
    const reference = ref(storage, filename)
    const taskSnapshot = await putFile(reference, imageUri, {
      contentType: 'image/jpeg',
    })
    const downloadURL = await getDownloadURL(reference)

    // Create GCS URI for Vertex AI using the task snapshot metadata
    const gsUri = `gs://${taskSnapshot.metadata.bucket}/${taskSnapshot.metadata.fullPath}`

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
 * Upload multiple receipt images
 * @param imageUris - Array of image URIs
 * @param userUid - The user's Firebase UID
 * @param expenseId - Optional expense ID for organizing receipts
 * @returns Promise<Array<{ downloadURL: string, gsUri: string }>> - Array of upload results
 */
export async function uploadMultipleReceipts(
  imageUris: string[],
  userUid: string,
  expenseId?: string
): Promise<Array<{ downloadURL: string; gsUri: string }>> {
  const uploadPromises = imageUris.map((uri) => uploadReceipt(uri, userUid, expenseId))
  const results = await Promise.all(uploadPromises)
  // Return only the downloadURL and gsUri properties to match the web version
  return results.map((result) => ({
    downloadURL: result.downloadURL,
    gsUri: result.gsUri,
  }))
}

/**
 * Delete a receipt from Firebase Storage
 * @param receiptUrl - The download URL of the receipt to delete
 */
export async function deleteReceipt(receiptUrl: string): Promise<void> {
  const storage = getStorage(getApp())
  const reference = refFromURL(storage, receiptUrl)
  await reference.delete()
}

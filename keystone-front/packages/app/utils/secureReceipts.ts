// API functions imported dynamically to avoid circular dependencies

/**
 * Get a secure URL for viewing a receipt file
 * @param filePath - The file path stored in the database (e.g., "receipts/guest_user_system/file.jpg")
 * @param guestToken - Optional guest token for guest users
 * @returns Promise<string> - Secure blob URL for viewing the receipt
 */
export async function getSecureReceiptUrl(filePath: string, guestToken?: string): Promise<string> {
  try {
    // If it's already a full URL (legacy), return as-is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath
    }

    // If it's already a blob URL, return as-is
    if (filePath.startsWith('blob:')) {
      return filePath
    }

    // Requesting signed URL for receipt
    if (guestToken) {
      // Guest user - get signed URL via guest endpoint
      const { getGuestReceiptSignedUrl } = await import('./api')
      const response = await getGuestReceiptSignedUrl(guestToken, filePath)

      if (!response.signedUrl) {
        throw new Error('No signed URL returned from server')
      }

      return response.signedUrl
    }

    // Regular authenticated user - get signed URL via expense endpoint
    const { getReceiptSignedUrl } = await import('./api')
    const response = await getReceiptSignedUrl(filePath)

    if (!response.signedUrl) {
      throw new Error('No signed URL returned from server')
    }

    return response.signedUrl
  } catch (error) {
    console.error('Failed to get secure receipt URL:', error)
    throw new Error('Unable to access receipt file')
  }
}

/**
 * Check if a file path/URL is for a guest-uploaded receipt
 * @param filePath - The file path or URL
 * @returns boolean - True if it's a guest receipt
 */
export function isGuestReceipt(filePath: string): boolean {
  return filePath.includes('guest_user_system') || filePath.includes('/api/guest/file/')
}

/**
 * Extract the raw file path from a secure URL or return the path as-is
 * @param urlOrPath - Either a secure URL or file path
 * @returns string - The raw file path
 */
export function extractFilePath(urlOrPath: string): string {
  // If it's already a file path
  if (
    !urlOrPath.startsWith('http://') &&
    !urlOrPath.startsWith('https://') &&
    !urlOrPath.startsWith('/api/')
  ) {
    return urlOrPath
  }

  // Extract from legacy secure URL endpoints (deprecated)
  if (urlOrPath.includes('/api/guest/file/')) {
    const match = urlOrPath.match(/\/api\/guest\/file\/([^?]+)/)
    return match ? decodeURIComponent(match[1]) : urlOrPath
  }

  if (urlOrPath.includes('/api/expenses/file/')) {
    const match = urlOrPath.match(/\/api\/expenses\/file\/([^?]+)/)
    return match ? decodeURIComponent(match[1]) : urlOrPath
  }

  // If it's a Firebase Storage signed URL, try to extract the path
  if (urlOrPath.includes('firebasestorage.googleapis.com')) {
    try {
      const url = new URL(urlOrPath)
      const pathMatch = url.pathname.match(/\/o\/(.+)$/)
      return pathMatch ? decodeURIComponent(pathMatch[1]) : urlOrPath
    } catch {
      return urlOrPath
    }
  }

  return urlOrPath
}

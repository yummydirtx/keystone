// Copyright (c) 2025 Alex Frutkin
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (theJunkyard), to deal in
// theJunkyard without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// theJunkyard, and to permit persons to whom theJunkyard is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of theJunkyard.
//
// THEJUNKYARD IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// // COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THEJUNKYARD OR THE USE OR OTHER DEALINGS IN THEJUNKYARD.

import type { FirebaseApp } from 'firebase/app'
import type { ExpenseItem } from '../../../types'
import type { Auth } from 'firebase/auth'
import type { FirebaseAuthTypes } from '@react-native-firebase/auth'

// Define the response types from the backend
interface BackendReceiptProcessingResult {
  totalAmount: number
  transactionSummary: string
  transactionDate?: string | null
  items: Array<{
    description: string
    price: number
  }>
  confidence: number
}

interface BackendResponse {
  success: boolean
  data?: BackendReceiptProcessingResult
  error?: string
  message?: string
}

export interface ReceiptProcessingResult {
  totalAmount: number
  transactionSummary: string
  transactionDate?: string | null
  items: ExpenseItem[]
  confidence: number
}

export class ReceiptParsingService {
  private app: FirebaseApp
  private auth: Auth | FirebaseAuthTypes.Module

  constructor(app: FirebaseApp, auth: Auth | FirebaseAuthTypes.Module) {
    this.app = app
    this.auth = auth
  }

  /**
   * Parse a receipt using the backend AI service
   * @param gsUri - Google Cloud Storage URI of the receipt file
   * @param mimeType - MIME type of the receipt file
   * @param guestToken - Optional guest token for guest users
   */
  async parseReceipt(
    gsUri: string,
    mimeType: string,
    guestToken?: string
  ): Promise<ReceiptProcessingResult> {
    if (!gsUri || !mimeType) {
      throw new Error('Missing file URI or MIME type for parsing.')
    }

    try {
      // Get the current user's ID token (only for authenticated users)
      let idToken: string | null = null

      if (this.auth) {
        try {
          // For React Native Firebase, the auth module has currentUser property
          const currentUser = (this.auth as FirebaseAuthTypes.Module).currentUser
          if (currentUser) {
            // Use React Native Firebase's getIdToken method on the user object
            idToken = await currentUser.getIdToken()
          }
        } catch (tokenError) {
          console.error('[ReceiptParsingService] Failed to get ID token:', tokenError)
          throw new Error('Failed to get authentication token. Please try signing in again.')
        }
      }

      // Prepare the request payload
      const payload = {
        gsUri,
        mimeType,
      }

      // Determine the API endpoint based on authentication status
      let apiUrl = 'https://api.gokeystone.org/api/ai/parse-receipt'
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add authentication based on user type
      if (guestToken) {
        // For guest users, add token as query parameter
        apiUrl += `?token=${encodeURIComponent(guestToken)}`
      } else if (idToken) {
        // For authenticated users, add ID token as Authorization header
        headers['Authorization'] = `Bearer ${idToken}`
      } else {
        throw new Error('No authentication available. Please sign in or use a guest token.')
      }

      // Make the API request to the backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      // Parse the response
      const result: BackendResponse = await response.json()

      // Check if the request was successful
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to parse receipt')
      }

      // Transform the backend response to match the expected format
      if (!result.data) {
        throw new Error('No data received from backend')
      }

      const backendData = result.data

      // Convert items to ExpenseItem format
      const items: ExpenseItem[] = backendData.items.map((item) => ({
        name: item.description,
        description: item.description,
        price: item.price,
        quantity: 1,
      }))

      return {
        totalAmount: backendData.totalAmount,
        transactionSummary: backendData.transactionSummary,
        transactionDate: backendData.transactionDate,
        items,
        confidence: backendData.confidence,
      }
    } catch (apiError: any) {
      throw this.createUserFriendlyError(apiError)
    }
  }

  /**
   * Convert API errors to user-friendly messages
   */
  private createUserFriendlyError(apiError: any): Error {
    console.error('Receipt Parser: Error calling backend API:', apiError)

    let userMessage = `Error parsing receipt: ${apiError.message}`

    if (apiError.message?.includes('quota')) {
      userMessage = 'Receipt analysis failed: API quota exceeded.'
    } else if (apiError.message?.includes('permission')) {
      userMessage = 'Receipt analysis failed: Insufficient permissions.'
    } else if (apiError.message?.includes('invalid')) {
      userMessage = 'Receipt analysis failed: Invalid data sent to AI.'
    } else if (apiError.message?.includes('network')) {
      userMessage = 'Receipt analysis failed: Network error. Please check your connection.'
    }

    return new Error(userMessage)
  }
}

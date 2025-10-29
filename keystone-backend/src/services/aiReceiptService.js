const admin = require('../config/firebase');
const { VertexAI } = require('@google-cloud/vertexai');
const { receiptSchema } = require('../schemas/receiptProcessingSchema');

/**
 * Service for AI receipt parsing using Firebase Vertex AI
 */
class AIReceiptService {
  constructor() {
    // Initialize Vertex AI client
    this.vertexAI = null;
    this.initializeVertexAI();
  }

  /**
   * Initialize Vertex AI client
   */
  initializeVertexAI() {
    try {
      // Get the project ID from Firebase Admin configuration
      const projectId = 'keystone-a4799'; // Hardcoded project ID from firebase.js

      if (!projectId) {
        throw new Error('Project ID not found in Firebase Admin or environment variables');
      }

      // Use the same service account credentials as Firebase Admin
      const path = require('path');
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

      // Initialize Vertex AI with explicit credentials
      this.vertexAI = new VertexAI({
        project: projectId,
        location: 'us-central1', // Default location, can be changed as needed
        keyFilename: serviceAccountPath // Use the same service account as Firebase
      });

      console.log('Vertex AI initialized successfully with project:', projectId);
    } catch (error) {
      console.error('Failed to initialize Vertex AI:', error);
      this.vertexAI = null;
    }
  }

  /**
   * Parse a receipt using Vertex AI
   * @param {string} gsUri - Google Cloud Storage URI of the receipt file
   * @param {string} mimeType - MIME type of the receipt file
   * @returns {Promise<Object>} - Parsed receipt data
   */
  async parseReceipt(gsUri, mimeType) {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }

    if (!gsUri || !mimeType) {
      throw new Error('Missing file URI or MIME type for parsing');
    }

    try {
      // Get the generative model with structured output
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: receiptSchema
        }
      });

      // Define the prompt
      const prompt =
        'Extract the total amount, transaction date, a brief transaction summary (like "Groceries at Store" or "Gas at Station"), and item descriptions/prices from this receipt image/PDF. For the transaction date, look for purchase date, transaction date, or any date that represents when the transaction occurred (not printed date or other dates). Return the date in ISO 8601 format (YYYY-MM-DD). If no transaction date is found, set it to null. Include things like sales tax, shipping, and fees as an item if present.';

      // Create the request
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ fileData: { mimeType, fileUri: gsUri } }, { text: prompt }]
          }
        ]
      };

      // Generate content
      console.log('Sending request to Vertex AI with gsUri:', gsUri);
      const result = await generativeModel.generateContent(request);
      const response = result.response;

      console.log('Received response from Vertex AI');

      // Parse the structured response
      const responseText = response.candidates[0].content.parts[0].text;
      console.log('AI Response:', responseText);

      // With structured output, we should get valid JSON directly
      const parsedData = JSON.parse(responseText);

      // Process the parsed data to match our expected format
      return this.processParsedData(parsedData);
    } catch (error) {
      console.error('Error parsing receipt with AI:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details
      });
      throw this.createUserFriendlyError(error);
    }
  }

  /**
   * Process parsed data to match our expected format
   * @param {Object} data - Raw parsed data from AI
   * @returns {Object} - Processed receipt data
   */
  processParsedData(data) {
    // Ensure we have the required fields
    const processedData = {
      total_amount: data.total_amount || data.totalAmount || 0,
      transaction_summary: data.transaction_summary || data.transactionSummary || '',
      transaction_date: this.parseTransactionDate(
        data.transaction_date || data.transactionDate || data.date
      ),
      items: (data.items || []).map((item) => ({
        description: item.description || item.name || '',
        price: item.price || item.amount || 0
      }))
    };

    // Calculate confidence score
    const confidence = this.calculateConfidence(processedData);

    return {
      totalAmount: processedData.total_amount,
      transactionSummary: processedData.transaction_summary,
      transactionDate: processedData.transaction_date,
      items: processedData.items,
      confidence
    };
  }

  /**
   * Parse transaction date from AI response
   * @param {string|null} dateString - Date string from AI
   * @returns {string|null} - ISO date string or null
   */
  parseTransactionDate(dateString) {
    if (!dateString) {
      return null;
    }

    try {
      // If it's already in ISO format, validate and return
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString + 'T00:00:00.000Z');
        if (!isNaN(date.getTime())) {
          return dateString;
        }
      }

      // Try to parse various date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Return in ISO format (YYYY-MM-DD)
        return date.toISOString().split('T')[0];
      }

      return null;
    } catch (error) {
      console.warn('Failed to parse transaction date:', dateString, error);
      return null;
    }
  }

  /**
   * Calculate confidence score based on data completeness
   * @param {Object} data - Processed receipt data
   * @returns {number} - Confidence score (0-100)
   */
  calculateConfidence(data) {
    let score = 0;

    if (data.total_amount !== undefined && data.total_amount > 0) score += 35;
    if (data.transaction_summary?.trim()) score += 25;
    if (data.transaction_date) score += 15; // Add points for transaction date
    if (data.items && data.items.length > 0) score += 15;
    if (data.items?.some((item) => item.price !== undefined)) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Convert API errors to user-friendly messages
   * @param {Error} apiError - Original error from AI API
   * @returns {Error} - User-friendly error
   */
  createUserFriendlyError(apiError) {
    let userMessage = `Error parsing receipt: ${apiError.message}`;

    if (apiError.message?.includes('quota')) {
      userMessage = 'Receipt analysis failed: API quota exceeded.';
    } else if (apiError.message?.includes('permission')) {
      userMessage = 'Receipt analysis failed: Insufficient permissions.';
    } else if (apiError.message?.includes('invalid')) {
      userMessage = 'Receipt analysis failed: Invalid data sent to AI.';
    }

    return new Error(userMessage);
  }
}

module.exports = new AIReceiptService();

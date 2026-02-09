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
        location: 'us-central1',
        apiEndpoint: 'aiplatform.googleapis.com', // Explicitly set global endpoint for Gemini 3
        keyFilename: serviceAccountPath
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
        model: 'gemini-3-flash-preview',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: receiptSchema
        }
      });

      // Define the prompt
      const prompt =
        'Extract the total amount, transaction date, a brief transaction summary (like "Groceries at Store" or "Gas at Station"), and item descriptions/prices from this receipt image/PDF. For the transaction date, look ONLY for dates that represent when the transaction occurred (purchase date, transaction date, sale date). IGNORE printed dates, expiration dates, or other unrelated dates. If you can see a complete date with year (e.g., "June 13, 2024" or "06/13/2024"), return it in ISO 8601 format (YYYY-MM-DD). If you can only see the month and day without a year (e.g., "June 13" or "06/13"), return it as "MM-DD" format (e.g., "06-13"). If there is NO date visible on the receipt at all, you MUST return null for transaction_date - do NOT make up, guess, or hallucinate a date. It is better to return null than to return an incorrect date. Include things like sales tax, shipping, and fees as an item if present. Some more specific examples of brief transaction summaries: If it is a receipt from CVS or Walgreens, it should assume "Prescriptions from Walgreens" (or CVS) unless the receipt shows non-pharmacy items. For a receipt from KYLE HARWICK LMFT a good summary would be "Therapy at Kyle Harwick LMFT". For purchases from Amazon, like for example, a bird feeder, a good summary would be "Bird feeder from Amazon". For purchases from GradGuard a good summary would be "Renters Insurance from GradGuard". For purchases from a gas station where it is unclear what the purchase was for, "Gas at *station name*" is a good fallback summary.';

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
   * @param {string|null} dateString - Date string from AI (can be YYYY-MM-DD or MM-DD)
   * @returns {string|null} - ISO date string with current year if needed, or null
   */
  parseTransactionDate(dateString) {
    if (!dateString) {
      return null;
    }

    try {
      const currentYear = new Date().getFullYear();

      // If it's already in full ISO format (YYYY-MM-DD), validate and return
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString + 'T00:00:00.000Z');
        if (!isNaN(date.getTime())) {
          // Validate that the year is reasonable (between 2000 and current year + 1)
          const year = parseInt(dateString.split('-')[0], 10);
          if (year >= 2000 && year <= currentYear + 1) {
            return dateString;
          } else {
            console.warn('Date year out of reasonable range:', dateString);
            return null;
          }
        }
      }

      // If it's in MM-DD format (AI found month/day but no year), add current year
      if (typeof dateString === 'string' && /^\d{2}-\d{2}$/.test(dateString)) {
        const [month, day] = dateString.split('-');
        const fullDate = `${currentYear}-${month}-${day}`;

        // Validate the date is valid
        const date = new Date(fullDate + 'T00:00:00.000Z');
        if (!isNaN(date.getTime())) {
          console.log(`AI provided partial date ${dateString}, using current year: ${fullDate}`);
          return fullDate;
        } else {
          console.warn('Invalid partial date:', dateString);
          return null;
        }
      }

      // Try to parse other common formats that might include the year
      // But only accept if they have a 4-digit year explicitly
      const hasFourDigitYear = /\d{4}/.test(dateString);

      if (hasFourDigitYear) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const isoDate = date.toISOString().split('T')[0];
          const year = date.getFullYear();

          if (year >= 2000 && year <= currentYear + 1) {
            return isoDate;
          } else {
            console.warn('Parsed date year out of reasonable range:', dateString, 'parsed as:', isoDate);
            return null;
          }
        }
      } else {
        // Date string doesn't have a 4-digit year and isn't in MM-DD format
        // This might be something like "June 13" or "13 Jun" that the AI didn't convert
        console.warn('Date string missing year and not in MM-DD format:', dateString);
        return null;
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

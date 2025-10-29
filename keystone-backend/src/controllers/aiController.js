const aiReceiptService = require('../services/aiReceiptService');

/**
 * Controller for AI-related operations
 */

/**
 * Parse a receipt using AI
 * POST /api/ai/parse-receipt
 *
 * For authenticated users:
 *   Headers: Authorization: Bearer <firebase_id_token>
 *
 * For guest users:
 *   Query params: token=<guest_token>
 *
 * Request body:
 * {
 *   "gsUri": "gs://bucket/path/to/receipt.jpg",
 *   "mimeType": "image/jpeg"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalAmount": 25.99,
 *     "transactionSummary": "Groceries at Store",
 *     "transactionDate": "2025-01-15",
 *     "items": [
 *       {
 *         "description": "Item 1",
 *         "price": 10.99
 *       }
 *     ],
 *     "confidence": 95
 *   }
 * }
 */
const parseReceipt = async (req, res) => {
  try {
    // Extract parameters from request
    const { gsUri, mimeType } = req.body;

    // Validate required fields
    if (!gsUri) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'gsUri is required'
      });
    }

    if (!mimeType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'mimeType is required'
      });
    }

    // Validate that gsUri is a valid Google Cloud Storage URI
    if (!gsUri.startsWith('gs://')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid gsUri format. Must start with "gs://"'
      });
    }

    // Parse the receipt using AI service
    const result = await aiReceiptService.parseReceipt(gsUri, mimeType);

    // Return success response
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in parseReceipt controller:', error);

    // Return error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to parse receipt'
    });
  }
};

module.exports = {
  parseReceipt
};

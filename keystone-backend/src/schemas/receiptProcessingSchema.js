/**
 * Schema definition for structured output from Vertex AI when processing receipts
 */
const receiptSchema = {
  type: 'object',
  properties: {
    total_amount: {
      type: 'number',
      description:
        'The final total amount paid on the receipt, including tax and tips. Extract only the numerical value.'
    },
    transaction_date: {
      type: 'string',
      nullable: true,
      description:
        'The transaction date from the receipt. If the receipt shows a complete date with year (e.g., "June 13, 2024"), return it in ISO 8601 format (YYYY-MM-DD). If the receipt only shows month and day without a year (e.g., "June 13" or "06/13"), return it as "MM-DD" format (e.g., "06-13"). CRITICAL: Do NOT guess or infer the year if it is not explicitly shown on the receipt. If no date information is found at all, you MUST set this to null (not a string). Return null, not a made-up date.'
    },
    transaction_summary: {
      type: 'string',
      description:
        'A brief summary of the transaction (e.g., "Groceries at Safeway", "Gas at Shell", "Dinner at Restaurant Name", "Drinks at Vons"). Identify the merchant and general category if possible.'
    },
    items: {
      type: 'array',
      description:
        'List of items purchased. Extract the description and price (if available) for each item. Include items like sales tax, shipping, and fees if they are clearly identifiable.',
      items: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of the purchased item.'
          },
          price: {
            type: 'number',
            description:
              'Price of the item, if clearly identifiable. Extract only the numerical value.'
          }
        },
        required: ['description']
      }
    }
  },
  required: ['total_amount']
};

/**
 * Raw response from Vertex AI receipt processing
 */
const rawReceiptDataSchema = {
  total_amount: 'number',
  transaction_date: 'string|null',
  transaction_summary: 'string',
  items: 'array'
};

module.exports = {
  receiptSchema,
  rawReceiptDataSchema
};

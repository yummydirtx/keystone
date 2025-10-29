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
      description:
        'The transaction date from the receipt in ISO 8601 format (YYYY-MM-DD). Look for purchase date, transaction date, or any date that represents when the transaction occurred (not printed date or other dates). If no transaction date is found, set to null.',
      format: 'date'
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

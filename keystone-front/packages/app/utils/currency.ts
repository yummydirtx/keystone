/**
 * Utility function to format currency amounts with proper comma separation
 * @param amount - The numeric amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US'): string => {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Utility function to format numbers with comma separation (no currency symbol)
 * @param amount - The numeric amount to format
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted number string with commas
 */
export const formatNumber = (amount: number, locale = 'en-US'): string => {
  return amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

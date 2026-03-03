/**
 * Formats a number as currency. Returns a dash if the value is null or undefined.
 * @param value The number to format
 * @param currency The currency symbol to use (defaults to '$')
 * @returns Formatted currency string or '-' for null/undefined values
 */
export const formatCurrency = (value: number | null | undefined, currency = '$'): string => {
  if (value === null || value === undefined) return '-';
  return `${currency}${value.toFixed(2)}`;
};

/**
 * Formats a date as a string. Returns a dash if the value is null or undefined.
 * @param date The date to format
 * @returns Formatted date string or '-' for null/undefined values
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  // Append T12:00:00 to date-only strings (YYYY-MM-DD) to prevent
  // timezone shift — new Date("2025-07-04") parses as midnight UTC,
  // which becomes the previous day in US timezones.
  const safeDateStr = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
  return new Date(safeDateStr).toLocaleDateString();
}; 
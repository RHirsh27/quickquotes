/**
 * Basic input sanitization utilities
 * Removes dangerous characters and trims whitespace
 */

/**
 * Sanitizes a string input by:
 * - Trimming whitespace
 * - Removing null bytes
 * - Removing control characters (except newlines, tabs, carriage returns)
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n, \r, \t
}

/**
 * Sanitizes an email address
 */
export function sanitizeEmail(input: string | null | undefined): string {
  return sanitizeString(input).toLowerCase()
}

/**
 * Sanitizes a phone number (keeps only digits, spaces, dashes, parentheses, plus)
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return ''
  return sanitizeString(input).replace(/[^\d\s\-\(\)\+]/g, '')
}

/**
 * Sanitizes a number input (removes non-numeric characters except decimal point and minus)
 */
export function sanitizeNumber(input: string | null | undefined): string {
  if (!input) return ''
  return sanitizeString(input).replace(/[^\d\.\-]/g, '')
}

/**
 * Sanitizes text that may contain HTML (basic XSS prevention)
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return ''
  return sanitizeString(input)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}


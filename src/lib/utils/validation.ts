/**
 * Validation utilities for form inputs
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates phone number (basic - allows various formats)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  // Allow 10-15 digits (international format)
  return digits.length >= 10 && digits.length <= 15
}

/**
 * Validates password strength
 * Returns: { valid: boolean, strength: 'weak' | 'medium' | 'strong', feedback: string[] }
 */
export function validatePassword(password: string): {
  valid: boolean
  strength: 'weak' | 'medium' | 'strong'
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 6) {
    feedback.push('Password must be at least 6 characters')
    return { valid: false, strength: 'weak', feedback }
  }

  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('Add special characters (!@#$%^&*)')

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 5) strength = 'strong'
  else if (score >= 3) strength = 'medium'

  const valid = password.length >= 6 && score >= 3

  return { valid, strength, feedback }
}

/**
 * Validates a required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Validates a number is positive
 */
export function isPositiveNumber(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num > 0
}

/**
 * Validates a number is non-negative
 */
export function isNonNegativeNumber(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num >= 0
}


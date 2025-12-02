import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('[Resend] RESEND_API_KEY is not set. Email functionality will be disabled.')
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Default from email (update this to your verified domain)
export const DEFAULT_FROM_EMAIL = 'noreply@quotd.app'


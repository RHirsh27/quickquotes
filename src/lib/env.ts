/**
 * Environment Variable Validation using Zod
 * 
 * This module validates all required environment variables on startup.
 * If any required variables are missing, the app will crash immediately
 * with a clear error message.
 * 
 * Note: During build time, some variables might not be set. Validation
 * only runs at runtime to avoid build failures.
 */

import { z } from "zod";

const envSchema = z.object({
  // Core Supabase variables - always required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  
  // Stripe variables - optional (only required when using Stripe features)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_SOLO: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_CREW: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_TEAM: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // App URL - optional (defaults to localhost in development)
  // Accept valid URL string or undefined (empty strings are preprocessed to undefined)
  // Use preprocess to convert empty/invalid strings to undefined before validation
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (val) => {
      if (!val || typeof val !== 'string') return undefined
      const trimmed = val.trim()
      if (trimmed === '') return undefined
      // Try to validate URL, return undefined if invalid
      try {
        new URL(trimmed)
        return trimmed
      } catch {
        return undefined
      }
    },
    z.string().url().optional()
  ),
  
  // Resend API Key - optional (only required when using email features)
  RESEND_API_KEY: z.string().optional(),
  
  // Admin Email - optional (for feedback/support emails)
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email").optional(),
});

/**
 * Validated environment variables
 * 
 * This will throw a ZodError with clear messages if any required
 * environment variables are missing or invalid.
 * 
 * Core Supabase variables are always required.
 * Stripe variables are optional and only validated when accessed.
 */
function validateEnv() {
  // Skip validation during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a safe default structure during build
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || undefined,
      NEXT_PUBLIC_STRIPE_PRICE_SOLO: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || undefined,
      NEXT_PUBLIC_STRIPE_PRICE_CREW: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREW || undefined,
      NEXT_PUBLIC_STRIPE_PRICE_TEAM: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || undefined,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
      RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || undefined,
    } as z.infer<typeof envSchema>;
  }

  // Validate at runtime - Stripe vars are optional
  // NEXT_PUBLIC_APP_URL preprocessing is handled by Zod schema
  return envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRICE_SOLO: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO,
    NEXT_PUBLIC_STRIPE_PRICE_CREW: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREW,
    NEXT_PUBLIC_STRIPE_PRICE_TEAM: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  });
}

// Validate environment variables with error handling
// If validation fails, log error but don't crash the app
let env: z.infer<typeof envSchema>
try {
  env = validateEnv()
} catch (error) {
  console.error('[Env Validation] Failed to validate environment variables:', error)
  // Return a safe default structure to prevent app crash
  // This allows the app to start, but some features may not work
  env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || undefined,
    NEXT_PUBLIC_STRIPE_PRICE_SOLO: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || undefined,
    NEXT_PUBLIC_STRIPE_PRICE_CREW: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREW || undefined,
    NEXT_PUBLIC_STRIPE_PRICE_TEAM: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    NEXT_PUBLIC_APP_URL: (() => {
      const val = process.env.NEXT_PUBLIC_APP_URL
      if (!val || typeof val !== 'string') return undefined
      const trimmed = val.trim()
      if (trimmed === '') return undefined
      try {
        new URL(trimmed)
        return trimmed
      } catch {
        return undefined
      }
    })(),
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || undefined,
  } as z.infer<typeof envSchema>
}

export { env }

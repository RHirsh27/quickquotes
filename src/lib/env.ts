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
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_STRIPE_PRICE_SOLO: z.string().min(1, "NEXT_PUBLIC_STRIPE_PRICE_SOLO is required"),
  NEXT_PUBLIC_STRIPE_PRICE_TEAM: z.string().min(1, "NEXT_PUBLIC_STRIPE_PRICE_TEAM is required"),
  NEXT_PUBLIC_STRIPE_PRICE_BUSINESS: z.string().min(1, "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

/**
 * Validated environment variables
 * 
 * This will throw a ZodError with clear messages if any required
 * environment variables are missing or invalid.
 * 
 * Only validates at runtime (not during build) to allow builds
 * without all env vars set.
 */
function validateEnv() {
  // Skip validation during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a safe default structure during build
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      NEXT_PUBLIC_STRIPE_PRICE_SOLO: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || '',
      NEXT_PUBLIC_STRIPE_PRICE_TEAM: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || '',
      NEXT_PUBLIC_STRIPE_PRICE_BUSINESS: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    } as z.infer<typeof envSchema>;
  }

  // Validate at runtime
  return envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRICE_SOLO: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO,
    NEXT_PUBLIC_STRIPE_PRICE_TEAM: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
    NEXT_PUBLIC_STRIPE_PRICE_BUSINESS: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export const env = validateEnv();

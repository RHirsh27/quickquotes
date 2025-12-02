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
  // Preprocess empty strings to undefined, then validate as URL or undefined
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional()
  ),
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
    } as z.infer<typeof envSchema>;
  }

  // Validate at runtime - Stripe vars are optional
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
  });
}

export const env = validateEnv();

# Stripe Connect Migration Instructions

## Error Fix: "syntax error at or near 'use client'"

**Problem:** You accidentally copied a TypeScript file into the SQL editor instead of the SQL migration file.

**Solution:** Use the SQL content below, NOT the TypeScript file.

---

## Correct SQL to Run

Copy and paste **ONLY** the SQL below into Supabase SQL Editor:

```sql
-- ============================================================================
-- MIGRATION: Add Stripe Connect ID to Users Table
-- ============================================================================
-- This migration adds stripe_connect_id column to track Stripe Connect accounts
-- for tradespeople to receive payouts
-- ============================================================================

-- Step 1: Add stripe_connect_id column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_id ON public.users (stripe_connect_id) WHERE stripe_connect_id IS NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.users.stripe_connect_id IS 'Stripe Connect Account ID (e.g., acct_1234567890) for receiving payouts';
```

---

## Steps to Run

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**
2. **Click "New Query"**
3. **Copy the SQL above** (starting from `-- ============================================================================`)
4. **Paste into the SQL Editor**
5. **Click "Run"** (or press Ctrl+Enter)

---

## What NOT to Do

❌ **DO NOT** copy from:
- `src/app/(dashboard)/settings/payments/page.tsx` (This is TypeScript!)
- Any `.tsx` or `.ts` file
- Any file that starts with `'use client'`

✅ **DO** copy from:
- `supabase-migration-stripe-connect.sql` (The SQL file)
- Files ending in `.sql`

---

## Verification

After running, verify the migration worked:

1. Go to **Table Editor** → `users` table
2. Check that `stripe_connect_id` column exists
3. It should be type `text` and nullable

---

## If You Still Get Errors

1. Make sure you're in the **SQL Editor** (not the Table Editor)
2. Make sure you copied the **entire SQL block** above
3. Check that there are no extra characters or code before/after the SQL
4. Try running it line by line if needed


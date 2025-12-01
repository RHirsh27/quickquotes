# Fix: Database Error Saving New User

## Problem
When signing up a new user, you get a "Database error saving new user" error.

## Root Cause
The `handle_new_user()` trigger function tries to insert address fields (`address_line_1`, `city`, `state`, `postal_code`) into the `users` table, but these columns don't exist if you only ran `supabase-setup.sql` without running `supabase-upgrade-address.sql` first.

## Solution

### Option 1: Run the Updated Setup Script (Recommended)
The `supabase-setup.sql` file has been updated to include all address fields from the start. Simply:

1. **Run the updated `supabase-setup.sql`** in Supabase SQL Editor
   - This will create the table with all columns
   - The `handle_new_user()` function will work correctly

### Option 2: Run the Address Upgrade Migration
If you've already run `supabase-setup.sql`, run the address upgrade:

1. **Run `supabase-upgrade-address.sql`** in Supabase SQL Editor
   - This adds the missing address columns
   - Updates the `handle_new_user()` function

### Option 3: Manual Fix
If you prefer to fix it manually, run this SQL:

```sql
-- Add missing address columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, company_name, phone, address_line_1, city, state, postal_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_line_1', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verification

After applying the fix, test by:

1. **Sign up a new user** through the signup form
2. **Check the `users` table** in Supabase Table Editor
3. **Verify** that the user record was created with all fields populated

## What Was Fixed

- ✅ `users` table now includes all address fields from the start
- ✅ `handle_new_user()` function matches the signup form data
- ✅ No more "column does not exist" errors during signup


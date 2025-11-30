# Fix "Missing Quote" Issue - RLS Policy Fix

If you're experiencing quotes being saved but not visible in the history, this is likely a Row Level Security (RLS) policy issue.

## Quick Fix

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** (icon on the left sidebar)
3. Copy and paste the contents of `supabase-fix-rls-quotes.sql`
4. Click **Run** (or press Ctrl+Enter)

This will:
- Fix the SELECT policy for quotes table
- Fix the SELECT policy for customers table  
- Fix the SELECT policy for quote_line_items table

## Verify the Fix

After running the SQL:
1. Go to **Table Editor** in Supabase
2. Click on the `quotes` table
3. You should see your quotes there
4. Refresh your app - quotes should now appear in the history

## What This Does

The SQL script ensures that:
- Users can view their own quotes (`auth.uid() = user_id`)
- Users can view their own customers
- Users can view line items for their own quotes

This fixes the issue where quotes are saved successfully but don't appear in the UI due to overly strict RLS policies.


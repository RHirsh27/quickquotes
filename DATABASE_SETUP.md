# Database Setup Instructions

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://cmjhtwyhchzquepzamuk.supabase.co
   - Navigate to **SQL Editor**

2. **Run the Setup Script**
   - Copy the entire contents of `supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase
   - You should see these tables:
     - `users`
     - `customers`
     - `service_presets`
     - `quotes`
     - `quote_line_items`

## What the Script Does

✅ Creates all 5 database tables  
✅ Sets up Row Level Security (RLS)  
✅ Creates RLS policies so users can only access their own data  
✅ Creates a trigger to automatically create a `users` row when someone signs up  
✅ Creates default service presets for new users  

## Testing

After running the script:

1. Try signing up a new user in the app
2. Check the `users` table - you should see a new row
3. Check the `service_presets` table - you should see 3 default presets for that user

## Fix RLS Policies (If You Can't See Your Data)

If you're experiencing 400 errors or can't see your quotes/customers, run the RLS fix script:

1. Open **SQL Editor** in Supabase
2. Copy and run the contents of `supabase-fix-rls-policies.sql`
3. This will ensure the SELECT policies are correctly set up

## Troubleshooting

If you get errors:
- Make sure you're running the script in the Supabase SQL Editor
- Check that you have the correct permissions
- If tables already exist, the script uses `IF NOT EXISTS` so it's safe to run again
- If policies already exist, the script uses `DROP POLICY IF EXISTS` so it's safe to run again


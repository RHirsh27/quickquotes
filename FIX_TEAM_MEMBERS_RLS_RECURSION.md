# Fix: Infinite Recursion in team_members RLS Policy

## Problem
When saving a quote, the application was throwing an error:
```
Error saving quote: infinite recursion detected in policy for relation "team_members"
```

## Root Cause
The RLS policy on `team_members` was checking team membership by querying `team_members` itself, creating infinite recursion:

```sql
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members  -- This queries team_members again!
      WHERE user_id = auth.uid()
    )
  );
```

When inserting a quote:
1. RLS checks if user can insert into `quotes` table
2. Policy checks if `team_id` belongs to user's teams
3. This requires querying `team_members` table
4. Querying `team_members` triggers its RLS policy
5. Policy queries `team_members` again → infinite loop

## Solution

### 1. Fix RLS Policy (SQL)
Created `supabase-fix-team-members-rls-recursion.sql` that:
- Drops the recursive policy
- Creates a `SECURITY DEFINER` function `user_belongs_to_team()` that bypasses RLS
- Creates a new policy that uses the function to avoid recursion

**Run this SQL script in Supabase SQL Editor:**
```bash
supabase-fix-team-members-rls-recursion.sql
```

### 2. Fix Code to Set team_id
Updated `src/app/(dashboard)/quotes/new/page.tsx` to:
- Fetch user's `team_id` before creating customers/quotes
- Set `team_id` when inserting customers and quotes
- Handle cases where team_id might not be found

## Steps to Apply Fix

1. **Run the SQL migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste contents of `supabase-fix-team-members-rls-recursion.sql`
   - Execute the script

2. **Code changes are already applied:**
   - The quote creation code now sets `team_id` automatically
   - No additional action needed

## Testing
After applying the fix:
1. Try creating a new quote
2. Try creating a new customer
3. Both should work without recursion errors

## Notes
- The `SECURITY DEFINER` function runs with elevated privileges, bypassing RLS
- This is safe because the function only checks `auth.uid()` which is secure
- The function is marked `STABLE` for query optimization


-- ============================================================================
-- FIX: Infinite Recursion in team_members RLS Policy
-- ============================================================================
-- Problem: The team_members SELECT policy references team_members itself,
--          causing infinite recursion when checking access.
-- Solution: Use a SECURITY DEFINER function to bypass RLS when checking
--          team membership, preventing recursion.
-- ============================================================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;

-- Create a helper function that bypasses RLS to check team membership
-- SECURITY DEFINER means it runs with the privileges of the function creator,
-- bypassing RLS policies, which prevents recursion
CREATE OR REPLACE FUNCTION public.user_belongs_to_team(check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Now create a simple policy that uses the function
-- This avoids recursion because the function bypasses RLS
CREATE POLICY "Users can view team members"
  ON public.team_members FOR SELECT
  USING (
    -- User viewing their own membership (direct check, no recursion)
    user_id = auth.uid()
    OR
    -- User viewing members of a team they belong to (using SECURITY DEFINER function)
    public.user_belongs_to_team(team_id)
  );

-- ============================================================================
-- FIX COMPLETE
-- ============================================================================
-- The recursion was caused by the policy checking team_members, which
-- triggered the same policy again. Now we use:
-- 1. Direct user_id check for own memberships (no recursion)
-- 2. SECURITY DEFINER function for checking team membership (bypasses RLS)
-- ============================================================================


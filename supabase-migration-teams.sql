-- ============================================================================
-- MIGRATION: Add Teams (Multi-Tenancy Support)
-- ============================================================================
-- This migration adds team support to enable multi-user collaboration.
-- It safely migrates existing data and updates all RLS policies.
-- ============================================================================

-- Step 1: Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Step 3: Add team_id to existing tables
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.service_presets 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Note: quote_line_items don't need team_id directly - they inherit from quotes
-- But we can add it for consistency if needed (optional)
-- ALTER TABLE public.quote_line_items 
--   ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Step 4: Data Backfill
-- For each existing user, create a team and link them as owner
DO $$
DECLARE
  user_record RECORD;
  new_team_id UUID;
  user_company_name TEXT;
BEGIN
  FOR user_record IN 
    SELECT id, company_name FROM public.users
  LOOP
    -- Get company name or use default
    user_company_name := COALESCE(user_record.company_name, 'My Team');
    
    -- Create a team for this user
    INSERT INTO public.teams (name)
    VALUES (user_company_name)
    RETURNING id INTO new_team_id;
    
    -- Add user as owner of the team
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, user_record.id, 'owner')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    -- Update all customers for this user
    UPDATE public.customers
    SET team_id = new_team_id
    WHERE user_id = user_record.id AND team_id IS NULL;
    
    -- Update all quotes for this user
    UPDATE public.quotes
    SET team_id = new_team_id
    WHERE user_id = user_record.id AND team_id IS NULL;
    
    -- Update all service presets for this user
    UPDATE public.service_presets
    SET team_id = new_team_id
    WHERE user_id = user_record.id AND team_id IS NULL;
  END LOOP;
END $$;

-- Step 5: Make team_id NOT NULL after backfill (with a safety check)
-- First, ensure all rows have team_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.customers WHERE team_id IS NULL
    UNION ALL
    SELECT 1 FROM public.quotes WHERE team_id IS NULL
    UNION ALL
    SELECT 1 FROM public.service_presets WHERE team_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Data migration incomplete: Some rows still have NULL team_id';
  END IF;
END $$;

-- Now make team_id required
ALTER TABLE public.customers 
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.quotes 
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.service_presets 
  ALTER COLUMN team_id SET NOT NULL;

-- Step 6: Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;

DROP POLICY IF EXISTS "Users can view own presets" ON public.service_presets;
DROP POLICY IF EXISTS "Users can insert own presets" ON public.service_presets;
DROP POLICY IF EXISTS "Users can update own presets" ON public.service_presets;
DROP POLICY IF EXISTS "Users can delete own presets" ON public.service_presets;

-- Step 7: Create new team-based RLS policies for teams table
CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Step 8: Create new team-based RLS policies for team_members table
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Team owners can update members"
  ON public.team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Team owners can remove members"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    AND role != 'owner' -- Can't delete the owner
  );

-- Step 9: Create new team-based RLS policies for customers
CREATE POLICY "Team members can view team customers"
  ON public.customers FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert team customers"
  ON public.customers FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team customers"
  ON public.customers FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete team customers"
  ON public.customers FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Step 10: Create new team-based RLS policies for quotes
CREATE POLICY "Team members can view team quotes"
  ON public.quotes FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert team quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team quotes"
  ON public.quotes FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete team quotes"
  ON public.quotes FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Step 11: Create new team-based RLS policies for service_presets
CREATE POLICY "Team members can view team presets"
  ON public.service_presets FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert team presets"
  ON public.service_presets FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team presets"
  ON public.service_presets FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete team presets"
  ON public.service_presets FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Step 12: Create helper function to get user's team(s)
CREATE OR REPLACE FUNCTION public.get_user_teams()
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    tm.role,
    t.created_at
  FROM public.teams t
  INNER JOIN public.team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = auth.uid()
  ORDER BY t.created_at DESC;
END;
$$;

-- Step 13: Create helper function to get user's primary team (first team they own, or first team they're a member of)
CREATE OR REPLACE FUNCTION public.get_user_primary_team()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  primary_team_id UUID;
BEGIN
  -- First, try to get a team where user is owner
  SELECT t.id INTO primary_team_id
  FROM public.teams t
  INNER JOIN public.team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = auth.uid() AND tm.role = 'owner'
  ORDER BY t.created_at ASC
  LIMIT 1;
  
  -- If no owner team, get any team they're a member of
  IF primary_team_id IS NULL THEN
    SELECT t.id INTO primary_team_id
    FROM public.teams t
    INNER JOIN public.team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = auth.uid()
    ORDER BY t.created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN primary_team_id;
END;
$$;

-- Step 14: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_customers_team_id ON public.customers(team_id);
CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_service_presets_team_id ON public.service_presets(team_id);

-- Step 15: Update the handle_new_user trigger to create a team for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
  user_company_name TEXT;
BEGIN
  -- Get company name from metadata or use default
  user_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Team');
  
  -- Create user profile
  INSERT INTO public.users (id, full_name, company_name, phone, address_line_1, city, state, postal_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_company_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_line_1', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', '')
  );
  
  -- Create a team for the new user
  INSERT INTO public.teams (name)
  VALUES (user_company_name)
  RETURNING id INTO new_team_id;
  
  -- Add user as owner of the team
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 16: Update create_default_presets to use team_id instead of user_id
CREATE OR REPLACE FUNCTION public.create_default_presets()
RETURNS TRIGGER AS $$
DECLARE
  user_team_id UUID;
BEGIN
  -- Get the user's primary team
  SELECT get_user_primary_team() INTO user_team_id;
  
  -- If no team found, try to get team from team_members
  IF user_team_id IS NULL THEN
    SELECT team_id INTO user_team_id
    FROM public.team_members
    WHERE user_id = NEW.id
    LIMIT 1;
  END IF;
  
  -- Only create presets if we have a team
  IF user_team_id IS NOT NULL THEN
    INSERT INTO public.service_presets (team_id, name, default_price, default_taxable)
    VALUES
      (user_team_id, 'Service Call', 75.00, true),
      (user_team_id, 'Labor - Hourly', 85.00, true),
      (user_team_id, 'Material', 0.00, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Notes:
-- 1. All existing users now have their own team
-- 2. All existing data has been migrated to use team_id
-- 3. RLS policies now check team membership instead of user_id
-- 4. New users will automatically get a team created on signup
-- 5. Use get_user_teams() or get_user_primary_team() in your frontend
-- ============================================================================


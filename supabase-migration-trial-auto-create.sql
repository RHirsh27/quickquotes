-- Migration: Automatically Create Trial Subscription on Signup
-- Purpose: When a new user signs up, automatically give them a 14-day trial
-- Author: Production Readiness Update
-- Date: 2025-12-02

-- Step 1: Update handle_new_user function to create trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
  user_company_name TEXT;
  trial_end_date TIMESTAMPTZ;
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

  -- Create default service presets for the new user's team
  INSERT INTO public.service_presets (team_id, user_id, name, default_price, default_taxable)
  VALUES
    (new_team_id, NEW.id, 'Service Call', 95.00, true),
    (new_team_id, NEW.id, 'Hourly Rate', 85.00, true),
    (new_team_id, NEW.id, 'Materials', 0.00, true),
    (new_team_id, NEW.id, 'Consultation', 150.00, true);

  -- ⭐ NEW: Create 14-day trial subscription
  trial_end_date := NOW() + INTERVAL '14 days';

  INSERT INTO public.subscriptions (
    user_id,
    status,
    is_trial,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    'trialing',
    true,
    trial_end_date
  );

  RAISE NOTICE 'Created 14-day trial for user %', NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: Trial subscriptions will be created automatically on signup';
  RAISE NOTICE '✅ New users will get 14 days of full access';
END $$;

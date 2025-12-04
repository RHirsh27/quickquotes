-- ============================================================================
-- MIGRATION: Fintech Risk Profile Data Collection
-- ============================================================================
-- This migration adds tables and columns to collect operational data for
-- building risk profiles for potential lending/fintech features.
-- 
-- Features:
-- 1. Granular status logging (job_activity_logs) - tracks every lifecycle event
-- 2. Quote item classification (item_type enum) - materials vs labor
-- 3. Metric aggregation table (team_fintech_metrics) - calculated performance data
-- 4. Soft KYC data (teams table) - entity verification fields
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUM TYPE FOR ITEM TYPES
-- ============================================================================
CREATE TYPE item_type_enum AS ENUM ('labor', 'materials', 'service', 'other');

-- ============================================================================
-- 2. ADD item_type COLUMN TO quote_line_items TABLE
-- ============================================================================
ALTER TABLE public.quote_line_items
  ADD COLUMN IF NOT EXISTS item_type item_type_enum NOT NULL DEFAULT 'service';

-- Add comment for documentation
COMMENT ON COLUMN public.quote_line_items.item_type IS 'Classification of line item: labor, materials, service, or other. Used for risk profile analysis.';

-- ============================================================================
-- 3. ADD item_type COLUMN TO invoice_items TABLE (if exists)
-- ============================================================================
-- Check if invoice_items table exists before adding column
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_items') THEN
    ALTER TABLE public.invoice_items
      ADD COLUMN IF NOT EXISTS item_type item_type_enum NOT NULL DEFAULT 'service';
    
    COMMENT ON COLUMN public.invoice_items.item_type IS 'Classification of line item: labor, materials, service, or other. Used for risk profile analysis.';
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE job_activity_logs TABLE (Status History / "Black Box")
-- ============================================================================
-- This table tracks every lifecycle event for quotes (and future jobs)
-- Uses entity_type/entity_id pattern for flexibility
CREATE TABLE IF NOT EXISTS public.job_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('quote', 'job', 'invoice')),
  entity_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_activity_logs_entity ON public.job_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_job_activity_logs_created_at ON public.job_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_activity_logs_changed_by ON public.job_activity_logs(changed_by);

-- Add comments for documentation
COMMENT ON TABLE public.job_activity_logs IS 'Granular status logging for quotes/jobs/invoices. Tracks every lifecycle event for risk profile analysis.';
COMMENT ON COLUMN public.job_activity_logs.entity_type IS 'Type of entity: quote, job, or invoice';
COMMENT ON COLUMN public.job_activity_logs.entity_id IS 'ID of the entity (quote_id, job_id, or invoice_id)';
COMMENT ON COLUMN public.job_activity_logs.previous_status IS 'Previous status before change (nullable for initial status)';
COMMENT ON COLUMN public.job_activity_logs.new_status IS 'New status after change';
COMMENT ON COLUMN public.job_activity_logs.changed_by IS 'User ID who made the change';
COMMENT ON COLUMN public.job_activity_logs.metadata IS 'JSONB field for additional context (reschedule reason, location coords, etc.)';

-- ============================================================================
-- 5. CREATE DATABASE TRIGGER FOR QUOTE STATUS CHANGES
-- ============================================================================
-- Function to log quote status changes automatically
CREATE OR REPLACE FUNCTION public.log_quote_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_activity_logs (
      entity_type,
      entity_id,
      previous_status,
      new_status,
      changed_by,
      metadata
    )
    VALUES (
      'quote',
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.user_id, -- Use quote's user_id as changed_by (can be updated via API if needed)
      jsonb_build_object(
        'quote_number', NEW.quote_number,
        'total', NEW.total
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on quotes table
DROP TRIGGER IF EXISTS trigger_log_quote_status_change ON public.quotes;
CREATE TRIGGER trigger_log_quote_status_change
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_quote_status_change();

-- ============================================================================
-- 6. CREATE team_fintech_metrics TABLE (The "Shadow Score")
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_fintech_metrics (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  avg_quote_to_job_hours NUMERIC, -- Speed of closing deals (hours from quote sent to accepted)
  avg_job_completion_hours NUMERIC, -- Speed of doing work (hours from job start to completion)
  cancellation_rate NUMERIC, -- Percentage of quotes/jobs cancelled (0.0 to 1.0)
  on_time_completion_rate NUMERIC, -- Percentage of jobs completed on time (0.0 to 1.0)
  avg_response_time_hours NUMERIC, -- Average time to respond to customer inquiries
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_team_fintech_metrics_last_calculated ON public.team_fintech_metrics(last_calculated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.team_fintech_metrics IS 'Aggregated performance metrics for risk profile analysis. Calculated periodically from job_activity_logs and quotes data.';
COMMENT ON COLUMN public.team_fintech_metrics.avg_quote_to_job_hours IS 'Average hours from quote sent to quote accepted (velocity metric)';
COMMENT ON COLUMN public.team_fintech_metrics.avg_job_completion_hours IS 'Average hours from job start to completion (velocity metric)';
COMMENT ON COLUMN public.team_fintech_metrics.cancellation_rate IS 'Percentage of quotes/jobs cancelled (reliability metric, 0.0 to 1.0)';
COMMENT ON COLUMN public.team_fintech_metrics.on_time_completion_rate IS 'Percentage of jobs completed on time (reliability metric, 0.0 to 1.0)';
COMMENT ON COLUMN public.team_fintech_metrics.avg_response_time_hours IS 'Average hours to respond to customer inquiries (reliability metric)';
COMMENT ON COLUMN public.team_fintech_metrics.last_calculated_at IS 'Timestamp when metrics were last calculated';

-- ============================================================================
-- 7. ADD KYC FIELDS TO teams TABLE
-- ============================================================================
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('LLC', 'Sole Prop', 'Corp', 'Partnership', 'Other')),
  ADD COLUMN IF NOT EXISTS ein_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS established_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN public.teams.entity_type IS 'Legal entity type: LLC, Sole Prop, Corp, Partnership, or Other';
COMMENT ON COLUMN public.teams.ein_verified IS 'Whether the EIN (Employer Identification Number) has been verified';
COMMENT ON COLUMN public.teams.website_url IS 'Company website URL for verification';
COMMENT ON COLUMN public.teams.established_date IS 'Date the business was established';

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS) ON NEW TABLES
-- ============================================================================

-- Enable RLS on job_activity_logs
ALTER TABLE public.job_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team members can view activity logs for their team's quotes/jobs
DROP POLICY IF EXISTS "Team members can view activity logs" ON public.job_activity_logs;
CREATE POLICY "Team members can view activity logs"
  ON public.job_activity_logs FOR SELECT
  USING (
    -- For quotes
    (entity_type = 'quote' AND EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.team_members tm ON tm.team_id = q.team_id
      WHERE q.id = job_activity_logs.entity_id
      AND tm.user_id = auth.uid()
    ))
    OR
    -- For invoices (if exists)
    (entity_type = 'invoice' AND EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON tm.team_id = i.team_id
      WHERE i.id = job_activity_logs.entity_id
      AND tm.user_id = auth.uid()
    ))
    -- Note: 'job' entity_type support will be added when jobs table is created
    -- For now, jobs table doesn't exist, so we skip that check
  );

-- RLS Policy: System can insert activity logs (via triggers)
DROP POLICY IF EXISTS "System can insert activity logs" ON public.job_activity_logs;
CREATE POLICY "System can insert activity logs"
  ON public.job_activity_logs FOR INSERT
  WITH CHECK (true); -- Triggers run as SECURITY DEFINER, so this allows inserts

-- Enable RLS on team_fintech_metrics
ALTER TABLE public.team_fintech_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team members can view their team's metrics
DROP POLICY IF EXISTS "Team members can view team metrics" ON public.team_fintech_metrics;
CREATE POLICY "Team members can view team metrics"
  ON public.team_fintech_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_fintech_metrics.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- RLS Policy: System can update metrics (via background jobs/functions)
DROP POLICY IF EXISTS "System can update team metrics" ON public.team_fintech_metrics;
CREATE POLICY "System can update team metrics"
  ON public.team_fintech_metrics FOR UPDATE
  USING (true); -- Background jobs will use SECURITY DEFINER functions

DROP POLICY IF EXISTS "System can insert team metrics" ON public.team_fintech_metrics;
CREATE POLICY "System can insert team metrics"
  ON public.team_fintech_metrics FOR INSERT
  WITH CHECK (true); -- Background jobs will use SECURITY DEFINER functions

-- ============================================================================
-- 9. CREATE FUNCTION TO CALCULATE TEAM METRICS
-- ============================================================================
-- This function can be called periodically (via cron job or API) to update metrics
CREATE OR REPLACE FUNCTION public.calculate_team_fintech_metrics(p_team_id UUID)
RETURNS void AS $$
DECLARE
  v_avg_quote_to_job_hours NUMERIC;
  v_avg_job_completion_hours NUMERIC;
  v_cancellation_rate NUMERIC;
  v_on_time_completion_rate NUMERIC;
  v_avg_response_time_hours NUMERIC;
BEGIN
  -- Calculate average quote-to-job hours (from quote sent to accepted)
  SELECT AVG(EXTRACT(EPOCH FROM (accepted_log.created_at - sent_log.created_at)) / 3600.0)
  INTO v_avg_quote_to_job_hours
  FROM public.quotes q
  JOIN public.job_activity_logs sent_log ON sent_log.entity_id = q.id AND sent_log.entity_type = 'quote' AND sent_log.new_status = 'sent'
  JOIN public.job_activity_logs accepted_log ON accepted_log.entity_id = q.id AND accepted_log.entity_type = 'quote' AND accepted_log.new_status = 'accepted'
  WHERE q.team_id = p_team_id
    AND accepted_log.created_at > sent_log.created_at;

  -- Calculate cancellation rate (quotes declined / total quotes)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE status = 'declined')::NUMERIC / COUNT(*)::NUMERIC
      ELSE 0
    END
  INTO v_cancellation_rate
  FROM public.quotes
  WHERE team_id = p_team_id
    AND status IN ('accepted', 'declined');

  -- Note: avg_job_completion_hours and on_time_completion_rate will be calculated
  -- when jobs table is implemented. For now, set to NULL.
  v_avg_job_completion_hours := NULL;
  v_on_time_completion_rate := NULL;
  v_avg_response_time_hours := NULL;

  -- Upsert metrics
  INSERT INTO public.team_fintech_metrics (
    team_id,
    avg_quote_to_job_hours,
    avg_job_completion_hours,
    cancellation_rate,
    on_time_completion_rate,
    avg_response_time_hours,
    last_calculated_at,
    updated_at
  )
  VALUES (
    p_team_id,
    v_avg_quote_to_job_hours,
    v_avg_job_completion_hours,
    v_cancellation_rate,
    v_on_time_completion_rate,
    v_avg_response_time_hours,
    NOW(),
    NOW()
  )
  ON CONFLICT (team_id) DO UPDATE SET
    avg_quote_to_job_hours = EXCLUDED.avg_quote_to_job_hours,
    avg_job_completion_hours = EXCLUDED.avg_job_completion_hours,
    cancellation_rate = EXCLUDED.cancellation_rate,
    on_time_completion_rate = EXCLUDED.on_time_completion_rate,
    avg_response_time_hours = EXCLUDED.avg_response_time_hours,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_team_fintech_metrics IS 'Calculates and updates fintech metrics for a team. Call periodically via cron job or API endpoint.';

-- ============================================================================
-- 10. CREATE INITIAL LOG ENTRY FOR EXISTING QUOTES (Optional)
-- ============================================================================
-- This creates an initial log entry for existing quotes with their current status
-- This is optional but helps establish baseline data
INSERT INTO public.job_activity_logs (entity_type, entity_id, previous_status, new_status, changed_by, metadata)
SELECT 
  'quote',
  id,
  NULL, -- No previous status for initial entry
  status,
  user_id,
  jsonb_build_object('quote_number', quote_number, 'total', total, 'initial_log', true)
FROM public.quotes
WHERE NOT EXISTS (
  SELECT 1 FROM public.job_activity_logs
  WHERE entity_type = 'quote' AND entity_id = quotes.id
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Created item_type_enum and added to quote_line_items and invoice_items
-- ✅ Created job_activity_logs table for granular status tracking
-- ✅ Created database trigger to automatically log quote status changes
-- ✅ Created team_fintech_metrics table for aggregated performance data
-- ✅ Added KYC fields to teams table
-- ✅ Enabled RLS policies on new tables
-- ✅ Created function to calculate team metrics
-- ✅ Created initial log entries for existing quotes
-- ============================================================================


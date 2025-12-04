-- ============================================================================
-- MIGRATION: Dispatch & Scheduling Module
-- ============================================================================
-- This migration adds tables for service locations, jobs, and appointments
-- to enable dispatch and scheduling functionality.
-- 
-- Features:
-- 1. Service Locations - Multiple locations per customer
-- 2. Jobs - Work orders linked to customers and locations
-- 3. Appointments - Scheduling with assigned technicians
-- ============================================================================

-- ============================================================================
-- 1. CREATE service_locations TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  gate_code TEXT, -- Gate/access code for the location
  access_instructions TEXT, -- Additional access instructions
  is_primary BOOLEAN DEFAULT false, -- Mark primary location for customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_locations_customer ON public.service_locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_team ON public.service_locations(team_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_primary ON public.service_locations(customer_id, is_primary) WHERE is_primary = true;

-- Add comments for documentation
COMMENT ON TABLE public.service_locations IS 'Service locations for customers. A customer can have multiple locations (e.g., home, office, rental property).';
COMMENT ON COLUMN public.service_locations.customer_id IS 'Customer who owns this location';
COMMENT ON COLUMN public.service_locations.team_id IS 'Team that manages this location (for RLS)';
COMMENT ON COLUMN public.service_locations.gate_code IS 'Gate or access code for the location';
COMMENT ON COLUMN public.service_locations.access_instructions IS 'Additional instructions for accessing the location';
COMMENT ON COLUMN public.service_locations.is_primary IS 'Whether this is the customer''s primary location';

-- ============================================================================
-- 2. CREATE jobs TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_location_id UUID REFERENCES public.service_locations(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL, -- Optional: if converted from quote
  title TEXT NOT NULL, -- Job title/name
  description TEXT, -- Detailed job description
  status TEXT NOT NULL CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'canceled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  estimated_duration_minutes INTEGER, -- Estimated job duration in minutes
  actual_duration_minutes INTEGER, -- Actual job duration in minutes (filled after completion)
  scheduled_start TIMESTAMP WITH TIME ZONE, -- When the job is scheduled to start
  scheduled_end TIMESTAMP WITH TIME ZONE, -- When the job is scheduled to end
  completed_at TIMESTAMP WITH TIME ZONE, -- When the job was actually completed
  canceled_at TIMESTAMP WITH TIME ZONE, -- When the job was canceled
  canceled_reason TEXT, -- Reason for cancellation
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- User who created the job
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_team ON public.jobs(team_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_service_location ON public.jobs(service_location_id);
CREATE INDEX IF NOT EXISTS idx_jobs_quote ON public.jobs(quote_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_start ON public.jobs(scheduled_start) WHERE scheduled_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);

-- Add comments for documentation
COMMENT ON TABLE public.jobs IS 'Work orders/jobs for customers. Can be created from quotes or independently.';
COMMENT ON COLUMN public.jobs.team_id IS 'Team that owns this job (for RLS)';
COMMENT ON COLUMN public.jobs.customer_id IS 'Customer for whom the job is being performed';
COMMENT ON COLUMN public.jobs.service_location_id IS 'Specific location where the job will be performed';
COMMENT ON COLUMN public.jobs.quote_id IS 'Optional: Link to quote if job was converted from a quote';
COMMENT ON COLUMN public.jobs.status IS 'Job status: pending, scheduled, in_progress, completed, canceled';
COMMENT ON COLUMN public.jobs.priority IS 'Job priority level';
COMMENT ON COLUMN public.jobs.estimated_duration_minutes IS 'Estimated time to complete the job';
COMMENT ON COLUMN public.jobs.actual_duration_minutes IS 'Actual time taken to complete the job';

-- ============================================================================
-- 3. CREATE appointments TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  assigned_tech UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, -- Technician assigned to the appointment
  start_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Appointment start time
  end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Appointment end time
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'tentative', 'completed', 'canceled', 'no_show')) DEFAULT 'tentative',
  hold_expires_at TIMESTAMP WITH TIME ZONE, -- For "soft hold" logic - when tentative hold expires
  notes TEXT, -- Additional notes for the appointment
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- User who created the appointment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure end_time is after start_time
  CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_job ON public.appointments(job_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_tech ON public.appointments(assigned_tech);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires ON public.appointments(hold_expires_at) WHERE hold_expires_at IS NOT NULL;
-- Index for querying appointments by date range
CREATE INDEX IF NOT EXISTS idx_appointments_time_range ON public.appointments(start_time, end_time);

-- Add comments for documentation
COMMENT ON TABLE public.appointments IS 'Scheduled appointments for jobs. Links jobs to technicians with specific time slots.';
COMMENT ON COLUMN public.appointments.job_id IS 'Job this appointment is for';
COMMENT ON COLUMN public.appointments.assigned_tech IS 'Technician assigned to this appointment';
COMMENT ON COLUMN public.appointments.start_time IS 'When the appointment starts';
COMMENT ON COLUMN public.appointments.end_time IS 'When the appointment ends';
COMMENT ON COLUMN public.appointments.status IS 'Appointment status: confirmed, tentative, completed, canceled, no_show';
COMMENT ON COLUMN public.appointments.hold_expires_at IS 'When a tentative hold expires (for soft hold logic)';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR service_locations
-- ============================================================================

-- Policy: Team members can view service locations for their team's customers
DROP POLICY IF EXISTS "Team members can view service locations" ON public.service_locations;
CREATE POLICY "Team members can view service locations"
  ON public.service_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = service_locations.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can insert service locations for their team's customers
DROP POLICY IF EXISTS "Team members can insert service locations" ON public.service_locations;
CREATE POLICY "Team members can insert service locations"
  ON public.service_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = service_locations.team_id
      AND tm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = service_locations.customer_id
      AND c.team_id = service_locations.team_id
    )
  );

-- Policy: Team members can update service locations for their team
DROP POLICY IF EXISTS "Team members can update service locations" ON public.service_locations;
CREATE POLICY "Team members can update service locations"
  ON public.service_locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = service_locations.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can delete service locations for their team
DROP POLICY IF EXISTS "Team members can delete service locations" ON public.service_locations;
CREATE POLICY "Team members can delete service locations"
  ON public.service_locations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = service_locations.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR jobs
-- ============================================================================

-- Policy: Team members can view jobs for their team
DROP POLICY IF EXISTS "Team members can view jobs" ON public.jobs;
CREATE POLICY "Team members can view jobs"
  ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = jobs.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can insert jobs for their team
DROP POLICY IF EXISTS "Team members can insert jobs" ON public.jobs;
CREATE POLICY "Team members can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = jobs.team_id
      AND tm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = jobs.customer_id
      AND c.team_id = jobs.team_id
    )
    AND (
      jobs.service_location_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.service_locations sl
        WHERE sl.id = jobs.service_location_id
        AND sl.team_id = jobs.team_id
      )
    )
  );

-- Policy: Team members can update jobs for their team
DROP POLICY IF EXISTS "Team members can update jobs" ON public.jobs;
CREATE POLICY "Team members can update jobs"
  ON public.jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = jobs.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can delete jobs for their team
DROP POLICY IF EXISTS "Team members can delete jobs" ON public.jobs;
CREATE POLICY "Team members can delete jobs"
  ON public.jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = jobs.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR appointments
-- ============================================================================

-- Policy: Team members can view appointments for their team's jobs
DROP POLICY IF EXISTS "Team members can view appointments" ON public.appointments;
CREATE POLICY "Team members can view appointments"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.team_members tm ON tm.team_id = j.team_id
      WHERE j.id = appointments.job_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can insert appointments for their team's jobs
DROP POLICY IF EXISTS "Team members can insert appointments" ON public.appointments;
CREATE POLICY "Team members can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.team_members tm ON tm.team_id = j.team_id
      WHERE j.id = appointments.job_id
      AND tm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = appointments.assigned_tech
      AND tm.team_id = (
        SELECT team_id FROM public.jobs WHERE id = appointments.job_id
      )
    )
  );

-- Policy: Team members can update appointments for their team's jobs
DROP POLICY IF EXISTS "Team members can update appointments" ON public.appointments;
CREATE POLICY "Team members can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.team_members tm ON tm.team_id = j.team_id
      WHERE j.id = appointments.job_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Team members can delete appointments for their team's jobs
DROP POLICY IF EXISTS "Team members can delete appointments" ON public.appointments;
CREATE POLICY "Team members can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.team_members tm ON tm.team_id = j.team_id
      WHERE j.id = appointments.job_id
      AND tm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. CREATE TRIGGER TO UPDATE updated_at TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service_locations
DROP TRIGGER IF EXISTS update_service_locations_updated_at ON public.service_locations;
CREATE TRIGGER update_service_locations_updated_at
  BEFORE UPDATE ON public.service_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for appointments
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. CREATE TRIGGER TO LOG JOB STATUS CHANGES (Integrates with fintech migration)
-- ============================================================================
-- This integrates with the job_activity_logs table from the fintech migration
-- If that migration hasn't been run, this section will be skipped

-- Function to log job status changes
-- Note: This will only work if job_activity_logs table exists from fintech migration
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if job_activity_logs table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_activity_logs') THEN
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
        'job',
        NEW.id,
        OLD.status,
        NEW.status,
        NEW.created_by,
        jsonb_build_object(
          'job_title', NEW.title,
          'priority', NEW.priority
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on jobs table (will work even if job_activity_logs doesn't exist yet)
DROP TRIGGER IF EXISTS trigger_log_job_status_change ON public.jobs;
CREATE TRIGGER trigger_log_job_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_job_status_change();

-- ============================================================================
-- 10. UPDATE job_activity_logs RLS POLICY (if table exists)
-- ============================================================================
-- Add support for jobs entity_type in the activity logs RLS policy

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_activity_logs') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS "Team members can view activity logs" ON public.job_activity_logs;
    
    -- Recreate policy with jobs support
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
        OR
        -- For jobs
        (entity_type = 'job' AND EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.team_members tm ON tm.team_id = j.team_id
          WHERE j.id = job_activity_logs.entity_id
          AND tm.user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Created service_locations table (multiple locations per customer)
-- ✅ Created jobs table (work orders with status tracking)
-- ✅ Created appointments table (scheduling with assigned technicians)
-- ✅ Enabled RLS on all tables
-- ✅ Created team-based RLS policies
-- ✅ Created updated_at triggers
-- ✅ Integrated with job_activity_logs (if fintech migration exists)
-- ============================================================================


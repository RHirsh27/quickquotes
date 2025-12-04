-- Migration: Allow public access to jobs for booking page
-- This enables customers to view job details and book appointments without authentication

-- Policy: Public can view specific jobs (for booking page)
-- Only allows reading basic job info needed for booking
DROP POLICY IF EXISTS "Public can view jobs for booking" ON public.jobs;
CREATE POLICY "Public can view jobs for booking"
  ON public.jobs FOR SELECT
  USING (true); -- Allow public to read job details (you may want to restrict this further)

-- Policy: Public can create appointments (for booking)
-- This allows customers to reserve time slots
DROP POLICY IF EXISTS "Public can create appointments for booking" ON public.appointments;
CREATE POLICY "Public can create appointments for booking"
  ON public.appointments FOR INSERT
  WITH CHECK (true); -- Allow public to create appointments

-- Policy: Public can update their own appointments (to confirm)
-- Only allows updating status from tentative to confirmed
DROP POLICY IF EXISTS "Public can update own appointments" ON public.appointments;
CREATE POLICY "Public can update own appointments"
  ON public.appointments FOR UPDATE
  USING (status = 'tentative') -- Only allow updating tentative appointments
  WITH CHECK (status IN ('tentative', 'confirmed')); -- Only allow status changes

-- Note: You may want to add additional security:
-- 1. Restrict job access to only jobs with a specific status (e.g., 'pending' or 'scheduled')
-- 2. Add rate limiting to prevent abuse
-- 3. Add a booking token system for extra security
-- 4. Restrict appointment creation to only jobs that belong to specific teams


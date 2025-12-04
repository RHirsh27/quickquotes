-- Migration: Add reminder_sent column to appointments table
-- This enables tracking whether appointment reminders have been sent

-- Add reminder_sent column
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false NOT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent 
ON public.appointments(reminder_sent) 
WHERE reminder_sent = false;

-- Add index for reminder queries (status + start_time + reminder_sent)
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_query 
ON public.appointments(status, start_time, reminder_sent) 
WHERE status = 'confirmed' AND reminder_sent = false;

-- Add comment
COMMENT ON COLUMN public.appointments.reminder_sent IS 'Whether a reminder email has been sent for this appointment';


'use server'

import { createClient } from '@/lib/supabase/server'

export interface AvailableSlot {
  startTime: string // ISO string
  endTime: string // ISO string
}

export interface GetAvailableSlotsResult {
  success: boolean
  message?: string
  slots?: AvailableSlot[]
}

/**
 * Get available time slots for customer self-scheduling
 * 
 * @param date - The date to check for availability
 * @param durationMinutes - Duration of the appointment in minutes
 * @param teamId - The team ID to check availability for
 * @returns Array of available time slots
 */
export async function getAvailableSlots(
  date: Date,
  durationMinutes: number,
  teamId: string
): Promise<GetAvailableSlotsResult> {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!date || !teamId || !durationMinutes || durationMinutes <= 0) {
      return {
        success: false,
        message: 'Invalid input parameters.'
      }
    }

    // Set working hours (8 AM - 6 PM)
    const WORK_START_HOUR = 8
    const WORK_END_HOUR = 18
    const SLOT_INTERVAL_MINUTES = 30 // Generate slots every 30 minutes

    // Create date boundaries for the day (start of day in team's timezone, assume UTC for now)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // First, get all job IDs for this team
    const { data: teamJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('team_id', teamId)

    if (jobsError) {
      console.error('Error fetching team jobs:', jobsError)
      return {
        success: false,
        message: 'Failed to fetch team jobs.'
      }
    }

    const jobIds = teamJobs?.map(job => job.id) || []

    if (jobIds.length === 0) {
      // No jobs for this team, all slots are available
      // Continue to generate slots
    }

    // Fetch all confirmed appointments for this team on this date
    const { data: confirmedAppointments, error: confirmedError } = jobIds.length > 0
      ? await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('status', 'confirmed')
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .in('job_id', jobIds)
      : { data: [], error: null }

    if (confirmedError) {
      console.error('Error fetching confirmed appointments:', confirmedError)
      return {
        success: false,
        message: 'Failed to fetch confirmed appointments.'
      }
    }

    // Fetch all tentative appointments that are still held (hold_expires_at > now)
    const now = new Date()
    const { data: tentativeAppointments, error: tentativeError } = jobIds.length > 0
      ? await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('status', 'tentative')
          .gt('hold_expires_at', now.toISOString())
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .in('job_id', jobIds)
      : { data: [], error: null }

    if (tentativeError) {
      console.error('Error fetching tentative appointments:', tentativeError)
      return {
        success: false,
        message: 'Failed to fetch tentative appointments.'
      }
    }

    // Combine all blocked time slots
    const blockedSlots: Array<{ start: Date; end: Date }> = []
    
    // Add confirmed appointments
    if (confirmedAppointments) {
      confirmedAppointments.forEach((apt) => {
        blockedSlots.push({
          start: new Date(apt.start_time),
          end: new Date(apt.end_time)
        })
      })
    }

    // Add tentative appointments (active holds)
    if (tentativeAppointments) {
      tentativeAppointments.forEach((apt) => {
        blockedSlots.push({
          start: new Date(apt.start_time),
          end: new Date(apt.end_time)
        })
      })
    }

    // Generate all possible time slots for the day
    const availableSlots: AvailableSlot[] = []
    const currentSlot = new Date(startOfDay)
    currentSlot.setHours(WORK_START_HOUR, 0, 0, 0)

    const endOfWorkingDay = new Date(startOfDay)
    endOfWorkingDay.setHours(WORK_END_HOUR, 0, 0, 0)

    // Generate slots every 30 minutes
    while (currentSlot < endOfWorkingDay) {
      const slotStart = new Date(currentSlot)
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000)

      // Check if this slot would extend beyond working hours
      if (slotEnd > endOfWorkingDay) {
        break
      }

      // Check if this slot overlaps with any blocked time
      const hasOverlap = blockedSlots.some((blocked) => {
        // Overlap occurs if:
        // - slot starts before blocked ends AND slot ends after blocked starts
        return slotStart < blocked.end && slotEnd > blocked.start
      })

      // Also check if slot is in the past (for today)
      const isPast = slotStart < now

      if (!hasOverlap && !isPast) {
        availableSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString()
        })
      }

      // Move to next slot (30 minutes later)
      currentSlot.setMinutes(currentSlot.getMinutes() + SLOT_INTERVAL_MINUTES)
    }

    return {
      success: true,
      slots: availableSlots
    }
  } catch (error: any) {
    console.error('Error in getAvailableSlots:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

export interface ReserveSlotResult {
  success: boolean
  message: string
  appointmentId?: string
}

/**
 * Reserve a time slot for customer self-scheduling
 * Creates a tentative appointment with a 10-minute hold
 * 
 * @param jobId - The job ID to create appointment for
 * @param startTime - Start time (ISO string or Date)
 * @param endTime - End time (ISO string or Date)
 * @returns Appointment ID if successful
 */
export async function reserveSlot(
  jobId: string,
  startTime: string | Date,
  endTime: string | Date
): Promise<ReserveSlotResult> {
  try {
    const supabase = await createClient()

    // Get current user (optional - for customer self-scheduling, might not be authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Validate inputs
    if (!jobId || !startTime || !endTime) {
      return {
        success: false,
        message: 'Missing required parameters.'
      }
    }

    // Convert to Date objects if strings
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime

    // Validate times
    if (end <= start) {
      return {
        success: false,
        message: 'End time must be after start time.'
      }
    }

    // Check if job exists and get team_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('team_id, customer_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        message: 'Job not found.'
      }
    }

    // Check if slot is still available (no overlapping confirmed or active tentative appointments)
    const now = new Date()
    
    // Check for confirmed appointments that overlap
    const { data: confirmedConflicts, error: confirmedConflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('job_id', jobId)
      .eq('status', 'confirmed')
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())

    // Check for active tentative appointments that overlap
    const { data: tentativeConflicts, error: tentativeConflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('job_id', jobId)
      .eq('status', 'tentative')
      .gt('hold_expires_at', now.toISOString())
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())

    if (confirmedConflictError || tentativeConflictError) {
      console.error('Error checking for conflicts:', confirmedConflictError || tentativeConflictError)
      return {
        success: false,
        message: 'Failed to check slot availability.'
      }
    }

    const conflictingAppointments = [
      ...(confirmedConflicts || []),
      ...(tentativeConflicts || [])
    ]

    if (conflictingAppointments.length > 0) {
      return {
        success: false,
        message: 'This time slot is no longer available.'
      }
    }

    // Set hold expiration to 10 minutes from now
    const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    // Create tentative appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        job_id: jobId,
        assigned_tech: null, // Will be assigned later by dispatcher
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'tentative',
        hold_expires_at: holdExpiresAt.toISOString(),
        created_by: user?.id || null
      })
      .select('id')
      .single()

    if (appointmentError || !appointment) {
      console.error('Error creating appointment:', appointmentError)
      return {
        success: false,
        message: appointmentError?.message || 'Failed to reserve time slot.'
      }
    }

    return {
      success: true,
      message: 'Time slot reserved successfully. You have 10 minutes to complete booking.',
      appointmentId: appointment.id
    }
  } catch (error: any) {
    console.error('Error in reserveSlot:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Confirm a reserved appointment (convert from tentative to confirmed)
 */
export async function confirmAppointment(
  appointmentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()

    // Update appointment status to confirmed and clear hold_expires_at
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'confirmed',
        hold_expires_at: null
      })
      .eq('id', appointmentId)
      .eq('status', 'tentative') // Only update if still tentative

    if (error) {
      console.error('Error confirming appointment:', error)
      return {
        success: false,
        message: error.message || 'Failed to confirm appointment.'
      }
    }

    return {
      success: true,
      message: 'Appointment confirmed successfully!'
    }
  } catch (error: any) {
    console.error('Error in confirmAppointment:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

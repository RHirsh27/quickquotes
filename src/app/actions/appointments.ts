'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateAppointmentResult {
  success: boolean
  message: string
  appointmentId?: string
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: {
  jobId: string
  techId: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'tentative'
  notes?: string | null
}): Promise<CreateAppointmentResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to create an appointment.'
      }
    }

    // Fetch the job to verify it belongs to the user's team
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('team_id')
      .eq('id', data.jobId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        message: 'Job not found.'
      }
    }

    // Verify tech is a team member
    const { data: techMember, error: techError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', data.techId)
      .eq('team_id', job.team_id)
      .maybeSingle()

    if (techError || !techMember) {
      return {
        success: false,
        message: 'Technician is not a member of this team.'
      }
    }

    // Validate times
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (end <= start) {
      return {
        success: false,
        message: 'End time must be after start time.'
      }
    }

    // Set hold_expires_at for tentative appointments (24 hours from now)
    const holdExpiresAt = data.status === 'tentative' 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        job_id: data.jobId,
        assigned_tech: data.techId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: data.status,
        hold_expires_at: holdExpiresAt,
        notes: data.notes || null,
        created_by: user.id
      })
      .select('id')
      .single()

    if (appointmentError || !appointment) {
      console.error('Error creating appointment:', appointmentError)
      return {
        success: false,
        message: appointmentError?.message || 'Failed to create appointment.'
      }
    }

    // Update job status to 'scheduled' if it's currently 'pending'
    await supabase
      .from('jobs')
      .update({ status: 'scheduled' })
      .eq('id', data.jobId)
      .eq('status', 'pending')

    // Revalidate paths
    revalidatePath('/schedule')
    revalidatePath('/jobs')
    revalidatePath(`/jobs/${data.jobId}`)

    return {
      success: true,
      message: 'Appointment created successfully!',
      appointmentId: appointment.id
    }
  } catch (error: any) {
    console.error('Error in createAppointment:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}


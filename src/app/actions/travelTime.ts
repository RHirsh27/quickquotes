'use server'

import { createClient } from '@/lib/supabase/server'
import { getTravelTime, type Location } from '@/lib/maps/travelTime'

export interface TravelTimeWarning {
  type: 'conflict' | 'tight' | 'ok'
  message: string
  requiredMinutes: number
  availableMinutes: number
}

export interface CheckTravelTimeResult {
  success: boolean
  warnings: TravelTimeWarning[]
  previousAppointment?: {
    id: string
    endTime: string
    location: Location | null
  }
  nextAppointment?: {
    id: string
    startTime: string
    location: Location | null
  }
}

/**
 * Check travel time conflicts for a proposed appointment
 * 
 * @param techId - Technician user ID
 * @param jobId - Job ID for the new appointment
 * @param startTime - Proposed start time (ISO string)
 * @param endTime - Proposed end time (ISO string)
 * @returns Travel time warnings and adjacent appointment info
 */
export async function checkTravelTimeConflicts(
  techId: string,
  jobId: string,
  startTime: string,
  endTime: string
): Promise<CheckTravelTimeResult> {
  try {
    const supabase = await createClient()

    // Fetch the job to get its service location
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        service_location_id,
        estimated_duration_minutes,
        service_locations (
          latitude,
          longitude,
          address_line_1,
          city,
          state,
          postal_code
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        warnings: [{
          type: 'ok',
          message: 'Unable to verify travel time (job not found)',
          requiredMinutes: 0,
          availableMinutes: 0
        }]
      }
    }

    const newJobLocation = job.service_locations as any
    const newJobCoords: Location | null = newJobLocation?.latitude && newJobLocation?.longitude
      ? {
          latitude: parseFloat(newJobLocation.latitude),
          longitude: parseFloat(newJobLocation.longitude)
        }
      : null

    // If no coordinates, we can't calculate travel time
    if (!newJobCoords) {
      return {
        success: true,
        warnings: [{
          type: 'ok',
          message: 'Location coordinates not available. Travel time cannot be calculated.',
          requiredMinutes: 0,
          availableMinutes: 0
        }]
      }
    }

    const proposedStart = new Date(startTime)
    const proposedEnd = new Date(endTime)
    const jobDurationMinutes = job.estimated_duration_minutes || 60

    // Find previous appointment (immediately before this time slot)
    const { data: previousAppointment } = await supabase
      .from('appointments')
      .select(`
        id,
        end_time,
        job_id,
        jobs!inner (
          service_location_id
        )
      `)
      .eq('assigned_tech', techId)
      .eq('status', 'confirmed')
      .lt('end_time', startTime)
      .order('end_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Find next appointment (immediately after this time slot)
    const { data: nextAppointment } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        job_id,
        jobs!inner (
          service_location_id
        )
      `)
      .eq('assigned_tech', techId)
      .eq('status', 'confirmed')
      .gt('start_time', endTime)
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle()

    const warnings: TravelTimeWarning[] = []

    // Check travel time from previous appointment
    if (previousAppointment) {
      const prevEnd = new Date(previousAppointment.end_time)
      const prevJob = previousAppointment.jobs as any
      const prevServiceLocationId = prevJob?.service_location_id

      // Fetch service location coordinates for previous job
      let prevCoords: Location | null = null
      if (prevServiceLocationId) {
        const { data: prevLocation } = await supabase
          .from('service_locations')
          .select('latitude, longitude')
          .eq('id', prevServiceLocationId)
          .single()

        if (prevLocation?.latitude && prevLocation?.longitude) {
          prevCoords = {
            latitude: parseFloat(prevLocation.latitude.toString()),
            longitude: parseFloat(prevLocation.longitude.toString())
          }
        }
      }

      if (prevCoords) {
        // Calculate travel time from previous job to new job
        const travelTimeResult = await getTravelTime(
          prevCoords,
          newJobCoords,
          prevEnd // Use previous appointment end time for traffic-aware estimate
        )

        if (travelTimeResult.status === 'OK') {
          const availableMinutes = Math.floor(
            (proposedStart.getTime() - prevEnd.getTime()) / (1000 * 60)
          )
          const requiredMinutes = travelTimeResult.durationMinutes

          if (availableMinutes < requiredMinutes) {
            // Conflict: Not enough travel time
            warnings.push({
              type: 'conflict',
              message: `Conflict: Not enough travel time (Requires ${requiredMinutes} mins, only ${availableMinutes} mins available)`,
              requiredMinutes,
              availableMinutes
            })
          } else if (availableMinutes < requiredMinutes + 15) {
            // Tight schedule: Less than 15 minutes buffer
            warnings.push({
              type: 'tight',
              message: `Tight schedule: Only ${availableMinutes - requiredMinutes} minutes buffer after travel time`,
              requiredMinutes,
              availableMinutes
            })
          }
        }
      }
    }

    // Check travel time to next appointment
    if (nextAppointment) {
      const nextStart = new Date(nextAppointment.start_time)
      const nextJob = nextAppointment.jobs as any
      const nextServiceLocationId = nextJob?.service_location_id

      // Fetch service location coordinates for next job
      let nextCoords: Location | null = null
      if (nextServiceLocationId) {
        const { data: nextLocation } = await supabase
          .from('service_locations')
          .select('latitude, longitude')
          .eq('id', nextServiceLocationId)
          .single()

        if (nextLocation?.latitude && nextLocation?.longitude) {
          nextCoords = {
            latitude: parseFloat(nextLocation.latitude.toString()),
            longitude: parseFloat(nextLocation.longitude.toString())
          }
        }
      }

      if (nextCoords) {
        // Calculate travel time from new job to next job
        const travelTimeResult = await getTravelTime(
          newJobCoords,
          nextCoords,
          proposedEnd // Use new appointment end time for traffic-aware estimate
        )

        if (travelTimeResult.status === 'OK') {
          const availableMinutes = Math.floor(
            (nextStart.getTime() - proposedEnd.getTime()) / (1000 * 60)
          )
          const requiredMinutes = travelTimeResult.durationMinutes

          if (availableMinutes < requiredMinutes) {
            // Conflict: Not enough travel time
            warnings.push({
              type: 'conflict',
              message: `Conflict: Not enough travel time to next job (Requires ${requiredMinutes} mins, only ${availableMinutes} mins available)`,
              requiredMinutes,
              availableMinutes
            })
          } else if (availableMinutes < requiredMinutes + 15) {
            // Tight schedule: Less than 15 minutes buffer
            warnings.push({
              type: 'tight',
              message: `Tight schedule: Only ${availableMinutes - requiredMinutes} minutes buffer before next job`,
              requiredMinutes,
              availableMinutes
            })
          }
        }
      }
    }

    // If no warnings, add OK status
    if (warnings.length === 0) {
      warnings.push({
        type: 'ok',
        message: 'No travel time conflicts detected',
        requiredMinutes: 0,
        availableMinutes: 0
      })
    }

    return {
      success: true,
      warnings,
      previousAppointment: previousAppointment ? {
        id: previousAppointment.id,
        endTime: previousAppointment.end_time,
        location: null // Location already fetched above
      } : undefined,
      nextAppointment: nextAppointment ? {
        id: nextAppointment.id,
        startTime: nextAppointment.start_time,
        location: null // Location already fetched above
      } : undefined
    }
  } catch (error: any) {
    console.error('[Travel Time] Error checking conflicts:', error)
    return {
      success: false,
      warnings: [{
        type: 'ok',
        message: 'Unable to check travel time conflicts',
        requiredMinutes: 0,
        availableMinutes: 0
      }]
    }
  }
}


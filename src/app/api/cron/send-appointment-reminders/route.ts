import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAppointmentReminderEmail } from '@/lib/emails'

/**
 * Cron job endpoint to send appointment reminders
 * Runs every hour via Vercel Cron
 * 
 * Sends reminders for appointments that are 24-25 hours in the future
 */
export async function GET(request: Request) {
  try {
    // Verify this is a cron request (Vercel adds Authorization header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Calculate time range: 24-25 hours from now
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Query appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        jobs!inner (
          id,
          title,
          customer_id,
          customers!inner (
            id,
            email,
            name
          ),
          team_id,
          teams!inner (
            name,
            company_phone
          )
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gte('start_time', twentyFourHoursFromNow.toISOString())
      .lt('start_time', twentyFiveHoursFromNow.toISOString())

    if (appointmentsError) {
      console.error('[Cron] Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: appointmentsError.message },
        { status: 500 }
      )
    }

    if (!appointments || appointments.length === 0) {
      console.log('[Cron] No appointments need reminders at this time')
      return NextResponse.json({
        success: true,
        message: 'No appointments need reminders',
        count: 0,
      })
    }

    console.log(`[Cron] Found ${appointments.length} appointment(s) needing reminders`)

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process each appointment
    for (const appointment of appointments) {
      const job = appointment.jobs as any
      const customer = job?.customers as any
      const team = job?.teams as any

      // Skip if missing required data
      if (!customer?.email || !team?.name || !job?.title) {
        console.warn(`[Cron] Skipping appointment ${appointment.id}: missing required data`)
        results.skipped++
        continue
      }

      try {
        // Send reminder email
        const emailResult = await sendAppointmentReminderEmail({
          to: customer.email,
          teamName: team.name,
          appointmentTime: appointment.start_time,
          jobTitle: job.title,
          companyPhone: team.company_phone,
        })

        if (emailResult.success) {
          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', appointment.id)

          if (updateError) {
            console.error(`[Cron] Error updating appointment ${appointment.id}:`, updateError)
            results.errors.push(`Failed to update appointment ${appointment.id}`)
            results.failed++
          } else {
            console.log(`[Cron] Reminder sent for appointment ${appointment.id} to ${customer.email}`)
            results.sent++
          }
        } else {
          console.error(`[Cron] Failed to send email for appointment ${appointment.id}:`, emailResult.error)
          results.errors.push(`Failed to send email for appointment ${appointment.id}: ${emailResult.error}`)
          results.failed++
        }
      } catch (error: any) {
        console.error(`[Cron] Error processing appointment ${appointment.id}:`, error)
        results.errors.push(`Error processing appointment ${appointment.id}: ${error.message}`)
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder processing completed',
      results,
    })
  } catch (error: any) {
    console.error('[Cron] Error in send-appointment-reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


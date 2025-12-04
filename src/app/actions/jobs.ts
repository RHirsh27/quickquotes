'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateJobFromQuoteResult {
  success: boolean
  message: string
  jobId?: string
}

/**
 * Convert an accepted quote to a job
 */
export async function createJobFromQuote(
  quoteId: string,
  jobData: {
    title: string
    description: string | null
    service_location_id: string | null
    estimated_duration_minutes?: number | null
  }
): Promise<CreateJobFromQuoteResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to create a job.'
      }
    }

    // Fetch the quote to get related data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, customers!inner(team_id)')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return {
        success: false,
        message: 'Quote not found.'
      }
    }

    // Verify quote is accepted
    if (quote.status !== 'accepted') {
      return {
        success: false,
        message: 'Only accepted quotes can be converted to jobs.'
      }
    }

    // Check if job already exists for this quote
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle()

    if (existingJob) {
      return {
        success: false,
        message: 'A job already exists for this quote.',
        jobId: existingJob.id
      }
    }

    // Get team_id from customer
    const teamId = (quote.customers as any)?.team_id || quote.team_id

    if (!teamId) {
      return {
        success: false,
        message: 'Unable to determine team for this quote.'
      }
    }

    // Verify service location belongs to customer and team (if provided)
    if (jobData.service_location_id) {
      const { data: location, error: locationError } = await supabase
        .from('service_locations')
        .select('customer_id, team_id')
        .eq('id', jobData.service_location_id)
        .single()

      if (locationError || !location) {
        return {
          success: false,
          message: 'Service location not found.'
        }
      }

      if (location.customer_id !== quote.customer_id || location.team_id !== teamId) {
        return {
          success: false,
          message: 'Service location does not belong to this customer.'
        }
      }
    }

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        team_id: teamId,
        customer_id: quote.customer_id,
        service_location_id: jobData.service_location_id,
        quote_id: quoteId,
        title: jobData.title,
        description: jobData.description,
        status: 'pending',
        priority: 'normal' as const,
        estimated_duration_minutes: jobData.estimated_duration_minutes || null,
        created_by: user.id
      })
      .select('id')
      .single()

    if (jobError || !job) {
      console.error('Error creating job:', jobError)
      return {
        success: false,
        message: jobError?.message || 'Failed to create job.'
      }
    }

    // Note: Quote status remains 'accepted' since 'scheduled' is not in the enum
    // The quote_id link in the jobs table provides the connection between quote and job
    // If you want to add 'scheduled' status, update the quotes table CHECK constraint:
    // ALTER TABLE quotes DROP CONSTRAINT quotes_status_check;
    // ALTER TABLE quotes ADD CONSTRAINT quotes_status_check CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'scheduled'));

    // Revalidate paths
    revalidatePath('/quotes')
    revalidatePath(`/quotes/${quoteId}`)
    revalidatePath('/jobs')
    revalidatePath(`/jobs/${job.id}`)

    return {
      success: true,
      message: 'Job created successfully!',
      jobId: job.id
    }
  } catch (error: any) {
    console.error('Error in createJobFromQuote:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Create a new service location for a customer
 */
export async function createServiceLocation(
  customerId: string,
  locationData: {
    address_line_1: string
    address_line_2?: string | null
    city: string
    state: string
    postal_code: string
    gate_code?: string | null
    access_instructions?: string | null
    is_primary?: boolean
  }
): Promise<{ success: boolean; message: string; locationId?: string }> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to create a service location.'
      }
      }

    // Fetch customer to get team_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('team_id')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return {
        success: false,
        message: 'Customer not found.'
      }
    }

    // Create the service location
    const { data: location, error: locationError } = await supabase
      .from('service_locations')
      .insert({
        customer_id: customerId,
        team_id: customer.team_id,
        address_line_1: locationData.address_line_1,
        address_line_2: locationData.address_line_2 || null,
        city: locationData.city,
        state: locationData.state,
        postal_code: locationData.postal_code,
        gate_code: locationData.gate_code || null,
        access_instructions: locationData.access_instructions || null,
        is_primary: locationData.is_primary || false
      })
      .select('id')
      .single()

    if (locationError || !location) {
      console.error('Error creating service location:', locationError)
      return {
        success: false,
        message: locationError?.message || 'Failed to create service location.'
      }
    }

    // If this is marked as primary, unmark other primary locations
    if (locationData.is_primary) {
      await supabase
        .from('service_locations')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .neq('id', location.id)
    }

    revalidatePath('/quotes')
    revalidatePath('/customers')

    return {
      success: true,
      message: 'Service location created successfully!',
      locationId: location.id
    }
  } catch (error: any) {
    console.error('Error in createServiceLocation:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}


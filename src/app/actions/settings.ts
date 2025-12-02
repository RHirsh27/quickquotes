'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UpdateGeneralSettingsResult {
  success: boolean
  message: string
}

/**
 * Update general settings for a team
 * Only team owners can update settings
 */
export async function updateGeneralSettings(data: {
  default_tax_rate?: number
  company_address?: string
  company_phone?: string
  company_email?: string
  company_website?: string
  default_quote_notes?: string
}): Promise<UpdateGeneralSettingsResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to update settings.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Verify user is an owner
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', primaryTeamId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !teamMember || teamMember.role !== 'owner') {
      return {
        success: false,
        message: 'Only team owners can update general settings.'
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {}
    if (data.default_tax_rate !== undefined) {
      updateData.default_tax_rate = data.default_tax_rate >= 0 ? data.default_tax_rate : 0
    }
    if (data.company_address !== undefined) {
      updateData.company_address = data.company_address || null
    }
    if (data.company_phone !== undefined) {
      updateData.company_phone = data.company_phone || null
    }
    if (data.company_email !== undefined) {
      updateData.company_email = data.company_email || null
    }
    if (data.company_website !== undefined) {
      updateData.company_website = data.company_website || null
    }
    if (data.default_quote_notes !== undefined) {
      updateData.default_quote_notes = data.default_quote_notes || null
    }

    // Update team settings
    const { error: updateError } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', primaryTeamId)

    if (updateError) {
      console.error('Error updating team settings:', updateError)
      return {
        success: false,
        message: updateError.message || 'Failed to update settings.'
      }
    }

    revalidatePath('/settings/general')
    revalidatePath('/quotes/new')

    return {
      success: true,
      message: 'Settings updated successfully!'
    }
  } catch (error: any) {
    console.error('Error updating general settings:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}


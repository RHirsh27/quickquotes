'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ServicePreset } from '@/lib/types'

export interface PresetActionResult {
  success: boolean
  message: string
}

/**
 * Check if current user is a team owner
 */
async function isTeamOwner(userId: string, teamId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (error || !teamMember) {
    return false
  }

  return teamMember.role === 'owner'
}

/**
 * Get user's primary team ID
 */
async function getUserPrimaryTeam(userId: string): Promise<string | null> {
  const supabase = await createClient()
  
  const { data: teamId, error } = await supabase.rpc('get_user_primary_team')
  
  if (error || !teamId) {
    return null
  }

  return teamId
}

/**
 * Create a new service preset (Owner only)
 */
export async function createPreset(
  name: string,
  defaultPrice: number,
  defaultTaxable: boolean
): Promise<PresetActionResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to create presets.'
      }
    }

    // Get user's primary team
    const teamId = await getUserPrimaryTeam(user.id)
    if (!teamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Check if user is owner
    const isOwner = await isTeamOwner(user.id, teamId)
    if (!isOwner) {
      return {
        success: false,
        message: 'Only team owners can manage the price book.'
      }
    }

    // Create preset
    const { error: insertError } = await supabase
      .from('service_presets')
      .insert({
        user_id: user.id,
        team_id: teamId,
        name: name.trim(),
        default_price: defaultPrice,
        default_taxable: defaultTaxable,
      })

    if (insertError) {
      return {
        success: false,
        message: insertError.message || 'Failed to create preset.'
      }
    }

    revalidatePath('/presets')
    return {
      success: true,
      message: 'Preset created successfully!'
    }
  } catch (error: any) {
    console.error('Error creating preset:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Update an existing service preset (Owner only)
 */
export async function updatePreset(
  presetId: string,
  name: string,
  defaultPrice: number,
  defaultTaxable: boolean
): Promise<PresetActionResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to update presets.'
      }
    }

    // Get user's primary team
    const teamId = await getUserPrimaryTeam(user.id)
    if (!teamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Check if user is owner
    const isOwner = await isTeamOwner(user.id, teamId)
    if (!isOwner) {
      return {
        success: false,
        message: 'Only team owners can manage the price book.'
      }
    }

    // Verify preset belongs to the team
    const { data: preset, error: presetError } = await supabase
      .from('service_presets')
      .select('team_id')
      .eq('id', presetId)
      .single()

    if (presetError || !preset || preset.team_id !== teamId) {
      return {
        success: false,
        message: 'Preset not found or access denied.'
      }
    }

    // Update preset
    const { error: updateError } = await supabase
      .from('service_presets')
      .update({
        name: name.trim(),
        default_price: defaultPrice,
        default_taxable: defaultTaxable,
      })
      .eq('id', presetId)
      .eq('team_id', teamId)

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update preset.'
      }
    }

    revalidatePath('/presets')
    return {
      success: true,
      message: 'Preset updated successfully!'
    }
  } catch (error: any) {
    console.error('Error updating preset:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Delete a service preset (Owner only)
 */
export async function deletePreset(presetId: string): Promise<PresetActionResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to delete presets.'
      }
    }

    // Get user's primary team
    const teamId = await getUserPrimaryTeam(user.id)
    if (!teamId) {
      return {
        success: false,
        message: 'No team found. Please contact support.'
      }
    }

    // Check if user is owner
    const isOwner = await isTeamOwner(user.id, teamId)
    if (!isOwner) {
      return {
        success: false,
        message: 'Only team owners can manage the price book.'
      }
    }

    // Verify preset belongs to the team
    const { data: preset, error: presetError } = await supabase
      .from('service_presets')
      .select('team_id')
      .eq('id', presetId)
      .single()

    if (presetError || !preset || preset.team_id !== teamId) {
      return {
        success: false,
        message: 'Preset not found or access denied.'
      }
    }

    // Delete preset
    const { error: deleteError } = await supabase
      .from('service_presets')
      .delete()
      .eq('id', presetId)
      .eq('team_id', teamId)

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || 'Failed to delete preset.'
      }
    }

    revalidatePath('/presets')
    return {
      success: true,
      message: 'Preset deleted successfully!'
    }
  } catch (error: any) {
    console.error('Error deleting preset:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}


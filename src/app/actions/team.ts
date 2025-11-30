'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface InviteMemberResult {
  success: boolean
  message: string
}

/**
 * Invite a member to the current user's team
 * Only team owners can invite members
 */
export async function inviteTeamMember(email: string): Promise<InviteMemberResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to invite members.'
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

    // Verify user is an owner of the team
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', primaryTeamId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !teamMember || teamMember.role !== 'owner') {
      return {
        success: false,
        message: 'Only team owners can invite members.'
      }
    }

    // Use database function to find user by email (if function exists)
    // This function queries auth.users which we can't access directly
    let foundUserId: string | null = null
    
    try {
      const { data: userData, error: findError } = await supabase.rpc('find_user_by_email', {
        search_email: email.toLowerCase().trim()
      })
      
      if (!findError && userData && userData.length > 0) {
        foundUserId = userData[0].user_id
      }
    } catch (error) {
      // Function might not exist yet - that's okay, we'll show the error message
      console.log('find_user_by_email function not found or error:', error)
    }

    // If user not found, return error
    if (!foundUserId) {
      return {
        success: false,
        message: 'User not found. Ask them to sign up for a free account first.'
      }
    }

    // Check if they're already a team member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', primaryTeamId)
      .eq('user_id', foundUserId)
      .single()

    if (existingMember) {
      return {
        success: false,
        message: 'User is already a team member.'
      }
    }

    // Add them to the team
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: primaryTeamId,
        user_id: foundUserId,
        role: 'member'
      })

    if (insertError) {
      return {
        success: false,
        message: insertError.message || 'Failed to add member.'
      }
    }

    revalidatePath('/settings/team')
    return {
      success: true,
      message: 'Member added successfully!'
    }

    // If we had proper user lookup, the code would be:
    // const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    // if (!existingUser) {
    //   return { success: false, message: 'User not found. Ask them to sign up for a free account first.' }
    // }
    // 
    // // Check if they're already a member
    // const { data: existingMember } = await supabase
    //   .from('team_members')
    //   .select('id')
    //   .eq('team_id', primaryTeamId)
    //   .eq('user_id', existingUser.user.id)
    //   .single()
    // 
    // if (existingMember) {
    //   return { success: false, message: 'User is already a team member.' }
    // }
    // 
    // // Add them to the team
    // const { error: insertError } = await supabase
    //   .from('team_members')
    //   .insert({
    //     team_id: primaryTeamId,
    //     user_id: existingUser.user.id,
    //     role: 'member'
    //   })
    // 
    // if (insertError) {
    //   return { success: false, message: insertError.message || 'Failed to add member.' }
    // }
    // 
    // revalidatePath('/settings/team')
    // return { success: true, message: 'Member added successfully!' }
  } catch (error: any) {
    console.error('Error inviting team member:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}

/**
 * Remove a member from the team
 * Only team owners can remove members (and cannot remove themselves)
 */
export async function removeTeamMember(memberId: string, memberUserId: string): Promise<InviteMemberResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to remove members.'
      }
    }

    // Can't remove yourself
    if (user.id === memberUserId) {
      return {
        success: false,
        message: 'You cannot remove yourself from the team.'
      }
    }

    // Get user's primary team
    const { data: primaryTeamId, error: teamError } = await supabase.rpc('get_user_primary_team')
    if (teamError || !primaryTeamId) {
      return {
        success: false,
        message: 'No team found.'
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
        message: 'Only team owners can remove members.'
      }
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', primaryTeamId)

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || 'Failed to remove member.'
      }
    }

    revalidatePath('/settings/team')
    return {
      success: true,
      message: 'Member removed successfully.'
    }
  } catch (error: any) {
    console.error('Error removing team member:', error)
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.'
    }
  }
}


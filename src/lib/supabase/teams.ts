import { createClient } from './server'

/**
 * Get all teams that the current user belongs to
 */
export async function getUserTeams() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_user_teams')
  
  if (error) {
    console.error('Error fetching user teams:', error)
    throw error
  }
  
  return data as Array<{
    team_id: string
    team_name: string
    role: 'owner' | 'member'
    created_at: string
  }>
}

/**
 * Get the primary team for the current user (first team they own, or first team they're a member of)
 */
export async function getUserPrimaryTeam() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_user_primary_team')
  
  if (error) {
    console.error('Error fetching primary team:', error)
    throw error
  }
  
  return data as string | null
}

/**
 * Get team details by ID (if user is a member)
 */
export async function getTeamById(teamId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  
  if (error) {
    console.error('Error fetching team:', error)
    throw error
  }
  
  return data
}

/**
 * Get all members of a team (if user is a member)
 */
export async function getTeamMembers(teamId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        company_name,
        email
      )
    `)
    .eq('team_id', teamId)
  
  if (error) {
    console.error('Error fetching team members:', error)
    throw error
  }
  
  return data
}


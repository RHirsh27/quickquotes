'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, LoadingButton, LoadingSpinner } from '@/components/ui'
import { Users, Mail, UserPlus, Crown, User, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { sanitizeEmail } from '@/lib/utils/sanitize'
import { isValidEmail, isRequired } from '@/lib/utils/validation'
import { getUserPrimaryTeam, getTeamMembers } from '@/lib/supabase/teams'
import { inviteTeamMember, removeTeamMember } from '@/app/actions/team'

interface TeamMemberWithUser {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
  users: {
    id: string
    full_name: string | null
    company_name: string | null
    email?: string // This might not be available from users table
  } | null
}

function TeamManagementContent() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string>('')
  const [members, setMembers] = useState<TeamMemberWithUser[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member' | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | undefined>(undefined)
  const [inviting, setInviting] = useState(false)

  // Fetch team data
  useEffect(() => {
    async function fetchTeamData() {
      setInitialLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setInitialLoading(false)
          return
        }

        // Get user's primary team
        const primaryTeamId = await getUserPrimaryTeam()
        if (!primaryTeamId) {
          toast.error('No team found. Please contact support.')
          setInitialLoading(false)
          return
        }

        setTeamId(primaryTeamId)

        // Get team details
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', primaryTeamId)
          .single()

        if (teamError) {
          console.error('Error fetching team:', teamError)
          toast.error('Failed to load team details.')
        } else if (teamData) {
          setTeamName(teamData.name)
        }

        // Get team members
        const membersData = await getTeamMembers(primaryTeamId)
        setMembers(membersData as TeamMemberWithUser[])

        // Find current user's role
        const currentMember = membersData.find((m: any) => m.user_id === user.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
        }

      } catch (error: any) {
        console.error('Error fetching team data:', error)
        toast.error('Failed to load team data.')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchTeamData()
  }, [supabase])

  // Handle invite member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setInviteError(undefined)

    if (!teamId) {
      toast.error('No team found.')
      setInviting(false)
      return
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(inviteEmail)
    if (!isRequired(sanitizedEmail)) {
      setInviteError('Email is required')
      setInviting(false)
      return
    }
    if (!isValidEmail(sanitizedEmail)) {
      setInviteError('Please enter a valid email address')
      setInviting(false)
      return
    }

    try {
      // Use server action to invite member
      const result = await inviteTeamMember(sanitizedEmail)
      
      if (result.success) {
        toast.success(result.message)
        setInviteEmail('')
        // Refresh members list
        const membersData = await getTeamMembers(teamId)
        setMembers(membersData as TeamMemberWithUser[])
      } else {
        toast.error(result.message)
        setInviteError(result.message)
      }
    } catch (error: any) {
      console.error('Error inviting member:', error)
      toast.error(error.message || 'Failed to invite member.')
      setInviteError(error.message || 'Failed to invite member.')
    } finally {
      setInviting(false)
    }

      // If we had a way to check auth.users, the logic would be:
      // if (userExists) {
      //   const { error: addError } = await supabase
      //     .from('team_members')
      //     .insert({
      //       team_id: teamId,
      //       user_id: existingUser.id,
      //       role: 'member'
      //     })
      //   if (addError) throw addError
      //   toast.success('Member added to team!')
      //   setInviteEmail('')
      //   // Refresh members list
      //   const membersData = await getTeamMembers(teamId)
      //   setMembers(membersData as TeamMemberWithUser[])
      // } else {
      //   toast.error('User must sign up for a free account first.')
      // }

    } catch (error: any) {
      console.error('Error inviting member:', error)
      toast.error(error.message || 'Failed to invite member.')
      setInviteError(error.message || 'Failed to invite member.')
    } finally {
      setInviting(false)
    }
  }

  // Handle remove member (owners only, can't remove themselves)
  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!teamId) return

    const confirmed = window.confirm('Are you sure you want to remove this member from the team?')
    if (!confirmed) return

    try {
      const result = await removeTeamMember(memberId, memberUserId)
      
      if (result.success) {
        toast.success(result.message)
        // Refresh members list
        const membersData = await getTeamMembers(teamId)
        setMembers(membersData as TeamMemberWithUser[])
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member.')
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-500">{teamName}</p>
          </div>
        </div>
      </div>

      {/* Invite Member Section (Owners Only) */}
      {currentUserRole === 'owner' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  if (inviteError) setInviteError(undefined)
                }}
                disabled={inviting}
                error={inviteError}
              />
              <p className="mt-2 text-sm text-gray-500">
                The user must already have a QuickQuotes account. Ask them to sign up first, then you can add them.
              </p>
            </div>
            <LoadingButton
              type="submit"
              loading={inviting}
              loadingText="Adding..."
              disabled={!inviteEmail}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </LoadingButton>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Team Members ({members.length})
        </h2>
        
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No team members found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isCurrentUser = member.user_id === supabase.auth.getUser().then(u => u.data.user?.id)
              const userName = member.users?.full_name || member.users?.company_name || 'Unknown User'
              const userEmail = member.users?.email || 'No email'

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                      {member.role === 'owner' ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{userName}</p>
                        {member.role === 'owner' && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            Owner
                          </span>
                        )}
                        {member.role === 'member' && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {userEmail}
                      </p>
                    </div>
                  </div>
                  {currentUserRole === 'owner' && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeamManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TeamManagementContent />
    </Suspense>
  )
}


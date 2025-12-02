'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, LoadingButton } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { sanitizeString } from '@/lib/utils/sanitize'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }
      
      setCheckingAuth(false)
    }
    
    checkAuth()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sanitize input
      const sanitizedPassword = sanitizeString(password)

      // Basic validation
      if (!sanitizedPassword || sanitizedPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: sanitizedPassword,
      })

      if (error) {
        throw error
      }

      // Success
      toast.success('Password updated successfully.')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Update Password</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="New Password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={loading}
              loadingText="Updating..."
            >
              Save
            </LoadingButton>
          </form>
        </div>
      </div>
    </div>
  )
}


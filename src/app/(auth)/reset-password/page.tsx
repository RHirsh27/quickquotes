'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { LoadingSpinner } from '@/components/ui'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { sanitizeString } from '@/lib/utils/sanitize'
import { validatePassword } from '@/lib/utils/validation'
import { createThrottledSubmit } from '@/lib/utils/rateLimit'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Supabase password reset tokens come in the URL hash (#access_token=...)
    // The Supabase client will automatically handle this when updateUser is called
    // No need to validate the hash here - let Supabase handle it
  }, [])

  const handleResetThrottled = createThrottledSubmit(
    async (password: string, confirmPassword: string) => {
      setLoading(true)

      try {
        // Sanitize inputs
        const sanitizedPassword = sanitizeString(password)
        const sanitizedConfirm = sanitizeString(confirmPassword)

        // Validate password
        const passwordValidation = validatePassword(sanitizedPassword)
        if (!passwordValidation.valid) {
          toast.error('Password does not meet requirements')
          setLoading(false)
          return
        }

        if (sanitizedPassword !== sanitizedConfirm) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.updateUser({
          password: sanitizedPassword,
        })

        if (error) throw error

        toast.success('Password updated successfully!')
        router.push('/dashboard')
      } catch (error: any) {
        toast.error(error.message || 'Failed to reset password')
      } finally {
        setLoading(false)
      }
    },
    'reset-password',
    { maxAttempts: 3, windowMs: 60000 }
  )

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    await handleResetThrottled(password, confirmPassword)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Set New Password</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Input
                type="password"
                label="New Password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {password && <PasswordStrength password={password} />}
            </div>

            <Input
              type="password"
              label="Confirm Password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={loading}
              loadingText="Updating..."
            >
              Update Password
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}


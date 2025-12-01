'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { sanitizeEmail } from '@/lib/utils/sanitize'
import { isValidEmail } from '@/lib/utils/validation'
import { createThrottledSubmit } from '@/lib/utils/rateLimit'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailError, setEmailError] = useState<string>()
  const supabase = createClient()

  const handleResetThrottled = createThrottledSubmit(
    async (email: string) => {
      setLoading(true)
      setEmailError(undefined)

      try {
        const sanitizedEmail = sanitizeEmail(email)

        if (!isValidEmail(sanitizedEmail)) {
          setEmailError('Please enter a valid email address')
          setLoading(false)
          return
        }

        // Get the base URL for redirect
        const baseUrl = window.location.origin
        const redirectTo = `${baseUrl}/reset-password`

        console.log('[Forgot Password] Sending reset email to:', sanitizedEmail)
        console.log('[Forgot Password] Redirect URL:', redirectTo)

        const { data, error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
          redirectTo: redirectTo,
        })

        if (error) {
          console.error('[Forgot Password] Error sending reset email:', error)
          console.error('[Forgot Password] Error details:', {
            message: error.message,
            status: error.status,
          })
          
          // Provide more specific error messages
          if (error.message.includes('rate limit') || error.message.includes('too many')) {
            toast.error('Too many requests. Please wait a few minutes and try again.')
          } else if (error.message.includes('email')) {
            toast.error('Invalid email address. Please check and try again.')
          } else {
            toast.error(error.message || 'Failed to send reset email. Please try again.')
          }
          return
        }

        console.log('[Forgot Password] Reset email sent successfully')
        setSent(true)
        toast.success('Password reset email sent! Check your inbox (and spam folder).')
      } catch (error: any) {
        console.error('[Forgot Password] Unexpected error:', error)
        console.error('[Forgot Password] Error details:', {
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        })
        toast.error(error?.message || 'An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    'forgot-password',
    { maxAttempts: 3, windowMs: 60000 }
  )

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(undefined)
    await handleResetThrottled(email)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(undefined)
              }}
              onBlur={() => {
                if (email && !isValidEmail(email)) {
                  setEmailError('Please enter a valid email address')
                }
              }}
              disabled={loading}
              error={emailError}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={loading}
              loadingText="Sending..."
            >
              Send Reset Link
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


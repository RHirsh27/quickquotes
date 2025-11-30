'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Authentication Error
            </h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  {error === 'email_not_confirmed' 
                    ? 'Email Not Confirmed' 
                    : error === 'invalid_token'
                    ? 'Invalid Link'
                    : 'Authentication Failed'}
                </p>
                {errorDescription && (
                  <p className="text-sm text-red-700">
                    {errorDescription}
                  </p>
                )}
                {!errorDescription && error === 'email_not_confirmed' && (
                  <p className="text-sm text-red-700">
                    Please check your email and click the confirmation link to activate your account.
                  </p>
                )}
                {!errorDescription && error === 'invalid_token' && (
                  <p className="text-sm text-red-700">
                    This link has expired or is invalid. Please request a new confirmation email.
                  </p>
                )}
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 mb-2">
                <strong>What to do next:</strong>
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                {error === 'email_not_confirmed' ? (
                  <>
                    <li>Check your email inbox for the confirmation link</li>
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you're clicking the most recent email</li>
                  </>
                ) : error === 'invalid_token' ? (
                  <>
                    <li>Request a new confirmation email from the login page</li>
                    <li>Make sure you're using the most recent link</li>
                    <li>Links expire after 24 hours</li>
                  </>
                ) : (
                  <>
                    <li>Try logging in again</li>
                    <li>If the problem persists, contact support</li>
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
              {error === 'email_not_confirmed' && (
                <Link href="/verify-email">
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    View Email Instructions
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}


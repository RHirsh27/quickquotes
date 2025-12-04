'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const accountId = params?.accountId as string
  const sessionId = searchParams?.get('session_id')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading session verification
    // In production, you might want to verify the session on the server
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Order ID
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {sessionId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/storefront/${accountId}`}
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              You should receive a confirmation email shortly.
              If you have any questions, please contact the seller.
            </p>
          </div>
        </div>

        {/* Developer Note */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <strong>Developer Note:</strong> In production, you should verify the payment session
            on the server and display order details. You can use webhooks to track when
            payments are completed.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button, LoadingSpinner } from '@/components/ui'
import { CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface PayInvoiceClientProps {
  invoiceId: string
  invoiceTotal: number
}

export default function PayInvoiceClient({ invoiceId, invoiceTotal }: PayInvoiceClientProps) {
  const [loading, setLoading] = useState(false)

  const handlePayNow = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No payment URL received')
      }
    } catch (error: any) {
      console.error('Error creating payment:', error)
      toast.error(error.message || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayNow}
      disabled={loading}
      className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pay Now
        </>
      )}
    </Button>
  )
}


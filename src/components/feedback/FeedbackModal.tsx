'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Button, LoadingButton } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim()) {
      toast.error('Please enter your feedback')
      return
    }

    setLoading(true)

    try {
      // Get current user for name
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      let userName = 'Anonymous User'
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, company_name')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          userName = profile.full_name || profile.company_name || user.email || 'Anonymous User'
        } else {
          userName = user.email || 'Anonymous User'
        }
      }

      // Send feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedback.trim(),
          userName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback')
      }

      toast.success('Thank you for your feedback! We\'ll get back to you soon.')
      setFeedback('')
      onClose()
    } catch (error: any) {
      console.error('Error sending feedback:', error)
      toast.error(error.message || 'Failed to send feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              What's wrong or what feature do you need?
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Sending..."
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  )
}


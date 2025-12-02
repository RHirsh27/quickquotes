import { NextRequest, NextResponse } from 'next/server'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quotd.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, userName } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Feedback message is required' },
        { status: 400 }
      )
    }

    if (!resend) {
      console.error('[Feedback] Resend not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Send feedback email to admin
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `App Feedback from ${userName || 'Anonymous User'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">New Feedback from Quotd App</h2>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${userName || 'Anonymous User'}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}</p>
          </div>

          <div style="background-color: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #666;">Message:</h3>
            <p style="white-space: pre-wrap; color: #333;">${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      `,
      text: `
New Feedback from Quotd App

From: ${userName || 'Anonymous User'}
Date: ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}

Message:
${message}
      `.trim(),
    })

    if (error) {
      console.error('[Feedback] Error sending email:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send feedback' },
        { status: 500 }
      )
    }

    console.log('[Feedback] Feedback email sent successfully:', data?.id)

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error: any) {
    console.error('[Feedback] Error processing feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


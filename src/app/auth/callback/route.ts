import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code') // PKCE flow uses 'code'
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: -1 })
        },
      },
    }
  )

  try {
    // Handle PKCE flow (preferred - standard for new Supabase setups)
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] PKCE code exchange failed:', error.message)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      // Successfully exchanged code for session - now check subscription
      if (data.user) {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', data.user.id)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle()

        // If no subscription or not active/trialing, redirect to finish-setup
        if (subError || !subscription) {
          console.log('[Auth Callback] No active subscription found, redirecting to finish-setup')
          return NextResponse.redirect(new URL('/finish-setup', request.url))
        }

        // User has active subscription - redirect to dashboard
        console.log('[Auth Callback] User has active subscription, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    // Handle legacy token_hash flow (for older email templates)
    else if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error('[Auth Callback] OTP verification failed:', error.message)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      // Successfully verified OTP - get user and check subscription
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('[Auth Callback] Failed to get user after OTP verification:', userError?.message)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }

      // Check subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle()

      // If no subscription or not active/trialing, redirect to finish-setup
      if (subError || !subscription) {
        console.log('[Auth Callback] No active subscription found, redirecting to finish-setup')
        return NextResponse.redirect(new URL('/finish-setup', request.url))
      }

      // User has active subscription - redirect to dashboard
      console.log('[Auth Callback] User has active subscription, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    else {
      // No code or token_hash provided
      console.error('[Auth Callback] No code or token_hash provided')
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
  } catch (error: any) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  // Fallback - should never reach here
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}

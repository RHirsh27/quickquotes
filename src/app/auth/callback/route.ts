import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // If there's an error from Supabase, redirect to error page
  if (error) {
    const errorUrl = new URL('/auth-code-error', requestUrl.origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  // If there's a code, exchange it for a session
  if (code) {
    const supabase = await createClient()
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      // Redirect to login with error parameter
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'auth_code_error')
      return NextResponse.redirect(loginUrl.toString())
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin).toString())
  }

  // No code and no error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin).toString())
}


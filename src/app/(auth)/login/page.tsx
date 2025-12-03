'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui'
import { Building2, MapPin, User, Mail, Lock, Phone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '@/lib/utils/sanitize'
import { isValidEmail, isValidPhone, isRequired } from '@/lib/utils/validation'
import { createThrottledSubmit } from '@/lib/utils/rateLimit'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { getPlanById, type PlanId } from '@/config/pricing'

interface FormErrors {
  email?: string
  password?: string
  fullName?: string
  companyName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for plan parameter and set signup mode if present
  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam && ['SOLO', 'CREW', 'TEAM'].includes(planParam)) {
      setIsSignUp(true)
    }
    
    const error = searchParams.get('error')
    if (error === 'auth_code_error') {
      toast.error('Authentication failed. Please try again or request a new confirmation email.')
    }
  }, [searchParams])

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  })

  // Validation Errors
  const [errors, setErrors] = useState<FormErrors>({})

  // Validate on change
  useEffect(() => {
    const newErrors: FormErrors = {}
    
    if (email && !isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (isSignUp) {
      if (formData.fullName && !isRequired(formData.fullName)) {
        newErrors.fullName = 'Full name is required'
      }
      if (formData.companyName && !isRequired(formData.companyName)) {
        newErrors.companyName = 'Company name is required'
      }
      if (formData.phone && !isValidPhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }
    
    setErrors(newErrors)
  }, [email, password, formData, isSignUp])

  // Throttled submit handler
  const handleAuthThrottled = createThrottledSubmit(
    async (email: string, password: string, formData: any, isSignUp: boolean) => {
      setLoading(true)
      
      try {
        // Sanitize inputs
        const sanitizedEmail = sanitizeEmail(email)
        const sanitizedPassword = sanitizeString(password)
        
        if (isSignUp) {
          // Validate all required fields
          const validationErrors: FormErrors = {}
          
          if (!isRequired(sanitizedEmail)) {
            validationErrors.email = 'Email is required'
          } else if (!isValidEmail(sanitizedEmail)) {
            validationErrors.email = 'Please enter a valid email address'
          }
          
          if (!isRequired(sanitizedPassword)) {
            validationErrors.password = 'Password is required'
          } else if (sanitizedPassword.length < 6) {
            validationErrors.password = 'Password must be at least 6 characters'
          }
          
          if (!isRequired(formData.fullName)) {
            validationErrors.fullName = 'Full name is required'
          }
          
          if (!isRequired(formData.companyName)) {
            validationErrors.companyName = 'Company name is required'
          }
          
          if (!isRequired(formData.phone)) {
            validationErrors.phone = 'Phone is required'
          } else if (!isValidPhone(formData.phone)) {
            validationErrors.phone = 'Please enter a valid phone number'
          }
          
          if (!isRequired(formData.address)) {
            validationErrors.address = 'Address is required'
          }
          
          if (!isRequired(formData.city)) {
            validationErrors.city = 'City is required'
          }
          
          if (!isRequired(formData.state)) {
            validationErrors.state = 'State is required'
          }
          
          if (!isRequired(formData.zip)) {
            validationErrors.zip = 'Zip code is required'
          }
          
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            setLoading(false)
            return
          }

          // REGISTER FLOW
          // Get the base URL for redirect
          const baseUrl = window.location.origin
          const redirectTo = `${baseUrl}/auth/callback`
          
          // Get plan from query params
          const planParam = searchParams.get('plan') as PlanId | null
          const selectedPlan = planParam && ['SOLO', 'CREW', 'TEAM'].includes(planParam) 
            ? getPlanById(planParam)
            : null

          const { data: signUpData, error } = await supabase.auth.signUp({ 
            email: sanitizedEmail, 
            password: sanitizedPassword,
            options: { 
              emailRedirectTo: redirectTo,
              data: { 
                full_name: sanitizeString(formData.fullName),
                company_name: sanitizeString(formData.companyName),
                phone: sanitizePhone(formData.phone),
                address_line_1: sanitizeString(formData.address),
                city: sanitizeString(formData.city),
                state: sanitizeString(formData.state),
                postal_code: sanitizeString(formData.zip)
              } 
            }
          })
          if (error) throw error

          // Check if email confirmation is required
          // If user is null, it means email confirmation was sent
          if (!signUpData?.user) {
            console.log('[Signup] Email confirmation required - redirecting to verify-email')
            toast.success('Please check your email to confirm your account.')
            router.push('/verify-email')
            return
          }

          // Account created successfully (email confirmation disabled)
          // Redirect to checkout page to complete payment
          // This ensures the session is fully established before attempting checkout
          toast.success('Account created! Please select a plan to continue.')

          // Include selected plan in URL if available
          const checkoutUrl = selectedPlan
            ? `/checkout?plan=${selectedPlan.id}`
            : '/checkout'

          router.push(checkoutUrl)
          return
        } else {
          // LOGIN FLOW
          if (!isRequired(sanitizedEmail)) {
            setErrors({ email: 'Email is required' })
            setLoading(false)
            return
          }
          if (!isValidEmail(sanitizedEmail)) {
            setErrors({ email: 'Please enter a valid email address' })
            setLoading(false)
            return
          }
          if (!isRequired(sanitizedPassword)) {
            setErrors({ password: 'Password is required' })
            setLoading(false)
            return
          }

          const { error } = await supabase.auth.signInWithPassword({ 
            email: sanitizedEmail, 
            password: sanitizedPassword 
          })
          if (error) throw error
          toast.success('Welcome back!')
          // Redirect to dashboard - layout will check subscription and redirect to /finish-setup if needed
          window.location.href = '/dashboard'
        }
      } catch (error: any) {
        toast.error(error.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    },
    'auth-submit',
    { maxAttempts: 5, windowMs: 60000 }
  )

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleAuthThrottled(email, password, formData, isSignUp)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>
          Quotd
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Instant Estimates
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          {isSignUp ? 'Create your professional profile' : 'Sign in to your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Toggle Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              className={`flex-1 pb-4 text-sm font-medium ${!isSignUp ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setIsSignUp(false)
                setErrors({})
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`flex-1 pb-4 text-sm font-medium ${isSignUp ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                setIsSignUp(true)
                setErrors({})
              }}
            >
              Create Account
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuth}>
            
            {/* Email & Password (Always Visible) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                    errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined })
                    }
                  }}
                  onBlur={() => {
                    if (email && !isValidEmail(email)) {
                      setErrors({ ...errors, email: 'Please enter a valid email address' })
                    }
                  }}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                    errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined })
                    }
                  }}
                />
              </div>
              {isSignUp && password && <PasswordStrength password={password} />}
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* EXTENDED FIELDS (Only for Sign Up) */}
            {isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-xs text-gray-500 font-medium">BUSINESS DETAILS</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                          errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({...formData, fullName: e.target.value})
                          if (errors.fullName) {
                            setErrors({ ...errors, fullName: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.fullName)) {
                            setErrors({ ...errors, fullName: 'Full name is required' })
                          }
                        }}
                      />
                    </div>
                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Joe's Plumbing"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                          errors.companyName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        value={formData.companyName}
                        onChange={(e) => {
                          setFormData({...formData, companyName: e.target.value})
                          if (errors.companyName) {
                            setErrors({ ...errors, companyName: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.companyName)) {
                            setErrors({ ...errors, companyName: 'Company name is required' })
                          }
                        }}
                      />
                    </div>
                    {errors.companyName && <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Phone</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                          errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({...formData, phone: e.target.value})
                          if (errors.phone) {
                            setErrors({ ...errors, phone: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.phone)) {
                            setErrors({ ...errors, phone: 'Phone is required' })
                          } else if (!isValidPhone(formData.phone)) {
                            setErrors({ ...errors, phone: 'Please enter a valid phone number' })
                          }
                        }}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors ${
                          errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({...formData, address: e.target.value})
                          if (errors.address) {
                            setErrors({ ...errors, address: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.address)) {
                            setErrors({ ...errors, address: 'Address is required' })
                          }
                        }}
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700">City</label>
                      <input 
                        type="text" 
                        required 
                        className={`mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm transition-colors ${
                          errors.city ? 'border-red-500' : ''
                        }`}
                        value={formData.city} 
                        onChange={(e) => {
                          setFormData({...formData, city: e.target.value})
                          if (errors.city) {
                            setErrors({ ...errors, city: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.city)) {
                            setErrors({ ...errors, city: 'City is required' })
                          }
                        }}
                      />
                      {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700">State</label>
                      <input 
                        type="text" 
                        required 
                        className={`mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm transition-colors ${
                          errors.state ? 'border-red-500' : ''
                        }`}
                        value={formData.state} 
                        onChange={(e) => {
                          setFormData({...formData, state: e.target.value})
                          if (errors.state) {
                            setErrors({ ...errors, state: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.state)) {
                            setErrors({ ...errors, state: 'State is required' })
                          }
                        }}
                      />
                      {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700">Zip</label>
                      <input 
                        type="text" 
                        required 
                        className={`mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm transition-colors ${
                          errors.zip ? 'border-red-500' : ''
                        }`}
                        value={formData.zip} 
                        onChange={(e) => {
                          setFormData({...formData, zip: e.target.value})
                          if (errors.zip) {
                            setErrors({ ...errors, zip: undefined })
                          }
                        }}
                        onBlur={() => {
                          if (!isRequired(formData.zip)) {
                            setErrors({ ...errors, zip: 'Zip code is required' })
                          }
                        }}
                      />
                      {errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip}</p>}
                    </div>
                  </div>

                </div>
              </>
            )}

            <Button type="submit" className="w-full mt-4 flex justify-center py-3" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                isSignUp ? 'Create Professional Account' : 'Sign In'
              )}
            </Button>

            {!isSignUp && (
              <div className="mt-4 text-center">
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Building2, MapPin, User, Mail, Lock, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        // REGISTER FLOW
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { 
              full_name: formData.fullName,
              company_name: formData.companyName,
              phone: formData.phone,
              address_line_1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip
            } 
          }
        })
        if (error) throw error
        toast.success('Account created! Please check your email to confirm.')
      } else {
        // LOGIN FLOW
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back!')
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          QuickQuotes
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
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
              onClick={() => setIsSignUp(false)}
            >
              Log In
            </button>
            <button
              type="button"
              className={`flex-1 pb-4 text-sm font-medium ${isSignUp ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setIsSignUp(true)}
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
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
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
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
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
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Phone</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
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
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700">City</label>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})} 
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700">State</label>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                        value={formData.state} 
                        onChange={(e) => setFormData({...formData, state: e.target.value})} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700">Zip</label>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                        value={formData.zip} 
                        onChange={(e) => setFormData({...formData, zip: e.target.value})} 
                      />
                    </div>
                  </div>

                </div>
              </>
            )}

            <Button type="submit" className="w-full mt-4 flex justify-center py-3" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Create Professional Account' : 'Sign In'}
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

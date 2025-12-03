'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import SupportWidget from '@/components/SupportWidget'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import Link from 'next/link'
import { Home, History, Users, BookOpen, Settings, FileText, HelpCircle, Menu, X, LogOut } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/quotes', label: 'Quotes', icon: History },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/price-book', label: 'Price Book', icon: BookOpen },
    { href: '/settings/general', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h2 className="text-xl font-extrabold" style={{ fontWeight: 800 }}>Quotd</h2>
                <p className="text-xs text-gray-500 -mt-1">Instant Estimates</p>
              </div>
              {/* Desktop Navigation */}
              <div className="flex items-center gap-1">
                {navLinks.slice(0, 5).map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </button>
              <SupportWidget />
              <Button variant="outline" onClick={handleSignOut}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-extrabold" style={{ fontWeight: 800 }}>Quotd</h2>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Slide-Over Menu */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Slide-over panel */}
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div>
              <h2 className="text-xl font-extrabold text-white" style={{ fontWeight: 800 }}>Quotd</h2>
              <p className="text-xs text-blue-100 -mt-0.5">Instant Estimates</p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span>{link.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Divider */}
            <div className="my-4 mx-4 border-t border-gray-200" />

            {/* Help & Support */}
            <div className="px-3 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowFeedbackModal(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <HelpCircle className="h-5 w-5 text-gray-500" />
                <span>Help & Feedback</span>
              </button>
            </div>
          </nav>

          {/* Sign Out Button */}
          <div className="border-t border-gray-200 p-4 bg-gray-50/50">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import SupportWidget from '@/components/SupportWidget'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'
import Link from 'next/link'
import { Home, History, Users, BookOpen, Settings, FileText, HelpCircle } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/quotes', label: 'History', icon: History },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/customers', label: 'Clients', icon: Users },
    { href: '/price-book', label: 'Price Book', icon: BookOpen },
  ]

  return (
    <>
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h2 className="text-xl font-extrabold" style={{ fontWeight: 800 }}>Quotd</h2>
                <p className="text-xs text-gray-500 -mt-1">Instant Estimates</p>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
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
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </>
  )
}

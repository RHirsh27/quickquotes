'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Users, User, Settings } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'History', href: '/quotes', icon: History },
    { label: 'Clients', href: '/customers', icon: Users },
    { label: 'Settings', href: '/settings/team', icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe z-50 flex justify-between items-center md:hidden">
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
            isActive(item.href) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <item.icon className="h-6 w-6" strokeWidth={isActive(item.href) ? 2.5 : 2} />
          <span className="text-[10px] font-medium mt-1">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}


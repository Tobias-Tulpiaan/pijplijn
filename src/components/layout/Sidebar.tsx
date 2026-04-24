'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutGrid, Users, Building2, Calendar, CheckSquare, LogOut } from 'lucide-react'

const menuItems = [
  { href: '/pijplijn', label: 'Pijplijn', icon: LayoutGrid },
  { href: '/kandidaten', label: 'Kandidaten', icon: Users },
  { href: '/opdrachtgevers', label: 'Opdrachtgevers', icon: Building2 },
  { href: '/kalender', label: 'Kalender', icon: Calendar },
  { href: '/taken', label: 'Taken', icon: CheckSquare },
]

function initialen(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white"
      style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#CBAD74' }}
        >
          Tulpiaan
        </span>
        <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>
          Pijplijn Dashboard
        </p>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'rgba(203,173,116,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #CBAD74' : '3px solid transparent',
                color: isActive ? '#A68A52' : '#6B6B6B',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
          >
            {initialen(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
              {user.name}
            </p>
            <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors hover:bg-gray-100"
          style={{ color: '#6B6B6B' }}
        >
          <LogOut size={15} />
          Uitloggen
        </button>
      </div>
    </aside>
  )
}

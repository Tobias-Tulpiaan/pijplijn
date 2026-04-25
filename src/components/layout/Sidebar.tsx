'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutGrid, Users, Building2, Calendar, CheckSquare,
  LogOut, Archive, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'

const menuItems = [
  { href: '/pijplijn', label: 'Pijplijn', icon: LayoutGrid, exact: true },
  { href: '/pijplijn/lijst', label: 'Kandidaten', icon: Users, exact: false },
  { href: '/opdrachtgevers', label: 'Opdrachtgevers', icon: Building2, exact: false },
  { href: '/pijplijn/kalender', label: 'Kalender', icon: Calendar, exact: false },
  { href: '/taken', label: 'Taken', icon: CheckSquare, exact: false },
  { href: '/archief', label: 'Archief', icon: Archive, exact: false },
  { href: '/instellingen', label: 'Instellingen', icon: Settings, exact: false },
]

function initialen(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    if (stored === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebarCollapsed', String(next))
      return next
    })
  }

  // Render expanded on first paint to avoid layout shift; transition kicks in after mount
  const isCollapsed = mounted && collapsed

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden"
      style={{
        fontFamily: 'Aptos, Calibri, Arial, sans-serif',
        width: isCollapsed ? 64 : 240,
        transition: mounted ? 'width 200ms ease' : undefined,
        flexShrink: 0,
      }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center border-b border-gray-100" style={{ height: 64, padding: isCollapsed ? '0 12px' : '0 24px' }}>
        {isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-bold" style={{ color: '#CBAD74' }}>T</span>
            <button onClick={toggle} className="p-1 rounded hover:bg-gray-100" title="Sidebar uitklappen">
              <ChevronRight size={16} style={{ color: '#6B6B6B' }} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: '#CBAD74' }}>Tulpiaan</span>
              <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Pijplijn Dashboard</p>
            </div>
            <button onClick={toggle} className="p-1 rounded hover:bg-gray-100 flex-shrink-0" title="Sidebar inklappen">
              <ChevronLeft size={16} style={{ color: '#6B6B6B' }} />
            </button>
          </div>
        )}
      </div>

      {/* Navigatie */}
      <nav className="flex-1 py-4 space-y-1" style={{ padding: isCollapsed ? '16px 8px' : '16px 12px' }}>
        {menuItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className="flex items-center rounded-md text-sm font-medium transition-colors"
              style={{
                gap: isCollapsed ? 0 : 12,
                padding: isCollapsed ? '8px 0' : '8px 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? 'rgba(203,173,116,0.15)' : 'transparent',
                borderLeft: isCollapsed ? 'none' : (isActive ? '3px solid #CBAD74' : '3px solid transparent'),
                color: isActive ? '#A68A52' : '#6B6B6B',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div
        className="border-t border-gray-100"
        style={{ padding: isCollapsed ? '12px 8px' : '16px' }}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              title={user.name ?? ''}
              style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
            >
              {initialen(user.name)}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Uitloggen"
              style={{ color: '#6B6B6B' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
              >
                {initialen(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>{user.email}</p>
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
          </>
        )}
      </div>
    </aside>
  )
}

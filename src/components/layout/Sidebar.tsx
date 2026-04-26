'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutGrid, Users, Building2, Calendar, CheckSquare,
  LogOut, Archive, Settings, ChevronLeft, ChevronRight, X, BarChart3, Briefcase,
} from 'lucide-react'

const menuItems = [
  { href: '/pijplijn',          label: 'Pijplijn',        icon: LayoutGrid, exact: true  },
  { href: '/pijplijn/lijst',    label: 'Kandidaten',      icon: Users,      exact: false },
  { href: '/opdrachtgevers',    label: 'Opdrachtgevers',  icon: Building2,  exact: false },
  { href: '/vacatures',         label: 'Vacatures',       icon: Briefcase,  exact: false },
  { href: '/pijplijn/kalender', label: 'Kalender',        icon: Calendar,   exact: false },
  { href: '/statistieken',      label: 'Statistieken',    icon: BarChart3,  exact: false },
  { href: '/taken',             label: 'Taken',           icon: CheckSquare,exact: false },
  { href: '/archief',           label: 'Archief',         icon: Archive,    exact: false },
]

function initialen(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null }
  drawerOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ user, drawerOpen = false, onClose }: SidebarProps) {
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

  const isCollapsed = mounted && collapsed && !drawerOpen

  const settingsActive = pathname === '/instellingen' || pathname.startsWith('/instellingen/')

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40',
        'md:sticky md:top-0 md:z-auto md:h-screen',
        'flex flex-col border-r border-gray-200 bg-white overflow-hidden',
        'transition-transform duration-200',
        drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'min-w-[240px] md:min-w-0',
      ].join(' ')}
      style={{
        fontFamily: 'Aptos, Calibri, Arial, sans-serif',
        width: isCollapsed ? 64 : 240,
        transition: mounted ? 'width 200ms ease, transform 200ms ease' : 'transform 200ms ease',
        flexShrink: 0,
      }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center border-b border-gray-100" style={{ height: 64, padding: isCollapsed ? '0 10px' : '0 16px' }}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <img src="/favicon.png" alt="Tulpiaan" width={28} height={28} />
            <button onClick={toggle} className="p-0.5 rounded hover:bg-gray-100 hidden md:block" title="Sidebar uitklappen">
              <ChevronRight size={14} style={{ color: '#6B6B6B' }} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/favicon.png" alt="Tulpiaan logo" width={30} height={30} className="flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xl font-bold tracking-tight" style={{ color: '#CBAD74' }}>Tulpiaan</span>
                <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>Pijplijn Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={toggle} className="p-1 rounded hover:bg-gray-100 hidden md:block" title="Sidebar inklappen">
                <ChevronLeft size={16} style={{ color: '#6B6B6B' }} />
              </button>
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 md:hidden" title="Menu sluiten">
                <X size={16} style={{ color: '#6B6B6B' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigatie */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto" style={{ padding: isCollapsed ? '16px 8px' : '16px 12px' }}>
        {menuItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
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

      {/* User + Logout + Settings */}
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
            <Link
              href="/instellingen"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Instellingen"
              style={{ color: settingsActive ? '#A68A52' : '#6B6B6B' }}
            >
              <Settings size={15} />
            </Link>
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
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
            >
              {initialen(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: '#6B6B6B' }}>{user.email}</p>
            </div>
            <Link
              href="/instellingen"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Instellingen"
              style={{ color: settingsActive ? '#A68A52' : '#6B6B6B', backgroundColor: settingsActive ? 'rgba(203,173,116,0.15)' : undefined }}
            >
              <Settings size={15} />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Uitloggen"
              style={{ color: '#6B6B6B' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

'use client'

import { Menu } from 'lucide-react'

function initialen(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

interface Props {
  user: { name?: string | null }
  onMenuClick: () => void
}

export function MobileTopbar({ user, onMenuClick }: Props) {
  return (
    <header
      className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 border-b border-gray-200 bg-white"
      style={{ height: 56, fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
    >
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Menu openen"
      >
        <Menu size={20} style={{ color: '#6B6B6B' }} />
      </button>

      <div className="flex items-center gap-1.5">
        <img src="/favicon.png" alt="" width={22} height={22} aria-hidden="true" />
        <span className="text-xl font-bold tracking-tight" style={{ color: '#CBAD74' }}>
          Tulpiaan
        </span>
      </div>

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
      >
        {initialen(user.name)}
      </div>
    </header>
  )
}

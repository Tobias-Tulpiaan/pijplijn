'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileTopbar } from './MobileTopbar'

interface Props {
  user: { name?: string | null; email?: string | null }
  children: React.ReactNode
}

export function AppShell({ user, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8F5EE' }}>
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <Sidebar user={user} drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileTopbar user={user} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ backgroundColor: '#F8F5EE' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

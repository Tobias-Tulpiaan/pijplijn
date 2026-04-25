'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Calendar } from 'lucide-react'

const views = [
  { href: '/pijplijn', label: 'Kanban', icon: LayoutGrid, exact: true },
  { href: '/pijplijn/lijst', label: 'Lijst', icon: List, exact: false },
  { href: '/pijplijn/kalender', label: 'Kalender', icon: Calendar, exact: false },
]

export function ViewSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  function switchView(newPath: string) {
    const qs = searchParams.toString()
    router.push(qs ? `${newPath}?${qs}` : newPath)
  }

  return (
    <div
      className="inline-flex rounded-lg p-1 gap-1"
      style={{ backgroundColor: 'rgba(203,173,116,0.12)' }}
    >
      {views.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <button
            key={href}
            onClick={() => switchView(href)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: active ? '#CBAD74' : 'transparent',
              color: active ? '#1A1A1A' : '#6B6B6B',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, LayoutGrid, List } from 'lucide-react'

interface Props {
  showArchived: boolean
  currentQ:     string
}

export function OpdrachtgeversControls({ showArchived, currentQ }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ]    = useState(currentQ)

  const currentView = (searchParams.get('view') as 'cards' | 'lijst') ?? 'cards'

  function setView(newView: 'cards' | 'lijst') {
    const params = new URLSearchParams(searchParams.toString())
    if (newView === 'cards') params.delete('view')
    else                     params.set('view', newView)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) params.set('q', q.trim())
      else          params.delete('q')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleArchived(archived: boolean) {
    const params = new URLSearchParams(searchParams.toString())
    if (archived) params.set('archived', 'true')
    else          params.delete('archived')
    params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
    setQ('')
  }

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op bedrijfsnaam, contactpersoon, of vacaturetitel..."
          className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        />
      </div>

      {/* Archived toggle + view switcher */}
      <div className="flex items-center justify-between gap-3">
        {/* Actief / Gearchiveerd toggle */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => toggleArchived(false)}
            className="px-4 py-1.5 transition-colors"
            style={{ backgroundColor: !showArchived ? '#1A1A1A' : '#fff', color: !showArchived ? '#fff' : '#6B6B6B' }}
          >
            Actief
          </button>
          <button
            onClick={() => toggleArchived(true)}
            className="px-4 py-1.5 transition-colors"
            style={{ backgroundColor: showArchived ? '#1A1A1A' : '#fff', color: showArchived ? '#fff' : '#6B6B6B' }}
          >
            Gearchiveerd
          </button>
        </div>

        {/* Cards / Lijst view switcher */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('cards')}
            className="p-2 transition-colors"
            style={{ backgroundColor: currentView === 'cards' ? '#1A1A1A' : '#fff', color: currentView === 'cards' ? '#fff' : '#6B6B6B' }}
            title="Cards"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('lijst')}
            className="p-2 transition-colors"
            style={{ backgroundColor: currentView === 'lijst' ? '#1A1A1A' : '#fff', color: currentView === 'lijst' ? '#fff' : '#6B6B6B' }}
            title="Lijst"
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

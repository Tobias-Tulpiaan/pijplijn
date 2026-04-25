'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { STAGES } from '@/types'

interface FilterBarProps {
  owners:    { id: string; name: string }[]
  companies: { id: string; name: string }[]
  vacatures: { id: string; title: string; company: { name: string } }[]
}

export function FilterBar({ owners, companies, vacatures }: FilterBarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentOwner     = searchParams.get('owner')      ?? ''
  const currentCompany   = searchParams.get('company')    ?? ''
  const currentStage     = searchParams.get('stage')      ?? ''
  const currentVacature  = searchParams.get('vacatureId') ?? ''

  const showStageFilter   = pathname === '/pijplijn/lijst' || pathname === '/pijplijn/kalender'
  const hasFilters = !!(currentOwner || currentCompany || currentStage || currentVacature || searchParams.get('q'))

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return `${pathname}?${params.toString()}`
  }

  function handleSelect(key: string, value: string) {
    startTransition(() => {
      router.push(buildUrl({ [key]: value }))
      router.refresh()
    })
  }

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ q: value }))
        router.refresh()
      })
    }, 300)
  }

  function clearFilters() {
    setSearchInput('')
    startTransition(() => {
      router.push(pathname)
      router.refresh()
    })
  }

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '')
  }, [searchParams])

  return (
    <div
      className={`flex flex-wrap gap-3 items-center rounded-lg p-3 shadow-sm transition-opacity${isPending ? ' opacity-60' : ''}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Zoekbalk */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Zoek op naam, functie, email, telefoon..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        />
      </div>

      {/* Owner filter */}
      <select
        value={currentOwner}
        onChange={(e) => handleSelect('owner', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentOwner ? '#1A1A1A' : '#6B6B6B' }}
      >
        <option value="">Alle consultants</option>
        {owners.map((o) => (
          <option key={o.id} value={o.name}>{o.name}</option>
        ))}
      </select>

      {/* Company filter */}
      <select
        value={currentCompany}
        onChange={(e) => handleSelect('company', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentCompany ? '#1A1A1A' : '#6B6B6B' }}
      >
        <option value="">Alle opdrachtgevers</option>
        {companies.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>

      {/* Vacature filter */}
      <select
        value={currentVacature}
        onChange={(e) => handleSelect('vacatureId', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentVacature ? '#1A1A1A' : '#6B6B6B' }}
      >
        <option value="">Alle vacatures</option>
        {vacatures.map((v) => (
          <option key={v.id} value={v.id}>
            {v.title} ({v.company.name})
          </option>
        ))}
      </select>

      {/* Stage filter — alleen op lijst- en kalender-view */}
      {showStageFilter && (
        <select
          value={currentStage}
          onChange={(e) => handleSelect('stage', e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: currentStage ? '#1A1A1A' : '#6B6B6B' }}
        >
          <option value="">Alle stages</option>
          {STAGES.map((s) => (
            <option key={s.pct} value={String(s.pct)}>
              {s.pct}% — {s.label}
            </option>
          ))}
        </select>
      )}

      {/* Wis filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-gray-100"
          style={{ color: '#6B6B6B' }}
        >
          <X size={14} />
          Wis filters
        </button>
      )}
    </div>
  )
}

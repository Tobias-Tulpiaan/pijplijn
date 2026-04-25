'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface Props {
  companies:          { id: string; name: string }[]
  users:              { id: string; name: string }[]
  currentQ:           string
  currentStatus:      string
  currentCompanyId:   string
  currentConsultantId: string
}

export function VacatureFilterBar({ companies, users, currentQ, currentStatus, currentCompanyId, currentConsultantId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(currentQ)

  const hasFilters = !!(currentQ || currentStatus || currentCompanyId || currentConsultantId)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k)
    }
    return `${pathname}?${params.toString()}`
  }

  function handleChange(key: string, value: string) {
    startTransition(() => {
      router.push(buildUrl({ [key]: value }))
      router.refresh()
    })
  }

  function handleSearch(value: string) {
    setQ(value)
    startTransition(() => {
      router.push(buildUrl({ q: value }))
      router.refresh()
    })
  }

  return (
    <div
      className={`flex flex-wrap gap-3 items-center rounded-lg p-3 shadow-sm transition-opacity${isPending ? ' opacity-60' : ''}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="relative flex-1 min-w-[180px]">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
        <input
          type="text"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Zoek op functietitel..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        />
      </div>

      <select value={currentStatus} onChange={(e) => handleChange('status', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentStatus ? '#1A1A1A' : '#6B6B6B' }}>
        <option value="">Alle statussen</option>
        <option value="open">Open</option>
        <option value="on_hold">On hold</option>
        <option value="vervuld">Vervuld</option>
        <option value="gesloten">Gesloten</option>
      </select>

      <select value={currentCompanyId} onChange={(e) => handleChange('companyId', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentCompanyId ? '#1A1A1A' : '#6B6B6B' }}>
        <option value="">Alle opdrachtgevers</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select value={currentConsultantId} onChange={(e) => handleChange('consultantId', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: currentConsultantId ? '#1A1A1A' : '#6B6B6B' }}>
        <option value="">Alle consultants</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      {hasFilters && (
        <button onClick={() => { setQ(''); startTransition(() => { router.push(pathname); router.refresh() }) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-gray-100"
          style={{ color: '#6B6B6B' }}>
          <X size={14} /> Wis filters
        </button>
      )}
    </div>
  )
}

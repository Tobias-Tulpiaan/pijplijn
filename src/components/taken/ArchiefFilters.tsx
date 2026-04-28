'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'
import { Search } from 'lucide-react'

interface Props {
  users:           { id: string; name: string }[]
  currentFrom:     string
  currentTo:       string
  currentAssignee: string
  currentType:     string
  currentQ:        string
}

export function ArchiefFilters({ users, currentFrom, currentTo, currentAssignee, currentType, currentQ }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ]    = useState(currentQ)

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) params.set('q', q.trim())
      else          params.delete('q')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else       params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function setRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('van', format(from, 'yyyy-MM-dd'))
    params.set('tot', format(to,   'yyyy-MM-dd'))
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const today = new Date()

  function isActive(from: Date, to: Date): boolean {
    return (
      currentFrom === format(from, 'yyyy-MM-dd') &&
      currentTo   === format(to,   'yyyy-MM-dd')
    )
  }

  function btnStyle(from: Date, to: Date): React.CSSProperties {
    return isActive(from, to)
      ? { backgroundColor: '#CBAD74', borderColor: '#CBAD74', color: '#1A1A1A', fontWeight: 600 }
      : { borderColor: '#e5e7eb', color: '#6B6B6B' }
  }

  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(today,   { weekStartsOn: 1 })
  const monthStart = startOfMonth(today)
  const monthEnd   = endOfMonth(today)
  const last30Start = subDays(today, 30)

  return (
    <div className="space-y-3 mb-6">
      {/* Snelfilters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs self-center" style={{ color: '#9ca3af' }}>Snelfilter:</span>
        <button
          onClick={() => setRange(today, today)}
          className="px-3 py-1 text-xs rounded-full border transition-colors hover:border-[#CBAD74]"
          style={btnStyle(today, today)}
        >
          Vandaag
        </button>
        <button
          onClick={() => setRange(weekStart, weekEnd)}
          className="px-3 py-1 text-xs rounded-full border transition-colors hover:border-[#CBAD74]"
          style={btnStyle(weekStart, weekEnd)}
        >
          Deze week
        </button>
        <button
          onClick={() => setRange(monthStart, monthEnd)}
          className="px-3 py-1 text-xs rounded-full border transition-colors hover:border-[#CBAD74]"
          style={btnStyle(monthStart, monthEnd)}
        >
          Deze maand
        </button>
        <button
          onClick={() => setRange(last30Start, today)}
          className="px-3 py-1 text-xs rounded-full border transition-colors hover:border-[#CBAD74]"
          style={btnStyle(last30Start, today)}
        >
          Laatste 30 dagen
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Zoek */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel..."
            className="w-full pl-8 pr-3 h-9 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
            style={{ color: '#1A1A1A' }}
          />
        </div>

        {/* Van */}
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => update('van', e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
          title="Van"
        />

        {/* Tot */}
        <input
          type="date"
          value={currentTo}
          onChange={(e) => update('tot', e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
          title="Tot"
        />

        {/* Consultant */}
        <select
          value={currentAssignee}
          onChange={(e) => update('assignedToId', e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        >
          <option value="">Alle consultants</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Type */}
        <select
          value={currentType}
          onChange={(e) => update('type', e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        >
          <option value="">Alle types</option>
          <option value="kandidaat">Kandidaat-taken</option>
          <option value="opdrachtgever">Opdrachtgever-taken</option>
          <option value="gedeeld">Gedeelde taken</option>
          <option value="persoonlijk">Persoonlijke taken</option>
        </select>
      </div>
    </div>
  )
}

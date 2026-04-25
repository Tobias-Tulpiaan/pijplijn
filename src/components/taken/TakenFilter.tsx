'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface Props {
  users:         { id: string; name: string }[]
  currentFilter: string
  currentQ:      string
}

export function TakenFilter({ users, currentFilter, currentQ }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ]    = useState(currentQ)

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) params.set('q', q.trim())
      else          params.delete('q')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-2 mb-6">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: '#9ca3af' }}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op taakomschrijving of kandidaatnaam..."
          className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        />
      </div>
      <div className="flex justify-end">
        <select
          value={currentFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
          style={{ color: '#1A1A1A' }}
        >
          <option value="alle">Alle taken</option>
          <option value="mijn">Mijn taken</option>
          <option value="gedeeld">Gedeelde taken</option>
          {users.map((u) => (
            <option key={u.id} value={u.name}>{u.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface Props {
  users: { id: string; name: string }[]
  currentReden: string
  currentOwner: string
  currentQ: string
}

export function ArchiefFilter({ users, currentReden, currentOwner, currentQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleChange(key: string, value: string) {
    router.push(buildUrl({ [key]: value }))
    router.refresh()
  }

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
      router.refresh()
    }, 300)
  }

  useEffect(() => {
    setSearchInput(currentQ)
  }, [currentQ])

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6B6B6B' }} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Zoeken..."
          className="pl-8 pr-3 h-9 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] w-40"
          style={{ color: '#1A1A1A' }}
        />
      </div>
      <select
        value={currentReden}
        onChange={(e) => handleChange('reden', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: '#1A1A1A' }}
      >
        <option value="">Alle redenen</option>
        <option value="aangenomen">Aangenomen</option>
        <option value="afgewezen">Afgewezen</option>
        <option value="afgehaakt">Afgehaakt</option>
        <option value="niet_relevant">Niet relevant</option>
      </select>
      <select
        value={currentOwner}
        onChange={(e) => handleChange('owner', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: '#1A1A1A' }}
      >
        <option value="">Alle consultants</option>
        {users.map((u) => (
          <option key={u.id} value={u.name}>{u.name}</option>
        ))}
      </select>
    </div>
  )
}

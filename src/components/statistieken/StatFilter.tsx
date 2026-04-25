'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const PERIODS = [
  { value: 'this_month',    label: 'Deze maand' },
  { value: 'last_month',    label: 'Vorige maand' },
  { value: 'last_3_months', label: 'Laatste 3 maanden' },
  { value: 'this_year',     label: 'Dit jaar' },
  { value: 'all',           label: 'Alles' },
]

interface Props {
  users:          { id: string; name: string }[]
  currentPeriod:  string
  currentOwnerId: string
}

export function StatFilter({ users, currentPeriod, currentOwnerId }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        value={currentPeriod}
        onChange={(e) => handleChange('period', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: '#1A1A1A' }}
      >
        {PERIODS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <select
        value={currentOwnerId}
        onChange={(e) => handleChange('consultant', e.target.value)}
        className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
        style={{ color: '#1A1A1A' }}
      >
        <option value="">Alle consultants</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
    </div>
  )
}

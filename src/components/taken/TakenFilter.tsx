'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Props {
  users: { id: string; name: string }[]
  currentFilter: string
}

export function TakenFilter({ users, currentFilter }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(value: string) {
    const url = value ? `${pathname}?filter=${encodeURIComponent(value)}` : pathname
    router.push(url)
    router.refresh()
  }

  return (
    <select
      value={currentFilter}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 px-3 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
      style={{ color: '#1A1A1A' }}
    >
      <option value="alle">Alle taken</option>
      <option value="mijn">Mijn taken</option>
      {users.map((u) => (
        <option key={u.id} value={u.name}>{u.name}</option>
      ))}
    </select>
  )
}

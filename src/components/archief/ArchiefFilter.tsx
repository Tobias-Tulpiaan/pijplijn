'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  users: { id: string; name: string }[]
  currentReden: string
  currentOwner: string
}

export function ArchiefFilter({ users, currentReden, currentOwner }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  return (
    <div className="flex gap-2">
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

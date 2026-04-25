'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { CandidateWithRelations } from '@/types'
import { STAGE_LABEL } from '@/types'

type SortKey = 'name' | 'role' | 'company' | 'owner' | 'stage' | 'lastContact'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, active, dir }: { col: SortKey; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ChevronsUpDown size={13} className="ml-1 opacity-40" />
  return dir === 'asc'
    ? <ChevronUp size={13} className="ml-1" style={{ color: '#1A1A1A' }} />
    : <ChevronDown size={13} className="ml-1" style={{ color: '#1A1A1A' }} />
}

function initialen(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

interface KandidatenTabelProps {
  candidates: CandidateWithRelations[]
}

export function KandidatenTabel({ candidates }: KandidatenTabelProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...candidates].sort((a, b) => {
    let av = '', bv = ''
    if (sortKey === 'name') { av = a.name; bv = b.name }
    else if (sortKey === 'role') { av = a.role; bv = b.role }
    else if (sortKey === 'company') { av = a.company?.name ?? ''; bv = b.company?.name ?? '' }
    else if (sortKey === 'owner') { av = a.owner.name; bv = b.owner.name }
    else if (sortKey === 'stage') { av = String(a.stage); bv = String(b.stage) }
    else if (sortKey === 'lastContact') {
      av = String(a.lastContact ?? a.createdAt)
      bv = String(b.lastContact ?? b.createdAt)
    }
    const cmp = av.localeCompare(bv, 'nl')
    return sortDir === 'asc' ? cmp : -cmp
  })

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Kandidaat "${name}" verwijderen? Dit kan niet ongedaan worden.`)) return
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Verwijderen mislukt')
      router.refresh()
    } catch {
      alert('Verwijderen mislukt. Probeer opnieuw.')
    }
  }

  const thStyle = (key: SortKey) => ({
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    backgroundColor: '#CBAD74',
    color: '#1A1A1A',
  })

  if (candidates.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16"
        style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
      >
        <p className="text-base font-semibold" style={{ color: '#A68A52' }}>
          Geen kandidaten gevonden
        </p>
        <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>Pas de filters aan</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {([
                ['name', 'Naam'],
                ['role', 'Functie'],
                ['company', 'Opdrachtgever'],
                ['owner', 'Consultant'],
                ['stage', 'Stage'],
                ['lastContact', 'Laatste contact'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                  style={thStyle(key)}
                >
                  <span className="flex items-center">
                    {label}
                    <SortIcon col={key} active={sortKey} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th
                className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
              >
                Acties
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/kandidaat/${c.id}`)}
                className="cursor-pointer transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#F8F5EE' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(203,173,116,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#F8F5EE')}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>
                  {c.name}
                </td>
                <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>{c.role}</td>
                <td className="px-4 py-3" style={{ color: '#A68A52' }}>
                  {c.company?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                    >
                      {initialen(c.owner.name)}
                    </div>
                    <span style={{ color: '#1A1A1A' }}>{c.owner.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                  >
                    {c.stage}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                  {c.lastContact
                    ? formatDistanceToNow(new Date(c.lastContact), { addSuffix: true, locale: nl })
                    : formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: nl })}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                      aria-label="Acties"
                    >
                      <MoreHorizontal size={16} style={{ color: '#6B6B6B' }} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/kandidaat/${c.id}`)}
                      >
                        <Pencil size={14} />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(c.id, c.name)}
                      >
                        <Trash2 size={14} />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Pencil, Trash2, Archive, UserCheck, X,
} from 'lucide-react'
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
import { BulkArchiveerDialog } from './BulkArchiveerDialog'

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
  users: { id: string; name: string }[]
}

export function KandidatenTabel({ candidates, users }: KandidatenTabelProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkArchiveerOpen, setBulkArchiveerOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

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

  const allSelected = sorted.length > 0 && sorted.every((c) => selectedIds.includes(c.id))

  function toggleAll() {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(sorted.map((c) => c.id))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

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

  async function handleBulkConsultant(userId: string, userName: string) {
    if (!confirm(`Consultant wijzigen naar ${userName} voor ${selectedIds.length} kandidaat${selectedIds.length > 1 ? 'en' : ''}?`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/candidates/bulk-update-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, ownerId: userId }),
      })
      if (!res.ok) throw new Error('Mislukt')
      setSelectedIds([])
      router.refresh()
    } catch {
      alert('Wijzigen mislukt. Probeer opnieuw.')
    } finally {
      setBulkLoading(false)
    }
  }

  const thBase = 'px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide'
  const thStyle = { backgroundColor: '#CBAD74', color: '#1A1A1A' }

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
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border text-sm"
          style={{ backgroundColor: '#F8F5EE', borderColor: '#CBAD74' }}
        >
          <span className="font-medium" style={{ color: '#1A1A1A' }}>
            {selectedIds.length} kandidaat{selectedIds.length > 1 ? 'en' : ''} geselecteerd
          </span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              onClick={() => setBulkArchiveerOpen(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: '#1A1A1A', color: '#ffffff' }}
            >
              <Archive size={14} />
              Archiveren
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
                style={{ borderColor: '#CBAD74', color: '#1A1A1A', backgroundColor: '#ffffff' }}
              >
                <UserCheck size={14} />
                Wijzig consultant
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {users.map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => handleBulkConsultant(u.id, u.name)}>
                    {u.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}
            >
              <X size={14} />
              Annuleer selectie
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thBase} style={thStyle} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer accent-[#1A1A1A]"
                    aria-label="Selecteer alles"
                  />
                </th>
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
                    className={thBase}
                    style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span className="flex items-center">
                      {label}
                      <SortIcon col={key} active={sortKey} dir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className={thBase} style={thStyle}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/kandidaat/${c.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ backgroundColor: isSelected ? 'rgba(203,173,116,0.15)' : i % 2 === 0 ? '#ffffff' : '#F8F5EE' }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(203,173,116,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(203,173,116,0.15)' : i % 2 === 0 ? '#ffffff' : '#F8F5EE' }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 cursor-pointer accent-[#1A1A1A]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1A1A1A' }}>{c.name}</td>
                    <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>{c.role}</td>
                    <td className="px-4 py-3" style={{ color: '#A68A52' }}>{c.company?.name ?? '—'}</td>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          aria-label="Acties"
                        >
                          <MoreHorizontal size={16} style={{ color: '#6B6B6B' }} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          <DropdownMenuItem onClick={() => router.push(`/kandidaat/${c.id}`)}>
                            <Pencil size={14} />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(c.id, c.name)}>
                            <Trash2 size={14} />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {sorted.map((c) => {
          const isSelected = selectedIds.includes(c.id)
          return (
            <div
              key={c.id}
              className="rounded-lg border p-4 transition-colors"
              style={{
                borderColor: isSelected ? '#CBAD74' : '#e5e7eb',
                backgroundColor: isSelected ? 'rgba(203,173,116,0.08)' : '#ffffff',
              }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer accent-[#1A1A1A]"
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/kandidaat/${c.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{c.name}</p>
                      <p className="text-sm" style={{ color: '#6B6B6B' }}>{c.role}</p>
                    </div>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                    >
                      {c.stage}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#6B6B6B' }}>
                    {c.company && (
                      <span style={{ color: '#A68A52' }}>{c.company.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                      >
                        {initialen(c.owner.name)}
                      </div>
                      {c.owner.name}
                    </span>
                    <span>
                      {c.lastContact
                        ? formatDistanceToNow(new Date(c.lastContact), { addSuffix: true, locale: nl })
                        : formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {bulkArchiveerOpen && (
        <BulkArchiveerDialog
          ids={selectedIds}
          count={selectedIds.length}
          onSuccess={() => {
            setSelectedIds([])
            setBulkArchiveerOpen(false)
            router.refresh()
          }}
          onClose={() => setBulkArchiveerOpen(false)}
        />
      )}
    </div>
  )
}

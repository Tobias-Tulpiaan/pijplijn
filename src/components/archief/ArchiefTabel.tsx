'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { RotateCcw, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { ArchiefRijActies } from './ArchiefRijActies'

const REDEN_LABELS: Record<string, { label: string; color: string }> = {
  aangenomen:    { label: 'Aangenomen',  color: '#16a34a' },
  afgewezen:     { label: 'Afgewezen',   color: '#dc2626' },
  afgehaakt:     { label: 'Afgehaakt',   color: '#d97706' },
  niet_relevant: { label: 'Niet relevant', color: '#6B6B6B' },
}

interface ArchiefCandidate {
  id: string
  name: string
  role: string
  archivedReason: string | null
  archivedAt: Date | null
  company: { name: string } | null
  owner: { name: string }
}

interface Props {
  candidates: ArchiefCandidate[]
}

export function ArchiefTabel({ candidates }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const allSelected = candidates.length > 0 && candidates.every((c) => selectedIds.includes(c.id))

  function toggleAll() {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(candidates.map((c) => c.id))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleBulkRestore() {
    if (!confirm(`${selectedIds.length} kandidaat${selectedIds.length > 1 ? 'en' : ''} heractiveren?`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/candidates/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error('Mislukt')
      setSelectedIds([])
      router.refresh()
    } catch {
      alert('Heractiveren mislukt. Probeer opnieuw.')
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.length} kandidaat${selectedIds.length > 1 ? 'en' : ''} definitief verwijderen? Dit kan niet ongedaan worden.`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/candidates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error('Mislukt')
      setSelectedIds([])
      router.refresh()
    } catch {
      alert('Verwijderen mislukt. Probeer opnieuw.')
    } finally {
      setBulkLoading(false)
    }
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
              onClick={handleBulkRestore}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            >
              <RotateCcw size={14} />
              Heractiveren
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              <Trash2 size={14} />
              Definitief verwijderen
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border"
              style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}
            >
              <X size={14} />
              Annuleer selectie
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer accent-[#1A1A1A]"
                    aria-label="Selecteer alles"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Naam</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Functie</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Opdrachtgever</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Reden</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Gearchiveerd</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Consultant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const redenInfo = c.archivedReason ? REDEN_LABELS[c.archivedReason] : null
                const isSelected = selectedIds.includes(c.id)
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < candidates.length - 1 ? '1px solid #f3f4f6' : undefined,
                      backgroundColor: isSelected ? 'rgba(203,173,116,0.08)' : undefined,
                    }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c.id)}
                        className="w-4 h-4 cursor-pointer accent-[#1A1A1A]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/kandidaat/${c.id}`}
                        className="font-medium hover:underline"
                        style={{ color: '#1A1A1A' }}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>{c.role}</td>
                    <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>
                      {c.company?.name ?? <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {redenInfo ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: redenInfo.color }}
                        >
                          {redenInfo.label}
                        </span>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                      {c.archivedAt
                        ? format(new Date(c.archivedAt), 'd MMM yyyy', { locale: nl })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#A68A52' }}>{c.owner.name}</td>
                    <td className="px-4 py-3">
                      <ArchiefRijActies candidateId={c.id} candidateName={c.name} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'
import { Building2, Users, Briefcase, ExternalLink, Archive, RotateCcw, Trash2, CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react'
import { ArchiveerOpdrachtgeverDialog } from './ArchiveerOpdrachtgeverDialog'
import { VerwijderOpdrachtgeverDialog } from './VerwijderOpdrachtgeverDialog'

export interface CompanyRow {
  id:            string
  name:          string
  contactPerson: string | null
  contactEmail:  string | null
  archived:      boolean
  archivedAt:    string | null
  archivedNote:  string | null
  contacts:      { id: string; name: string; email: string | null }[]
  _count:        { candidates: number; vacatures: number }
}

interface Props {
  companies:    CompanyRow[]
  view:         string
  showArchived: boolean
}

type SortKey = 'name' | 'candidates' | 'vacatures'

export function OpdrachtgeversList({ companies, view, showArchived }: Props) {
  const router = useRouter()

  // Dialog state
  const [archiveTarget,  setArchiveTarget]  = useState<CompanyRow | null>(null)
  const [verwijderTarget, setVerwijderTarget] = useState<CompanyRow | null>(null)

  // Bulk selection (lijst view only)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [bulkSaving,  setBulkSaving]  = useState(false)
  const [bulkError,   setBulkError]   = useState('')
  const [bulkResults, setBulkResults] = useState<{ failed: { id: string; name: string; reason: string }[] } | null>(null)

  // Sort (lijst view)
  const [sortKey,  setSortKey]  = useState<SortKey>('name')
  const [sortDesc, setSortDesc] = useState(false)

  // Restore inline
  const [restoring, setRestoring] = useState<string | null>(null)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === companies.length) setSelected(new Set())
    else setSelected(new Set(companies.map((c) => c.id)))
  }

  function setSort(key: SortKey) {
    if (sortKey === key) setSortDesc((d) => !d)
    else { setSortKey(key); setSortDesc(false) }
  }

  const sorted = [...companies].sort((a, b) => {
    let diff = 0
    if (sortKey === 'name')       diff = a.name.localeCompare(b.name)
    if (sortKey === 'candidates') diff = a._count.candidates - b._count.candidates
    if (sortKey === 'vacatures')  diff = a._count.vacatures  - b._count.vacatures
    return sortDesc ? -diff : diff
  })

  async function handleBulkArchive() {
    if (selected.size === 0) return
    setBulkSaving(true); setBulkError(''); setBulkResults(null)
    try {
      const res = await fetch('/api/companies/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), closeOpenVacatures: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Bulk archiveren mislukt')
      setBulkResults(data)
      setSelected(new Set())
      router.refresh()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk archiveren mislukt')
    } finally { setBulkSaving(false) }
  }

  async function handleBulkRestore() {
    if (selected.size === 0) return
    setBulkSaving(true); setBulkError(''); setBulkResults(null)
    try {
      const res = await fetch('/api/companies/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (!res.ok) throw new Error('Bulk heractiveren mislukt')
      setSelected(new Set())
      router.refresh()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk heractiveren mislukt')
    } finally { setBulkSaving(false) }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!window.confirm(`${selected.size} opdrachtgever${selected.size !== 1 ? 's' : ''} definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    setBulkSaving(true); setBulkError(''); setBulkResults(null)
    try {
      const res = await fetch('/api/companies/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Bulk verwijderen mislukt')
      setBulkResults(data)
      setSelected(new Set())
      router.refresh()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk verwijderen mislukt')
    } finally { setBulkSaving(false) }
  }

  async function handleRestore(company: CompanyRow) {
    setRestoring(company.id)
    try {
      const res = await fetch(`/api/companies/${company.id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Heractiveren mislukt')
      router.refresh()
    } finally { setRestoring(null) }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} style={{ color: '#d1d5db' }} />
    return sortDesc
      ? <ChevronDown size={12} style={{ color: '#A68A52' }} />
      : <ChevronUp   size={12} style={{ color: '#A68A52' }} />
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
        style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}>
        <Building2 size={36} style={{ color: '#CBAD74' }} className="mb-3" />
        <p className="text-lg font-semibold" style={{ color: '#A68A52' }}>
          {showArchived ? 'Geen gearchiveerde opdrachtgevers' : 'Nog geen opdrachtgevers'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Bulk error */}
      {bulkError && (
        <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
          {bulkError}
        </div>
      )}
      {bulkResults?.failed && bulkResults.failed.length > 0 && (
        <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: 'rgba(203,173,116,0.1)', color: '#A68A52', borderColor: 'rgba(203,173,116,0.4)' }}>
          <p className="font-semibold mb-1">Mislukt voor:</p>
          {bulkResults.failed.map((f) => (
            <p key={f.id}>{f.name}: {f.reason}</p>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg border"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}>
          <span className="text-sm font-medium" style={{ color: '#CBAD74' }}>{selected.size} geselecteerd</span>
          <div className="flex gap-2 ml-auto">
            {!showArchived && (
              <button onClick={handleBulkArchive} disabled={bulkSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium disabled:opacity-50"
                style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}>
                <Archive size={12} /> Archiveren
              </button>
            )}
            {showArchived && (
              <>
                <button onClick={handleBulkRestore} disabled={bulkSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}>
                  <RotateCcw size={12} /> Heractiveren
                </button>
                <button onClick={handleBulkDelete} disabled={bulkSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                  <Trash2 size={12} /> Verwijderen
                </button>
              </>
            )}
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs rounded border"
              style={{ borderColor: '#6B6B6B', color: '#9ca3af' }}>
              Deselecteren
            </button>
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {view !== 'lijst' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id}
              className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: showArchived ? '#f9fafb' : '#ffffff' }}>
              <Link href={`/opdrachtgevers/${company.id}`} className="block p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: showArchived ? '#f3f4f6' : 'rgba(203,173,116,0.2)' }}>
                    <Building2 size={20} style={{ color: showArchived ? '#9ca3af' : '#A68A52' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate" style={{ color: showArchived ? '#9ca3af' : '#1A1A1A' }}>
                      {company.name}
                    </h3>
                    {company.contactPerson && (
                      <p className="text-sm truncate" style={{ color: '#6B6B6B' }}>{company.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm" style={{ color: showArchived ? '#9ca3af' : '#A68A52' }}>
                  <span className="flex items-center gap-1"><Users size={13} />{company._count.candidates}</span>
                  <span className="flex items-center gap-1"><Briefcase size={13} />{company._count.vacatures}</span>
                </div>

                {showArchived && company.archivedAt && (
                  <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                    Gearchiveerd op {format(new Date(company.archivedAt), 'd MMM yyyy', { locale: nl })}
                  </p>
                )}
                {showArchived && company.archivedNote && (
                  <p className="text-xs mt-1 italic" style={{ color: '#9ca3af' }}>{company.archivedNote}</p>
                )}
              </Link>

              <div className="px-5 pb-4 flex gap-2">
                {!showArchived && (
                  <button
                    onClick={() => setArchiveTarget(company)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}
                  >
                    <Archive size={12} /> Archiveren
                  </button>
                )}
                {showArchived && (
                  <>
                    <button
                      onClick={() => handleRestore(company)}
                      disabled={restoring === company.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors hover:bg-gray-50 disabled:opacity-50"
                      style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}
                    >
                      <RotateCcw size={12} /> {restoring === company.id ? '...' : 'Heractiveren'}
                    </button>
                    <button
                      onClick={() => setVerwijderTarget(company)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors hover:bg-red-50"
                      style={{ borderColor: '#fecaca', color: '#dc2626' }}
                    >
                      <Trash2 size={12} /> Verwijderen
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIJST VIEW ── */}
      {view === 'lijst' && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleAll}>
                      {selected.size === companies.length && companies.length > 0
                        ? <CheckSquare size={15} style={{ color: '#CBAD74' }} />
                        : <Square size={15} style={{ color: '#9ca3af' }} />
                      }
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" style={{ color: '#1A1A1A' }}
                    onClick={() => setSort('name')}>
                    <span className="flex items-center gap-1">Bedrijfsnaam <SortIcon col="name" /></span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold cursor-pointer select-none" style={{ color: '#1A1A1A' }}
                    onClick={() => setSort('candidates')}>
                    <span className="flex items-center justify-center gap-1"><Users size={13} /> <SortIcon col="candidates" /></span>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold cursor-pointer select-none" style={{ color: '#1A1A1A' }}
                    onClick={() => setSort('vacatures')}>
                    <span className="flex items-center justify-center gap-1"><Briefcase size={13} /> <SortIcon col="vacatures" /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#1A1A1A' }}>Hoofdcontact</th>
                  {showArchived && <th className="px-4 py-3 text-left font-semibold" style={{ color: '#1A1A1A' }}>Gearchiveerd</th>}
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: '#1A1A1A' }}>Acties</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((company, i) => (
                  <tr key={company.id}
                    style={{ borderTop: i > 0 ? '1px solid #e5e7eb' : undefined, backgroundColor: selected.has(company.id) ? 'rgba(203,173,116,0.06)' : '#fff' }}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(company.id)}>
                        {selected.has(company.id)
                          ? <CheckSquare size={15} style={{ color: '#CBAD74' }} />
                          : <Square size={15} style={{ color: '#9ca3af' }} />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/opdrachtgevers/${company.id}`}
                        className="font-medium hover:underline flex items-center gap-1.5"
                        style={{ color: '#1A1A1A' }}>
                        {company.name}
                        <ExternalLink size={11} style={{ color: '#9ca3af' }} />
                      </Link>
                      {company.contactPerson && <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>{company.contactPerson}</p>}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: company._count.candidates > 0 ? '#A68A52' : '#9ca3af' }}>
                      {company._count.candidates}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: company._count.vacatures > 0 ? '#A68A52' : '#9ca3af' }}>
                      {company._count.vacatures}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#6B6B6B' }}>
                      {company.contacts[0]?.name ?? company.contactPerson ?? '—'}
                      {company.contacts[0]?.email && (
                        <span className="block text-xs" style={{ color: '#9ca3af' }}>{company.contacts[0].email}</span>
                      )}
                    </td>
                    {showArchived && (
                      <td className="px-4 py-3 text-xs" style={{ color: '#9ca3af' }}>
                        {company.archivedAt
                          ? format(new Date(company.archivedAt), 'd MMM yyyy', { locale: nl })
                          : '—'}
                        {company.archivedNote && <span className="block italic">{company.archivedNote}</span>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!showArchived && (
                          <button onClick={() => setArchiveTarget(company)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border hover:bg-gray-50 transition-colors"
                            style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}>
                            <Archive size={11} /> Archiveren
                          </button>
                        )}
                        {showArchived && (
                          <>
                            <button onClick={() => handleRestore(company)} disabled={restoring === company.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
                              style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}>
                              <RotateCcw size={11} /> {restoring === company.id ? '...' : 'Heractiveren'}
                            </button>
                            <button onClick={() => setVerwijderTarget(company)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border hover:bg-red-50"
                              style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                              <Trash2 size={11} /> Verwijderen
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card-grid fallback */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {sorted.map((company) => (
              <div key={company.id}
                className="rounded-xl border border-gray-200 p-4"
                style={{ backgroundColor: selected.has(company.id) ? 'rgba(203,173,116,0.06)' : '#fff' }}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleSelect(company.id)} className="mt-0.5 flex-shrink-0">
                    {selected.has(company.id)
                      ? <CheckSquare size={16} style={{ color: '#CBAD74' }} />
                      : <Square size={16} style={{ color: '#9ca3af' }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/opdrachtgevers/${company.id}`}
                      className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>
                      {company.name}
                    </Link>
                    {company.contactPerson && <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>{company.contactPerson}</p>}
                    <div className="flex gap-3 mt-1.5 text-xs" style={{ color: '#A68A52' }}>
                      <span className="flex items-center gap-1"><Users size={11} />{company._count.candidates}</span>
                      <span className="flex items-center gap-1"><Briefcase size={11} />{company._count.vacatures}</span>
                    </div>
                    {showArchived && company.archivedAt && (
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                        Gearchiveerd {format(new Date(company.archivedAt), 'd MMM yyyy', { locale: nl })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!showArchived && (
                      <button onClick={() => setArchiveTarget(company)}
                        className="p-1.5 rounded border hover:bg-gray-50"
                        style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}>
                        <Archive size={13} />
                      </button>
                    )}
                    {showArchived && (
                      <>
                        <button onClick={() => handleRestore(company)} disabled={restoring === company.id}
                          className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
                          style={{ borderColor: '#e5e7eb', color: '#6B6B6B' }}>
                          <RotateCcw size={13} />
                        </button>
                        <button onClick={() => setVerwijderTarget(company)}
                          className="p-1.5 rounded border hover:bg-red-50"
                          style={{ borderColor: '#fecaca', color: '#dc2626' }}>
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      {archiveTarget && (
        <ArchiveerOpdrachtgeverDialog
          companyId={archiveTarget.id}
          companyName={archiveTarget.name}
          activeCandidates={archiveTarget._count.candidates}
          openVacatures={archiveTarget._count.vacatures}
          open={true}
          onClose={() => { setArchiveTarget(null); router.refresh() }}
        />
      )}

      {verwijderTarget && (
        <VerwijderOpdrachtgeverDialog
          companyId={verwijderTarget.id}
          companyName={verwijderTarget.name}
          archivedNote={verwijderTarget.archivedNote}
          totalCandidates={verwijderTarget._count.candidates}
          totalVacatures={verwijderTarget._count.vacatures}
          open={true}
          onClose={() => setVerwijderTarget(null)}
        />
      )}
    </div>
  )
}

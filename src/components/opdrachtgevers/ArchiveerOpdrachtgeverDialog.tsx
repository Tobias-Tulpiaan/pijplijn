'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, AlertCircle } from 'lucide-react'

interface Props {
  companyId:        string
  companyName:      string
  activeCandidates: number
  openVacatures:    number
  open:             boolean
  onClose:          () => void
}

export function ArchiveerOpdrachtgeverDialog({
  companyId, companyName, activeCandidates, openVacatures, open, onClose,
}: Props) {
  const router = useRouter()
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  if (!open) return null

  const blocked = activeCandidates > 0

  async function handleSubmit() {
    if (blocked) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/companies/${companyId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedNote: note, closeOpenVacatures: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Archiveren mislukt')
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archiveren mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6"
        style={{ backgroundColor: '#fff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>
            Opdrachtgever archiveren
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#6B6B6B' }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
          <span className="font-semibold" style={{ color: '#1A1A1A' }}>{companyName}</span> wordt gearchiveerd
          en verdwijnt uit de actieve weergave.
        </p>

        {error && (
          <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
            {error}
          </div>
        )}

        {activeCandidates > 0 && (
          <div className="mb-3 flex gap-2 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-sm" style={{ color: '#991b1b' }}>
              <strong>{activeCandidates} actieve kandidaten</strong> gekoppeld aan deze opdrachtgever.
              Archiveer of verplaats deze eerst.
            </p>
          </div>
        )}

        {openVacatures > 0 && activeCandidates === 0 && (
          <div className="mb-3 flex gap-2 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: 'rgba(203,173,116,0.1)', borderColor: 'rgba(203,173,116,0.4)' }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#A68A52' }} />
            <p className="text-sm" style={{ color: '#A68A52' }}>
              <strong>{openVacatures} open vacature{openVacatures !== 1 ? 's' : ''}</strong> worden automatisch
              op &ldquo;Gesloten&rdquo; gezet bij archiveren.
            </p>
          </div>
        )}

        {activeCandidates === 0 && openVacatures === 0 && (
          <div className="mb-3 flex gap-2 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: 'rgba(203,173,116,0.05)', borderColor: 'rgba(203,173,116,0.3)' }}>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>Geen actieve kandidaten of open vacatures. Klaar om te archiveren.</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Notitie (optioneel)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] resize-none"
            rows={2}
            placeholder="Reden voor archivering..."
            disabled={saving || blocked}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving || blocked}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
          >
            {saving ? 'Archiveren...' : 'Archiveren'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            style={{ color: '#6B6B6B' }}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  )
}

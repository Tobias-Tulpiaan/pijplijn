'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle } from 'lucide-react'

interface Props {
  companyId:       string
  companyName:     string
  archivedNote:    string | null
  totalCandidates: number
  totalVacatures:  number
  open:            boolean
  onClose:         () => void
}

export function VerwijderOpdrachtgeverDialog({
  companyId, companyName, archivedNote, totalCandidates, totalVacatures, open, onClose,
}: Props) {
  const router = useRouter()
  const [confirm,  setConfirm]  = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  if (!open) return null

  const canDelete = totalCandidates === 0 && totalVacatures === 0
  const confirmed = confirm === 'VERWIJDER'

  async function handleDelete() {
    if (!canDelete || !confirmed) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verwijderen mislukt')
      onClose()
      router.push('/opdrachtgevers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setDeleting(false)
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
          <h2 className="text-base font-bold" style={{ color: '#991b1b' }}>
            Definitief verwijderen
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: '#6B6B6B' }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
          Weet u zeker dat u{' '}
          <span className="font-semibold" style={{ color: '#1A1A1A' }}>{companyName}</span>{' '}
          permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>

        {error && (
          <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
            {error}
          </div>
        )}

        {!canDelete && (
          <div className="mb-3 flex gap-2 px-3 py-2.5 rounded-lg border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-sm" style={{ color: '#991b1b' }}>
              Kan niet verwijderen: nog{' '}
              {totalCandidates > 0 && <strong>{totalCandidates} kandidaten</strong>}
              {totalCandidates > 0 && totalVacatures > 0 && ' en '}
              {totalVacatures > 0 && <strong>{totalVacatures} vacatures</strong>}
              {' '}gekoppeld.
            </p>
          </div>
        )}

        {archivedNote && (
          <div className="mb-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium mb-0.5" style={{ color: '#6B6B6B' }}>Archiveringsnotitie</p>
            <p className="text-sm" style={{ color: '#1A1A1A' }}>{archivedNote}</p>
          </div>
        )}

        {canDelete && (
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>
              Typ <strong>VERWIJDER</strong> om te bevestigen
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-red-400"
              placeholder="VERWIJDER"
              disabled={deleting}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={!canDelete || !confirmed || deleting}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            {deleting ? 'Verwijderen...' : 'Definitief verwijderen'}
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

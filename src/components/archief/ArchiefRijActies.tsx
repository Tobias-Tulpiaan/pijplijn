'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, RotateCcw, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  candidateId: string
  candidateName: string
}

export function ArchiefRijActies({ candidateId, candidateName }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [reactiveerLoading, setReactiveerLoading] = useState(false)

  async function heractiveer() {
    setMenuOpen(false)
    setReactiveerLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })
      if (!res.ok) throw new Error()
      router.push('/pijplijn')
      router.refresh()
    } catch {
      setReactiveerLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteError('')
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verwijderen mislukt')
      }
      setDeleteOpen(false)
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        disabled={reactiveerLoading}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        style={{ color: '#6B6B6B' }}
        aria-label="Acties"
      >
        {reactiveerLoading ? (
          <span className="text-xs" style={{ color: '#A68A52' }}>Bezig…</span>
        ) : (
          <MoreHorizontal size={16} />
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 w-48 rounded-lg shadow-lg border border-gray-100 py-1"
            style={{ backgroundColor: '#ffffff' }}
          >
            <a
              href={`/kandidaat/${candidateId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              style={{ color: '#1A1A1A' }}
              onClick={() => setMenuOpen(false)}
            >
              <Eye size={14} style={{ color: '#A68A52' }} />
              Bekijken
            </a>
            <button
              onClick={heractiveer}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              style={{ color: '#16a34a' }}
            >
              <RotateCcw size={14} />
              Heractiveren
            </button>
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />
            <button
              onClick={() => { setMenuOpen(false); setDeleteError(''); setDeleteOpen(true) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 transition-colors"
              style={{ color: '#dc2626' }}
            >
              <Trash2 size={14} />
              Definitief verwijderen
            </button>
          </div>
        </>
      )}

      <Dialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteError('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Kandidaat definitief verwijderen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Je staat op het punt{' '}
            <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{candidateName}</span>{' '}
            permanent te verwijderen. Dit kan niet ongedaan worden gemaakt.
            Alle stage-historie en taken worden ook verwijderd.
          </p>
          {deleteError && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Annuleren
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              style={{ backgroundColor: deleteLoading ? '#e5e7eb' : '#dc2626', color: '#ffffff' }}
            >
              {deleteLoading ? 'Verwijderen…' : 'Ja, definitief verwijderen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

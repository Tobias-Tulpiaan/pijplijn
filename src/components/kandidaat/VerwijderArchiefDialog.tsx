'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Props {
  candidateId: string
  candidateName: string
}

export function VerwijderArchiefDialog({ candidateId, candidateName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verwijderen mislukt')
      }
      setOpen(false)
      router.push('/archief')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setError(''); setOpen(true) }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:bg-red-50"
        style={{ color: '#dc2626', borderColor: '#fecaca' }}
      >
        <Trash2 size={13} />
        Definitief verwijderen
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Kandidaat definitief verwijderen?</DialogTitle>
          </DialogHeader>

          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Je staat op het punt{' '}
            <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{candidateName}</span>{' '}
            permanent te verwijderen uit het systeem. Dit kan niet ongedaan worden gemaakt.
            Alle stage-historie en taken worden ook verwijderd.
          </p>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              style={{ backgroundColor: loading ? '#e5e7eb' : '#dc2626', color: '#ffffff' }}
            >
              {loading ? 'Verwijderen…' : 'Ja, definitief verwijderen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

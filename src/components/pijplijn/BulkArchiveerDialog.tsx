'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const REDENEN = [
  { value: 'aangenomen',    label: 'Aangenomen',                   color: '#16a34a' },
  { value: 'afgewezen',     label: 'Afgewezen door opdrachtgever', color: '#dc2626' },
  { value: 'afgehaakt',     label: 'Kandidaat afgehaakt',          color: '#d97706' },
  { value: 'niet_relevant', label: 'Niet meer relevant',           color: '#6B6B6B' },
]

interface Props {
  ids: string[]
  count: number
  onSuccess: (archivedIds: string[]) => void
  onClose: () => void
}

export function BulkArchiveerDialog({ ids, count, onSuccess, onClose }: Props) {
  const [reden, setReden] = useState('')
  const [notitie, setNotitie] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reden) { setError('Kies een reden'); return }
    setError('')
    setLoading(true)
    setProgress(`Bezig met archiveren…`)

    try {
      const res = await fetch('/api/candidates/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, reason: reden, note: notitie.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Archiveren mislukt')

      if (data.failed?.length > 0) {
        setError(`${data.successful.length} gearchiveerd, ${data.failed.length} mislukt.`)
        setLoading(false)
        setProgress(null)
        if (data.successful.length > 0) onSuccess(data.successful)
      } else {
        onSuccess(data.successful)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#1A1A1A' }}>
            {count} kandidaat{count > 1 ? 'en' : ''} archiveren
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-4 py-3 rounded-md text-sm border"
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
            {error}
          </div>
        )}
        {progress && (
          <div className="px-4 py-3 rounded-md text-sm border"
            style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
            {progress}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Reden voor archiveren *</Label>
            <div className="space-y-2">
              {REDENEN.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: reden === r.value ? r.color : '#e5e7eb',
                    backgroundColor: reden === r.value ? `${r.color}10` : '#ffffff',
                  }}
                >
                  <input type="radio" name="reden" value={r.value} checked={reden === r.value}
                    onChange={() => setReden(r.value)} className="sr-only" />
                  <span className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                    style={{ borderColor: r.color, backgroundColor: reden === r.value ? r.color : 'transparent' }} />
                  <span className="text-sm" style={{ color: '#1A1A1A' }}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-notitie">Notitie (optioneel)</Label>
            <textarea
              id="bulk-notitie"
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none"
              placeholder="Wordt op alle geselecteerde kandidaten toegepast"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuleren</Button>
            <Button type="submit" disabled={loading || !reden}
              style={{ backgroundColor: loading ? '#e5e7eb' : '#1A1A1A', color: '#ffffff' }}>
              {loading ? progress ?? 'Archiveren…' : 'Archiveren'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

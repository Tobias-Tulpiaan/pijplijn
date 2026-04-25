'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface StageEntry {
  id:        string
  toStage:   number
  changedAt: string | Date
  note?:     string | null
}

interface Props {
  candidateId: string
  createdAt:   string | Date
  archivedAt?: string | Date | null
  stageHistory: StageEntry[]
}

function toDateInput(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 16) // datetime-local
}

export function DatumsAanpassenDialog({ candidateId, createdAt, archivedAt, stageHistory }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [newCreatedAt, setNewCreatedAt]   = useState(toDateInput(createdAt))
  const [newArchivedAt, setNewArchivedAt] = useState(archivedAt ? toDateInput(archivedAt) : '')
  const [historyDates, setHistoryDates]  = useState<Record<string, string>>(
    Object.fromEntries(stageHistory.map((h) => [h.id, toDateInput(h.changedAt)]))
  )

  function resetState() {
    setError('')
    setNewCreatedAt(toDateInput(createdAt))
    setNewArchivedAt(archivedAt ? toDateInput(archivedAt) : '')
    setHistoryDates(Object.fromEntries(stageHistory.map((h) => [h.id, toDateInput(h.changedAt)])))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const stageHistoryUpdates = stageHistory.map((h) => ({
        id:        h.id,
        changedAt: new Date(historyDates[h.id]).toISOString(),
      }))

      const res = await fetch(`/api/candidates/${candidateId}/dates`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdAt:           new Date(newCreatedAt).toISOString(),
          ...(newArchivedAt && { archivedAt: new Date(newArchivedAt).toISOString() }),
          stageHistoryUpdates,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Opslaan mislukt')
      }
      setOpen(false); router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-[#CBAD74]'

  return (
    <>
      <button
        onClick={() => { resetState(); setOpen(true) }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        style={{ color: '#6B6B6B' }}
        title="Datums aanpassen"
      >
        <Calendar size={14} />
        Datums
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Datums aanpassen</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aangemaakt op</Label>
              <input type="datetime-local" value={newCreatedAt} onChange={(e) => setNewCreatedAt(e.target.value)} className={inputCls} />
            </div>

            {archivedAt !== undefined && archivedAt !== null && (
              <div className="space-y-1.5">
                <Label>Gearchiveerd op</Label>
                <input type="datetime-local" value={newArchivedAt} onChange={(e) => setNewArchivedAt(e.target.value)} className={inputCls} />
              </div>
            )}

            {stageHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                  Stage-historiek
                </p>
                {stageHistory.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-12 flex-shrink-0 text-right" style={{ color: '#A68A52' }}>
                      {h.toStage}%
                    </span>
                    <input
                      type="datetime-local"
                      value={historyDates[h.id] ?? ''}
                      onChange={(e) => setHistoryDates((prev) => ({ ...prev, [h.id]: e.target.value }))}
                      className={`${inputCls} flex-1 text-xs`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuleren</Button>
              <Button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
                {loading ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

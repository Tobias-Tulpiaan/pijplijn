'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Archive } from 'lucide-react'

const REDENEN = [
  { value: 'aangenomen',  label: 'Aangenomen',                      color: '#16a34a' },
  { value: 'afgewezen',   label: 'Afgewezen door opdrachtgever',    color: '#dc2626' },
  { value: 'afgehaakt',   label: 'Kandidaat afgehaakt',             color: '#d97706' },
  { value: 'niet_relevant', label: 'Niet meer relevant',            color: '#6B6B6B' },
]

interface Props {
  candidateId: string
  candidateName: string
}

export function ArchiveerKandidaatDialog({ candidateId, candidateName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reden, setReden] = useState('')
  const [notitie, setNotitie] = useState('')

  function reset() {
    setError('')
    setReden('')
    setNotitie('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reden) { setError('Kies een reden'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true, archivedReason: reden, archivedNote: notitie.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Archiveren mislukt')
      }
      setOpen(false)
      router.push('/pijplijn')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => { reset(); setOpen(true) }}
        variant="outline"
        className="flex items-center gap-2"
        style={{ color: '#6B6B6B', borderColor: '#d1d5db' }}
      >
        <Archive size={14} />
        Archiveren
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Kandidaat archiveren</DialogTitle>
          </DialogHeader>

          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{candidateName}</span> verdwijnt uit de pijplijn en wordt opgeslagen in het archief.
          </p>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
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
                    <input
                      type="radio"
                      name="reden"
                      value={r.value}
                      checked={reden === r.value}
                      onChange={() => setReden(r.value)}
                      className="sr-only"
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                      style={{
                        borderColor: r.color,
                        backgroundColor: reden === r.value ? r.color : 'transparent',
                      }}
                    />
                    <span className="text-sm" style={{ color: '#1A1A1A' }}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arch-notitie">Notitie (optioneel)</Label>
              <textarea
                id="arch-notitie"
                value={notitie}
                onChange={(e) => setNotitie(e.target.value)}
                rows={3}
                placeholder="Bijv. 'Startte 1 mei bij TechCorp'"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={loading || !reden}
                style={{ backgroundColor: loading ? '#e5e7eb' : '#1A1A1A', color: '#ffffff' }}
              >
                {loading ? 'Archiveren…' : 'Archiveren'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

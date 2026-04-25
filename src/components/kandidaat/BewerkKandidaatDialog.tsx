'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { STAGES } from '@/types'
import type { CandidateWithRelations } from '@/types'

interface Props {
  candidate: CandidateWithRelations
  companies: { id: string; name: string }[]
  users: { id: string; name: string }[]
}

export function BewerkKandidaatDialog({ candidate, companies, users }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [naam, setNaam] = useState(candidate.name)
  const [functie, setFunctie] = useState(candidate.role)
  const [companyId, setCompanyId] = useState(candidate.companyId ?? '')
  const [ownerId, setOwnerId] = useState(candidate.ownerId)
  const [stage, setStage] = useState(String(candidate.stage))
  const [telefoon, setTelefoon] = useState(candidate.phone ?? '')
  const [email, setEmail] = useState(candidate.email ?? '')
  const [linkedin, setLinkedin] = useState(candidate.linkedinUrl ?? '')
  const [notes, setNotes] = useState(candidate.notes ?? '')

  function resetState() {
    setError('')
    setConfirmDelete(false)
    setNaam(candidate.name)
    setFunctie(candidate.role)
    setCompanyId(candidate.companyId ?? '')
    setOwnerId(candidate.ownerId)
    setStage(String(candidate.stage))
    setTelefoon(candidate.phone ?? '')
    setEmail(candidate.email ?? '')
    setLinkedin(candidate.linkedinUrl ?? '')
    setNotes(candidate.notes ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naam.trim(),
          role: functie.trim(),
          companyId: companyId || null,
          ownerId,
          stage: parseInt(stage),
          phone: telefoon.trim() || null,
          email: email.trim() || null,
          linkedinUrl: linkedin.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Verwijderen mislukt')
      setOpen(false)
      router.push('/pijplijn')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => { resetState(); setOpen(true) }}
        className="flex items-center gap-2"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
      >
        <Pencil size={15} />
        Bewerken
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Kandidaat bewerken</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          {confirmDelete ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#1A1A1A' }}>
                Weet je zeker dat je <strong>{candidate.name}</strong> wilt verwijderen?
                Dit kan niet ongedaan worden.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>
                  Annuleren
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                >
                  {loading ? 'Verwijderen…' : 'Definitief verwijderen'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="b-naam">Naam *</Label>
                <Input id="b-naam" value={naam} onChange={(e) => setNaam(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-functie">Functie *</Label>
                <Input id="b-functie" value={functie} onChange={(e) => setFunctie(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-stage">Stage</Label>
                <select
                  id="b-stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {STAGES.map((s) => (
                    <option key={s.pct} value={String(s.pct)}>
                      {s.pct}% — {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-company">Opdrachtgever</Label>
                <select
                  id="b-company"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="">— Geen —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-owner">Consultant</Label>
                <select
                  id="b-owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-telefoon">Telefoon</Label>
                <Input id="b-telefoon" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-email">E-mail</Label>
                <Input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-linkedin">LinkedIn URL</Label>
                <Input id="b-linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-notes">Notities</Label>
                <textarea
                  id="b-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none"
                  placeholder="Interne notities..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                >
                  <Trash2 size={14} />
                  Verwijderen
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
                  >
                    {loading ? 'Opslaan…' : 'Opslaan'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

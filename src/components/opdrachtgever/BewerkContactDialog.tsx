'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  notes: string | null
  companyId: string
}

interface Props {
  contact: Contact
  onClose: () => void
  onSaved: (contact: Contact) => void
  onDeleted: (id: string) => void
}

export function BewerkContactDialog({ contact, onClose, onSaved, onDeleted }: Props) {
  const [naam, setNaam] = useState(contact.name)
  const [rol, setRol] = useState(contact.role ?? '')
  const [email, setEmail] = useState(contact.email ?? '')
  const [telefoon, setTelefoon] = useState(contact.phone ?? '')
  const [notities, setNotities] = useState(contact.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim()) { setError('Naam is verplicht'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naam.trim(),
          role: rol.trim() || null,
          email: email.trim() || null,
          phone: telefoon.trim() || null,
          notes: notities.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Opslaan mislukt')
      }
      const updated = await res.json()
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verwijderen mislukt')
      }
      onDeleted(contact.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: '#1A1A1A' }}>Contactpersoon bewerken</DialogTitle>
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
              Weet je zeker dat je <strong>{contact.name}</strong> wilt verwijderen?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>
                Annuleren
              </Button>
              <Button onClick={handleDelete} disabled={loading}
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                {loading ? 'Verwijderen…' : 'Verwijderen'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bc-naam">Naam *</Label>
              <Input id="bc-naam" value={naam} onChange={(e) => setNaam(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-rol">Functie/rol</Label>
              <Input id="bc-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="bv. Hiring Manager" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-email">E-mail</Label>
              <Input id="bc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-telefoon">Telefoon</Label>
              <Input id="bc-telefoon" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-notities">Notities</Label>
              <textarea
                id="bc-notities"
                value={notities}
                onChange={(e) => setNotities(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} disabled={loading}
                style={{ color: '#dc2626', borderColor: '#dc2626' }}>
                Verwijderen
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={loading}
                  style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
                  {loading ? 'Opslaan…' : 'Opslaan'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

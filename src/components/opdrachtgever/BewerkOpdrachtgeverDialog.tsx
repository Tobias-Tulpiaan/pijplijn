'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { encodeCompanyName } from '@/lib/companyCode'

interface Company {
  id: string
  name: string
  customCode: string | null
  contactPerson: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export function BewerkOpdrachtgeverDialog({ company }: { company: Company }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [naam, setNaam] = useState(company.name)
  const [customCode, setCustomCode] = useState(company.customCode ?? '')
  const [contactPersoon, setContactPersoon] = useState(company.contactPerson ?? '')
  const [contactEmail, setContactEmail] = useState(company.contactEmail ?? '')
  const [contactTelefoon, setContactTelefoon] = useState(company.contactPhone ?? '')

  function resetState() {
    setError('')
    setConfirmDelete(false)
    setNaam(company.name)
    setCustomCode(company.customCode ?? '')
    setContactPersoon(company.contactPerson ?? '')
    setContactEmail(company.contactEmail ?? '')
    setContactTelefoon(company.contactPhone ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naam.trim(),
          customCode: customCode.trim() || null,
          contactPerson: contactPersoon.trim() || null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactTelefoon.trim() || null,
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
      const res = await fetch(`/api/companies/${company.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verwijderen mislukt')
      }
      setOpen(false)
      router.push('/opdrachtgevers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => { resetState(); setOpen(true) }}
        variant="outline"
        className="flex items-center gap-2"
        style={{ color: '#A68A52', borderColor: '#CBAD74' }}
      >
        <Pencil size={14} />
        Bewerken
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Opdrachtgever bewerken</DialogTitle>
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
                Weet je zeker dat je <strong>{company.name}</strong> wilt verwijderen?
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
                <Label htmlFor="bo-naam">Bedrijfsnaam *</Label>
                <Input id="bo-naam" value={naam} onChange={(e) => setNaam(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bo-code">Code voor pijplijn-weergave (optioneel)</Label>
                <Input
                  id="bo-code"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder={encodeCompanyName(naam) || 'Automatisch berekend'}
                />
                <p className="text-xs" style={{ color: '#6B6B6B' }}>
                  Laat leeg voor automatische code op basis van bedrijfsnaam
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bo-contact">Contactpersoon</Label>
                <Input id="bo-contact" value={contactPersoon} onChange={(e) => setContactPersoon(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bo-email">E-mail contactpersoon</Label>
                <Input id="bo-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bo-tel">Telefoon</Label>
                <Input id="bo-tel" value={contactTelefoon} onChange={(e) => setContactTelefoon(e.target.value)} />
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

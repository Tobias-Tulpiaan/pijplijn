'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { encodeCompanyName } from '@/lib/companyCode'

export function NieuweOpdrachtgeverDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [naam, setNaam] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [contactPersoon, setContactPersoon] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactTelefoon, setContactTelefoon] = useState('')

  function reset() {
    setNaam(''); setCustomCode(''); setContactPersoon(''); setContactEmail(''); setContactTelefoon(''); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
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
        throw new Error(data.error ?? 'Aanmaken mislukt')
      }
      setOpen(false)
      reset()
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
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-semibold"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
      >
        <Plus size={16} />
        Nieuwe opdrachtgever
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuwe opdrachtgever</DialogTitle>
          </DialogHeader>
          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="o-naam">Bedrijfsnaam *</Label>
              <Input id="o-naam" value={naam} onChange={(e) => setNaam(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-code">Code voor pijplijn-weergave (optioneel)</Label>
              <Input
                id="o-code"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder={encodeCompanyName(naam) || 'Automatisch berekend'}
              />
              <p className="text-xs" style={{ color: '#6B6B6B' }}>
                Laat leeg voor automatische code op basis van bedrijfsnaam
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-contact">Contactpersoon</Label>
              <Input id="o-contact" value={contactPersoon} onChange={(e) => setContactPersoon(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-email">E-mail contactpersoon</Label>
              <Input id="o-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-tel">Telefoon</Label>
              <Input id="o-tel" value={contactTelefoon} onChange={(e) => setContactTelefoon(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }} disabled={loading}>
                Annuleren
              </Button>
              <Button type="submit" disabled={loading}
                style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
                {loading ? 'Opslaan…' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Company  { id: string; name: string }
interface User     { id: string; name: string }
interface Contact  { id: string; name: string; role: string | null }
interface Vacature { id: string; title: string; contactId: string | null; consultantId: string }

interface NieuweKandidaatDialogProps {
  companies:     Company[]
  users:         User[]
  currentUserId: string
}

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-[#CBAD74]'

export function NieuweKandidaatDialog({ companies, users, currentUserId }: NieuweKandidaatDialogProps) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const [naam, setNaam]         = useState('')
  const [functie, setFunctie]   = useState('')
  const [companyId, setCompanyId] = useState('')
  const [nieuweOpdrachtgever, setNieuweOpdrachtgever] = useState('')
  const [ownerId, setOwnerId]   = useState(currentUserId)
  const [telefoon, setTelefoon] = useState('')
  const [email, setEmail]       = useState('')
  const [linkedin, setLinkedin] = useState('')

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactId, setContactId] = useState('')

  const [vacatures, setVacatures] = useState<Vacature[]>([])
  const [vacatureId, setVacatureId] = useState('')
  const [nieuweVacatureTitel, setNieuweVacatureTitel] = useState('')

  // Track auto-filled fields so we don't overwrite manual input
  const autoFilledFunctie  = useRef(false)
  const autoFilledContact  = useRef(false)
  const autoFilledConsultant = useRef(false)

  useEffect(() => {
    if (!companyId || companyId === '__new__') {
      setContacts([]); setContactId('')
      setVacatures([]); setVacatureId('')
      return
    }
    Promise.all([
      fetch(`/api/contacts?companyId=${companyId}`).then((r) => r.json()),
      fetch(`/api/vacatures?companyId=${companyId}&status=open`).then((r) => r.json()),
    ])
      .then(([contactData, vacatureData]) => {
        setContacts(contactData)
        setVacatures(vacatureData)
        setContactId('')
        setVacatureId('')
        autoFilledFunctie.current = false
        autoFilledContact.current = false
        autoFilledConsultant.current = false
      })
      .catch(() => {})
  }, [companyId])

  function handleVacatureChange(vid: string) {
    setVacatureId(vid)
    if (!vid || vid === '__new__') return
    const v = vacatures.find((v) => v.id === vid)
    if (!v) return
    // Auto-fill
    if (!autoFilledFunctie.current || !functie.trim()) {
      setFunctie(v.title)
      autoFilledFunctie.current = true
    }
    if (v.contactId && (!autoFilledContact.current || !contactId)) {
      setContactId(v.contactId)
      autoFilledContact.current = true
    }
    if (!autoFilledConsultant.current) {
      setOwnerId(v.consultantId)
      autoFilledConsultant.current = true
    }
  }

  function resetForm() {
    setNaam(''); setFunctie(''); setCompanyId(''); setNieuweOpdrachtgever('')
    setOwnerId(currentUserId); setTelefoon(''); setEmail(''); setLinkedin('')
    setContacts([]); setContactId(''); setVacatures([]); setVacatureId('')
    setNieuweVacatureTitel(''); setError('')
    autoFilledFunctie.current = false
    autoFilledContact.current = false
    autoFilledConsultant.current = false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)

    try {
      let resolvedCompanyId: string | null = null

      if (companyId === '__new__') {
        if (!nieuweOpdrachtgever.trim()) {
          setError('Vul een naam in voor de nieuwe opdrachtgever.')
          setLoading(false); return
        }
        const res = await fetch('/api/companies', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nieuweOpdrachtgever.trim() }),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Opdrachtgever aanmaken mislukt') }
        const company = await res.json()
        resolvedCompanyId = company.id
      } else if (companyId) {
        resolvedCompanyId = companyId
      }

      // Nieuwe vacature aanmaken indien gekozen
      let resolvedVacatureId: string | null = vacatureId || null
      if (vacatureId === '__new__') {
        if (!nieuweVacatureTitel.trim()) {
          setError('Vul een titel in voor de nieuwe vacature.')
          setLoading(false); return
        }
        if (!resolvedCompanyId) {
          setError('Kies eerst een opdrachtgever voor de vacature.')
          setLoading(false); return
        }
        const res = await fetch('/api/vacatures', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: nieuweVacatureTitel.trim(), companyId: resolvedCompanyId, consultantId: ownerId }),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Vacature aanmaken mislukt') }
        const vac = await res.json()
        resolvedVacatureId = vac.id
      }

      const res = await fetch('/api/candidates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naam.trim(), role: functie.trim(),
          companyId: resolvedCompanyId, contactId: contactId || null,
          vacatureId: resolvedVacatureId, ownerId,
          phone: telefoon.trim() || null, email: email.trim() || null,
          linkedinUrl: linkedin.trim() || null,
        }),
      })

      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Aanmaken mislukt') }

      setOpen(false); resetForm(); router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-semibold"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
      >
        <Plus size={16} /> Nieuwe kandidaat
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Nieuwe kandidaat toevoegen</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="naam">Naam *</Label>
              <Input id="naam" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Volledige naam" required />
            </div>

            {/* Opdrachtgever */}
            <div className="space-y-1.5">
              <Label htmlFor="opdrachtgever">Opdrachtgever *</Label>
              <select id="opdrachtgever" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls} required>
                <option value="">— Kies opdrachtgever —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Nieuwe opdrachtgever</option>
              </select>
            </div>

            {companyId === '__new__' && (
              <div className="space-y-1.5">
                <Label>Naam nieuwe opdrachtgever *</Label>
                <Input value={nieuweOpdrachtgever} onChange={(e) => setNieuweOpdrachtgever(e.target.value)} placeholder="Bedrijfsnaam" />
              </div>
            )}

            {/* Vacature */}
            {companyId && companyId !== '__new__' && (
              <div className="space-y-1.5">
                <Label htmlFor="vacature">Vacature *</Label>
                <select id="vacature" value={vacatureId} onChange={(e) => handleVacatureChange(e.target.value)} className={selectCls} required>
                  <option value="">— Kies vacature —</option>
                  {vacatures.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                  <option value="__new__">+ Nieuwe vacature aanmaken</option>
                </select>
              </div>
            )}

            {vacatureId === '__new__' && (
              <div className="space-y-1.5">
                <Label>Titel nieuwe vacature *</Label>
                <Input value={nieuweVacatureTitel} onChange={(e) => setNieuweVacatureTitel(e.target.value)} placeholder="Bijv. Sales Manager" />
              </div>
            )}

            {/* Functie */}
            <div className="space-y-1.5">
              <Label htmlFor="functie">Functie *</Label>
              <Input id="functie" value={functie} onChange={(e) => { setFunctie(e.target.value); autoFilledFunctie.current = false }} placeholder="Bijv. Accountmanager" required />
            </div>

            {/* Contactpersoon */}
            {companyId && companyId !== '__new__' && (
              <div className="space-y-1.5">
                <Label htmlFor="contactpersoon">Contactpersoon</Label>
                <select id="contactpersoon" value={contactId} onChange={(e) => { setContactId(e.target.value); autoFilledContact.current = false }} className={selectCls}>
                  <option value="">— Geen —</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.role ? ` (${c.role})` : ''}</option>)}
                </select>
              </div>
            )}

            {/* Consultant */}
            <div className="space-y-1.5">
              <Label htmlFor="owner">Consultant *</Label>
              <select id="owner" value={ownerId} onChange={(e) => { setOwnerId(e.target.value); autoFilledConsultant.current = false }} className={selectCls} required>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefoon">Telefoon</Label>
              <Input id="telefoon" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} placeholder="+31 6 00000000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kandidaat@email.nl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }} disabled={loading}>
                Annuleren
              </Button>
              <Button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
                {loading ? 'Opslaan…' : 'Kandidaat toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

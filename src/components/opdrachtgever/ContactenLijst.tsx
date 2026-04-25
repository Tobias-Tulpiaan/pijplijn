'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BewerkContactDialog } from './BewerkContactDialog'

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
  companyId: string
  initialContacts: Contact[]
}

export function ContactenLijst({ companyId, initialContacts }: Props) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const [addNaam, setAddNaam] = useState('')
  const [addRol, setAddRol] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addNotities, setAddNotities] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  function resetAdd() {
    setAddNaam(''); setAddRol(''); setAddEmail(''); setAddPhone(''); setAddNotities('')
    setAddError('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addNaam.trim()) { setAddError('Naam is verplicht'); return }
    setAddError('')
    setAddLoading(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addNaam.trim(),
          role: addRol.trim() || null,
          email: addEmail.trim() || null,
          phone: addPhone.trim() || null,
          notes: addNotities.trim() || null,
          companyId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Aanmaken mislukt')
      }
      const contact = await res.json()
      setContacts((prev) => [...prev, contact])
      setShowAdd(false)
      resetAdd()
      router.refresh()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div>
      {contacts.length === 0 && !showAdd && (
        <p className="text-sm mb-3" style={{ color: '#6B6B6B' }}>Nog geen contactpersonen.</p>
      )}

      {contacts.length > 0 && (
        <div className="space-y-1 mb-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="group flex items-start justify-between py-2 px-3 rounded-md hover:bg-gray-50"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{c.name}</span>
                  {c.role && (
                    <span className="text-xs italic" style={{ color: '#6B6B6B' }}>{c.role}</span>
                  )}
                </div>
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#1A1A1A' }}>
                    <Mail size={11} style={{ color: '#CBAD74' }} />{c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#1A1A1A' }}>
                    <Phone size={11} style={{ color: '#CBAD74' }} />{c.phone}
                  </a>
                )}
                {c.notes && (
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{c.notes}</p>
                )}
              </div>
              <button
                onClick={() => setEditingContact(c)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity flex-shrink-0 ml-2"
                title="Bewerken"
              >
                <Pencil size={13} style={{ color: '#6B6B6B' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} className="p-3 rounded-md border space-y-3" style={{ borderColor: '#e5e7eb' }}>
          {addError && (
            <div className="px-3 py-2 rounded text-xs border"
              style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {addError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Naam *</Label>
              <Input value={addNaam} onChange={(e) => setAddNaam(e.target.value)} placeholder="Naam" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Functie/rol</Label>
              <Input value={addRol} onChange={(e) => setAddRol(e.target.value)} placeholder="bv. Hiring Manager" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@..." className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefoon</Label>
              <Input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+31 6 ..." className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notities</Label>
            <textarea
              value={addNotities}
              onChange={(e) => setAddNotities(e.target.value)}
              rows={2}
              placeholder="Optioneel..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-8 text-xs"
              onClick={() => { setShowAdd(false); resetAdd() }} disabled={addLoading}>
              Annuleren
            </Button>
            <Button type="submit" className="h-8 text-xs" disabled={addLoading}
              style={{ backgroundColor: addLoading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
              {addLoading ? 'Toevoegen…' : 'Toevoegen'}
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs hover:underline"
          style={{ color: '#A68A52' }}
        >
          <Plus size={13} />
          Contactpersoon toevoegen
        </button>
      )}

      {editingContact && (
        <BewerkContactDialog
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={(updated) => {
            setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c))
            setEditingContact(null)
            router.refresh()
          }}
          onDeleted={(id) => {
            setContacts((prev) => prev.filter((c) => c.id !== id))
            setEditingContact(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

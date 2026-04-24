'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface NieuweKandidaatDialogProps {
  companies: Company[]
  users: User[]
  currentUserId: string
}

export function NieuweKandidaatDialog({
  companies,
  users,
  currentUserId,
}: NieuweKandidaatDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [naam, setNaam] = useState('')
  const [functie, setFunctie] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [nieuweOpdrachtgever, setNieuweOpdrachtgever] = useState('')
  const [ownerId, setOwnerId] = useState(currentUserId)
  const [telefoon, setTelefoon] = useState('')
  const [email, setEmail] = useState('')
  const [linkedin, setLinkedin] = useState('')

  function resetForm() {
    setNaam('')
    setFunctie('')
    setCompanyId('')
    setNieuweOpdrachtgever('')
    setOwnerId(currentUserId)
    setTelefoon('')
    setEmail('')
    setLinkedin('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let resolvedCompanyId: string | null = null

      if (companyId === '__new__') {
        if (!nieuweOpdrachtgever.trim()) {
          setError('Vul een naam in voor de nieuwe opdrachtgever.')
          setLoading(false)
          return
        }
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nieuweOpdrachtgever.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Opdrachtgever aanmaken mislukt')
        }
        const company = await res.json()
        resolvedCompanyId = company.id
      } else if (companyId) {
        resolvedCompanyId = companyId
      }

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: naam.trim(),
          role: functie.trim(),
          companyId: resolvedCompanyId,
          ownerId,
          phone: telefoon.trim() || null,
          email: email.trim() || null,
          linkedinUrl: linkedin.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Aanmaken mislukt')
      }

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
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
        Nieuwe kandidaat
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) resetForm()
        }}
      >

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#1A1A1A' }}>Nieuwe kandidaat toevoegen</DialogTitle>
        </DialogHeader>

        {error && (
          <div
            className="px-4 py-3 rounded-md text-sm border"
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="naam">Naam *</Label>
            <Input
              id="naam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Volledige naam"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="functie">Functie *</Label>
            <Input
              id="functie"
              value={functie}
              onChange={(e) => setFunctie(e.target.value)}
              placeholder="Bijv. Accountmanager"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opdrachtgever">Opdrachtgever</Label>
            <select
              id="opdrachtgever"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              <option value="">— Geen —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">+ Nieuwe opdrachtgever</option>
            </select>
          </div>

          {companyId === '__new__' && (
            <div className="space-y-1.5">
              <Label htmlFor="nieuweOpdrachtgever">Naam nieuwe opdrachtgever *</Label>
              <Input
                id="nieuweOpdrachtgever"
                value={nieuweOpdrachtgever}
                onChange={(e) => setNieuweOpdrachtgever(e.target.value)}
                placeholder="Bedrijfsnaam"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="owner">Eigenaar *</Label>
            <select
              id="owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              required
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefoon">Telefoon</Label>
            <Input
              id="telefoon"
              value={telefoon}
              onChange={(e) => setTelefoon(e.target.value)}
              placeholder="+31 6 00000000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kandidaat@email.nl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); resetForm() }}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
            >
              {loading ? 'Opslaan…' : 'Kandidaat toevoegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}

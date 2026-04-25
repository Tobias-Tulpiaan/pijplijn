'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { VacatureWithRelations } from '@/types'

interface Contact { id: string; name: string; role: string | null }
interface User    { id: string; name: string }

interface Props {
  vacature:  VacatureWithRelations
  users:     User[]
  companies: { id: string; name: string }[]
}

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-[#CBAD74]'

export function BewerkVacatureDialog({ vacature, users, companies }: Props) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])

  const [title, setTitle]               = useState(vacature.title)
  const [companyId, setCompanyId]       = useState(vacature.companyId)
  const [contactId, setContactId]       = useState(vacature.contactId ?? '')
  const [consultantId, setConsultantId] = useState(vacature.consultantId)
  const [status, setStatus]             = useState(vacature.status)
  const [positions, setPositions]       = useState(String(vacature.positions))
  const [contractType, setContractType] = useState(vacature.contractType ?? '')
  const [hoursPerWeek, setHoursPerWeek] = useState(String(vacature.hoursPerWeek ?? ''))
  const [location, setLocation]         = useState(vacature.location ?? '')
  const [workModel, setWorkModel]       = useState(vacature.workModel ?? '')
  const [salaryMonthMin, setSalaryMonthMin] = useState(String(vacature.salaryMonthMin ?? ''))
  const [salaryMonthMax, setSalaryMonthMax] = useState(String(vacature.salaryMonthMax ?? ''))
  const [salaryYearMin,  setSalaryYearMin]  = useState(String(vacature.salaryYearMin  ?? ''))
  const [salaryYearMax,  setSalaryYearMax]  = useState(String(vacature.salaryYearMax  ?? ''))
  const [bonus, setBonus]               = useState(vacature.bonus ?? '')
  const [leaseAuto, setLeaseAuto]       = useState(vacature.leaseAuto ?? '')
  const [pensionExtras, setPensionExtras] = useState(vacature.pensionExtras ?? '')
  const [feeOpdrachtgever, setFeeOpdrachtgever] = useState(String(vacature.feeOpdrachtgever ?? ''))
  const [description, setDescription]  = useState(vacature.description ?? '')
  const [highlights, setHighlights]    = useState(vacature.highlights ?? '')
  const [notes, setNotes]              = useState(vacature.notes ?? '')
  const [deadline, setDeadline]        = useState(
    vacature.deadline ? new Date(vacature.deadline).toISOString().split('T')[0] : ''
  )

  useEffect(() => {
    if (!companyId) { setContacts([]); return }
    fetch(`/api/contacts?companyId=${companyId}`)
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => setContacts([]))
  }, [companyId])

  function resetState() {
    setError(''); setConfirmDelete(false)
    setTitle(vacature.title); setCompanyId(vacature.companyId); setContactId(vacature.contactId ?? '')
    setConsultantId(vacature.consultantId); setStatus(vacature.status); setPositions(String(vacature.positions))
    setContractType(vacature.contractType ?? ''); setHoursPerWeek(String(vacature.hoursPerWeek ?? ''))
    setLocation(vacature.location ?? ''); setWorkModel(vacature.workModel ?? '')
    setSalaryMonthMin(String(vacature.salaryMonthMin ?? '')); setSalaryMonthMax(String(vacature.salaryMonthMax ?? ''))
    setSalaryYearMin(String(vacature.salaryYearMin ?? '')); setSalaryYearMax(String(vacature.salaryYearMax ?? ''))
    setBonus(vacature.bonus ?? ''); setLeaseAuto(vacature.leaseAuto ?? ''); setPensionExtras(vacature.pensionExtras ?? '')
    setFeeOpdrachtgever(String(vacature.feeOpdrachtgever ?? ''))
    setDescription(vacature.description ?? ''); setHighlights(vacature.highlights ?? '')
    setNotes(vacature.notes ?? '')
    setDeadline(vacature.deadline ? new Date(vacature.deadline).toISOString().split('T')[0] : '')
  }

  const selectCls = `${inputCls} h-9`
  const textareaCls = 'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch(`/api/vacatures/${vacature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, companyId, contactId: contactId || null, consultantId, status, positions,
          contractType, hoursPerWeek, location, workModel,
          salaryMonthMin, salaryMonthMax, salaryYearMin, salaryYearMax,
          bonus, leaseAuto, pensionExtras, feeOpdrachtgever,
          description, highlights, notes, deadline: deadline || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Opslaan mislukt') }
      setOpen(false); router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden')
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/vacatures/${vacature.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Verwijderen mislukt') }
      setOpen(false); router.push('/vacatures')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verwijderen mislukt')
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => { resetState(); setOpen(true) }}
        className="flex items-center gap-2"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
      >
        <Pencil size={15} /> Bewerken
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Vacature bewerken</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          {confirmDelete ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#1A1A1A' }}>
                Weet je zeker dat je <strong>{vacature.title}</strong> wilt verwijderen?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>Annuleren</Button>
                <Button onClick={handleDelete} disabled={loading} style={{ backgroundColor: '#dc2626', color: '#fff' }}>
                  {loading ? 'Verwijderen…' : 'Definitief verwijderen'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basisinfo */}
              <div className="space-y-1.5">
                <Label>Functietitel *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                    <option value="open">Open</option>
                    <option value="on_hold">On hold</option>
                    <option value="vervuld">Vervuld</option>
                    <option value="gesloten">Gesloten</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Posities</Label>
                  <Input type="number" min="1" value={positions} onChange={(e) => setPositions(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Opdrachtgever</Label>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls}>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Contactpersoon</Label>
                <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={selectCls}>
                  <option value="">— Geen —</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.role ? ` (${c.role})` : ''}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Consultant</Label>
                <select value={consultantId} onChange={(e) => setConsultantId(e.target.value)} className={selectCls}>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {/* Contract */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Contracttype</Label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={selectCls}>
                    <option value="">— Geen —</option>
                    <option value="vast">Vast</option>
                    <option value="tijdelijk">Tijdelijk</option>
                    <option value="zzp">ZZP</option>
                    <option value="detachering">Detachering</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Uren/week</Label>
                  <Input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Locatie</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Werkmodel</Label>
                  <select value={workModel} onChange={(e) => setWorkModel(e.target.value)} className={selectCls}>
                    <option value="">— Geen —</option>
                    <option value="kantoor">Op kantoor</option>
                    <option value="hybride">Hybride</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              {/* Salaris */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Salaris/mnd min (€)</Label>
                  <Input type="number" value={salaryMonthMin} onChange={(e) => setSalaryMonthMin(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Salaris/mnd max (€)</Label>
                  <Input type="number" value={salaryMonthMax} onChange={(e) => setSalaryMonthMax(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Salaris/jaar min (€)</Label>
                  <Input type="number" value={salaryYearMin} onChange={(e) => setSalaryYearMin(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Salaris/jaar max (€)</Label>
                  <Input type="number" value={salaryYearMax} onChange={(e) => setSalaryYearMax(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bonus</Label>
                <textarea value={bonus} onChange={(e) => setBonus(e.target.value)} rows={2} className={textareaCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Lease-auto</Label>
                  <select value={leaseAuto} onChange={(e) => setLeaseAuto(e.target.value)} className={selectCls}>
                    <option value="">— Geen —</option>
                    <option value="geen">Geen</option>
                    <option value="optioneel">Optioneel</option>
                    <option value="ja">Ja</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tarief opdrachtgever (€)</Label>
                  <Input type="number" value={feeOpdrachtgever} onChange={(e) => setFeeOpdrachtgever(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Pensioen / extras</Label>
                <textarea value={pensionExtras} onChange={(e) => setPensionExtras(e.target.value)} rows={2} className={textareaCls} />
              </div>

              {/* Recruitment */}
              <div className="space-y-1.5">
                <Label>Functiebeschrijving</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={textareaCls} />
              </div>
              <div className="space-y-1.5">
                <Label>Highlights / USP's</Label>
                <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2} className={textareaCls} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Interne notities</Label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={textareaCls} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} disabled={loading}
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}>
                  <Trash2 size={14} /> Verwijderen
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuleren</Button>
                  <Button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}>
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

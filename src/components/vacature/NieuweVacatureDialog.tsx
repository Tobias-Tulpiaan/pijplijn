'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Company  { id: string; name: string }
interface Contact  { id: string; name: string; role: string | null }
interface User     { id: string; name: string }

interface Props {
  companies:       Company[]
  users:           User[]
  currentUserId:   string
  defaultCompanyId?: string
  onCreated?:      (vacature: { id: string; title: string }) => void
}

const STEPS = ['Basisinfo', 'Contract', 'Salaris', 'Recruitment'] as const

const inputCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-[#CBAD74]'

export function NieuweVacatureDialog({ companies, users, currentUserId, defaultCompanyId, onCreated }: Props) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [step, setStep]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])

  // Stap 1
  const [title, setTitle]           = useState('')
  const [companyId, setCompanyId]   = useState(defaultCompanyId ?? '')
  const [contactId, setContactId]   = useState('')
  const [consultantId, setConsultantId] = useState(currentUserId)
  const [positions, setPositions]   = useState('1')

  // Stap 2
  const [contractType, setContractType] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('40')
  const [location, setLocation]     = useState('')
  const [workModel, setWorkModel]   = useState('')

  // Stap 3
  const [salaryMonthMin, setSalaryMonthMin] = useState('')
  const [salaryMonthMax, setSalaryMonthMax] = useState('')
  const [salaryYearMin,  setSalaryYearMin]  = useState('')
  const [salaryYearMax,  setSalaryYearMax]  = useState('')
  const [bonus, setBonus]           = useState('')
  const [leaseAuto, setLeaseAuto]   = useState('')
  const [pensionExtras, setPensionExtras] = useState('')

  // Stap 4
  const [feeOpdrachtgever, setFeeOpdrachtgever] = useState('')
  const [description, setDescription] = useState('')
  const [highlights, setHighlights]   = useState('')
  const [deadline, setDeadline]       = useState('')
  const [notes, setNotes]             = useState('')
  const [werkenbijUrl, setWerkenbijUrl] = useState('')
  const [vacatureTekst, setVacatureTekst] = useState('')

  async function loadContacts(cId: string) {
    if (!cId) { setContacts([]); setContactId(''); return }
    try {
      const r = await fetch(`/api/contacts?companyId=${cId}`)
      const data = await r.json()
      setContacts(data)
      setContactId('')
    } catch { setContacts([]) }
  }

  // Load contacts when dialog opens with a preset company
  useEffect(() => {
    if (open && defaultCompanyId) loadContacts(defaultCompanyId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleCompanyChange(cId: string) {
    setCompanyId(cId)
    loadContacts(cId)
  }

  function reset() {
    setStep(0); setError('')
    setTitle(''); setCompanyId(defaultCompanyId ?? ''); setContactId('')
    setConsultantId(currentUserId); setPositions('1')
    setContractType(''); setHoursPerWeek('40'); setLocation(''); setWorkModel('')
    setSalaryMonthMin(''); setSalaryMonthMax(''); setSalaryYearMin(''); setSalaryYearMax('')
    setBonus(''); setLeaseAuto(''); setPensionExtras('')
    setFeeOpdrachtgever(''); setDescription(''); setHighlights(''); setDeadline(''); setNotes('')
    setWerkenbijUrl(''); setVacatureTekst('')
  }

  function canAdvance() {
    if (step === 0) return !!(title.trim() && companyId && consultantId)
    return true
  }

  async function handleSubmit() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/vacatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, companyId, contactId: contactId || null, consultantId,
          positions, contractType, hoursPerWeek, location, workModel,
          salaryMonthMin, salaryMonthMax, salaryYearMin, salaryYearMax,
          bonus, leaseAuto, pensionExtras, feeOpdrachtgever,
          description, highlights, notes, deadline: deadline || null,
          werkenbijUrl: werkenbijUrl.trim() || null,
          vacatureTekst: vacatureTekst.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Aanmaken mislukt')
      }
      const vacature = await res.json()

      // Auto-trigger content generatie als bron aanwezig is
      const hasBron = !!(vacatureTekst.trim() || werkenbijUrl.trim())
      if (hasBron) {
        fetch(`/api/vacatures/${vacature.id}/generate-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope: 'all' }),
        }).catch(() => {})
      }

      setOpen(false); reset()
      if (onCreated) onCreated({ id: vacature.id, title: vacature.title })
      else router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  const selectCls = `${inputCls} h-9`

  return (
    <>
      <Button
        onClick={() => { reset(); setOpen(true) }}
        className="flex items-center gap-2 font-semibold"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A68A52')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CBAD74')}
      >
        <Plus size={16} />
        Nieuwe vacature
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#1A1A1A' }}>Nieuwe vacature</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: i <= step ? '#CBAD74' : '#e5e7eb',
                    color: i <= step ? '#1A1A1A' : '#9ca3af',
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i === step ? '#A68A52' : '#9ca3af' }}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ backgroundColor: '#e5e7eb' }} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-md text-sm border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Stap 1: Basisinfo */}
            {step === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label>Functietitel *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Sales Manager" />
                </div>
                <div className="space-y-1.5">
                  <Label>Opdrachtgever *</Label>
                  <select value={companyId} onChange={(e) => handleCompanyChange(e.target.value)} className={selectCls}>
                    <option value="">— Kies opdrachtgever —</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {companyId && (
                  <div className="space-y-1.5">
                    <Label>Contactpersoon</Label>
                    <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={selectCls}>
                      <option value="">— Geen —</option>
                      {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.role ? ` (${c.role})` : ''}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Consultant *</Label>
                  <select value={consultantId} onChange={(e) => setConsultantId(e.target.value)} className={selectCls}>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Aantal posities</Label>
                  <Input type="number" min="1" value={positions} onChange={(e) => setPositions(e.target.value)} />
                </div>
              </>
            )}

            {/* Stap 2: Contract */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label>Contracttype</Label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={selectCls}>
                    <option value="">— Kies type —</option>
                    <option value="vast">Vast</option>
                    <option value="tijdelijk">Tijdelijk</option>
                    <option value="zzp">ZZP</option>
                    <option value="detachering">Detachering</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Uren per week</Label>
                  <Input type="number" min="1" max="80" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Locatie</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bijv. Amsterdam" />
                </div>
                <div className="space-y-1.5">
                  <Label>Werkmodel</Label>
                  <select value={workModel} onChange={(e) => setWorkModel(e.target.value)} className={selectCls}>
                    <option value="">— Kies werkmodel —</option>
                    <option value="kantoor">Op kantoor</option>
                    <option value="hybride">Hybride</option>
                    <option value="remote">Volledig remote</option>
                  </select>
                </div>
              </>
            )}

            {/* Stap 3: Salaris */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salaris/mnd min (€)</Label>
                    <Input type="number" value={salaryMonthMin} onChange={(e) => setSalaryMonthMin(e.target.value)} placeholder="4000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salaris/mnd max (€)</Label>
                    <Input type="number" value={salaryMonthMax} onChange={(e) => setSalaryMonthMax(e.target.value)} placeholder="5000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salaris/jaar min (€)</Label>
                    <Input type="number" value={salaryYearMin} onChange={(e) => setSalaryYearMin(e.target.value)} placeholder="51840" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salaris/jaar max (€)</Label>
                    <Input type="number" value={salaryYearMax} onChange={(e) => setSalaryYearMax(e.target.value)} placeholder="64800" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bonus</Label>
                  <textarea value={bonus} onChange={(e) => setBonus(e.target.value)} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Bijv. 10% bij targets" />
                </div>
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
                  <Label>Pensioen / extras</Label>
                  <textarea value={pensionExtras} onChange={(e) => setPensionExtras(e.target.value)} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Bijv. 5% werkgeverspensioenbijdrage" />
                </div>
              </>
            )}

            {/* Stap 4: Recruitment */}
            {step === 3 && (
              <>
                <div className="space-y-1.5">
                  <Label>Werkenbij URL</Label>
                  <Input type="url" value={werkenbijUrl} onChange={(e) => setWerkenbijUrl(e.target.value)} placeholder="https://werkenbij.bedrijf.nl/..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Vacaturetekst (vult URL aan of vervangt deze)</Label>
                  <textarea value={vacatureTekst} onChange={(e) => setVacatureTekst(e.target.value)} rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Plak hier de volledige vacaturetekst..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Tarief opdrachtgever (€)</Label>
                  <Input type="number" value={feeOpdrachtgever} onChange={(e) => setFeeOpdrachtgever(e.target.value)} placeholder="Bijv. 5000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Functiebeschrijving</Label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Beschrijving van de rol..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Highlights / USP's</Label>
                  <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Bijv. groeiend bedrijf, internationale omgeving..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline</Label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Interne notities</Label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none outline-none focus:border-[#CBAD74]"
                    placeholder="Interne info voor consultants..." />
                </div>
              </>
            )}
          </div>

          {/* Navigatie-knoppen */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => step > 0 ? setStep(step - 1) : setOpen(false)} disabled={loading}>
              {step > 0 ? <><ChevronLeft size={14} /> Terug</> : 'Annuleren'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                style={{ backgroundColor: canAdvance() ? '#CBAD74' : '#e5e7eb', color: '#1A1A1A' }}
              >
                Volgende <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canAdvance()}
                style={{ backgroundColor: loading ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
              >
                {loading ? 'Opslaan…' : 'Vacature aanmaken'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Clock } from 'lucide-react'

type KoppelingType = 'persoonlijk' | 'kandidaat' | 'opdrachtgever' | 'gedeeld'

interface Props {
  candidates:      { id: string; name: string; company: { name: string } | null }[]
  companies:       { id: string; name: string }[]
  users:           { id: string; name: string }[]
  currentUserId:   string
  defaultCompanyId?: string
}

export function NieuweTaakDialog({ candidates, companies, users, currentUserId, defaultCompanyId }: Props) {
  const router    = useRouter()
  const [open, setOpen] = useState(false)

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [koppeling,   setKoppeling]   = useState<KoppelingType>('persoonlijk')
  const [candidateId, setCandidateId] = useState('')
  const [companyId,   setCompanyId]   = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [showTime,    setShowTime]    = useState(false)
  const [dueTime,     setDueTime]     = useState('')
  const [assignedTo,  setAssignedTo]  = useState(currentUserId)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  function openDialog() {
    setTitle(''); setDescription(''); setDueDate('')
    setShowTime(false); setDueTime(''); setError('')
    setAssignedTo(currentUserId)
    setCandidateId('')
    if (defaultCompanyId) {
      setKoppeling('opdrachtgever')
      setCompanyId(defaultCompanyId)
    } else {
      setKoppeling('persoonlijk')
      setCompanyId('')
    }
    setOpen(true)
  }

  function closeDialog() { setOpen(false) }

  function handleKoppelingChange(val: KoppelingType) {
    setKoppeling(val)
    setCandidateId('')
    setCompanyId('')
  }

  async function handleSave() {
    if (!title.trim()) { setError('Titel is verplicht'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title.trim(),
          description: description.trim() || null,
          candidateId: koppeling === 'kandidaat'     ? (candidateId || null) : null,
          companyId:   koppeling === 'opdrachtgever' ? (companyId   || null) : null,
          dueDate:     dueDate || null,
          dueTime:     showTime ? (dueTime.trim() || null) : null,
          isShared:    koppeling === 'gedeeld',
          assignedToId: koppeling === 'gedeeld' ? null : assignedTo,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Aanmaken mislukt')
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aanmaken mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1.5 px-3 h-9 text-sm rounded-md font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
      >
        <Plus size={15} />
        Nieuwe taak
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDialog() }}
        >
          <div
            className="w-full max-w-md rounded-xl shadow-xl p-6"
            style={{ backgroundColor: '#fff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Nieuwe taak</h2>
              <button onClick={closeDialog} className="p-1 rounded hover:bg-gray-100" style={{ color: '#6B6B6B' }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 rounded text-xs border" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Titel *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                  placeholder="Taakomschrijving..."
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Soort taak</label>
                <select
                  value={koppeling}
                  onChange={(e) => handleKoppelingChange(e.target.value as KoppelingType)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                  disabled={saving || !!defaultCompanyId}
                >
                  <option value="persoonlijk">Persoonlijk (zonder koppeling)</option>
                  <option value="kandidaat">Bij kandidaat</option>
                  <option value="opdrachtgever">Bij opdrachtgever</option>
                  <option value="gedeeld">Gedeeld met team</option>
                </select>
              </div>

              {koppeling === 'kandidaat' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Kandidaat</label>
                  <select
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  >
                    <option value="">— Selecteer kandidaat —</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.company ? ` · ${c.company.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {koppeling === 'opdrachtgever' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Opdrachtgever</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving || !!defaultCompanyId}
                  >
                    <option value="">— Selecteer opdrachtgever —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Omschrijving</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] resize-none"
                  rows={2}
                  placeholder="Optionele toelichting..."
                  disabled={saving}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Vervaldatum</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Tijd</label>
                  {showTime ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                        disabled={saving}
                      />
                      <button type="button" onClick={() => { setShowTime(false); setDueTime('') }}
                        className="p-2 rounded hover:bg-gray-100" style={{ color: '#9ca3af' }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowTime(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-dashed border-gray-200 hover:border-[#CBAD74] w-full"
                      style={{ color: '#9ca3af' }}>
                      <Clock size={13} />
                      Tijd toevoegen
                    </button>
                  )}
                </div>
              </div>

              {koppeling !== 'gedeeld' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6B6B' }}>Toegewezen aan</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74]"
                    disabled={saving}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
              >
                {saving ? 'Opslaan...' : 'Taak aanmaken'}
              </button>
              <button
                onClick={closeDialog}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
                style={{ color: '#6B6B6B' }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { STAGES } from '@/types'

interface Props {
  candidateId:   string
  candidateName: string
  currentStage:  number
  open:          boolean
  onClose:       () => void
}

export function VerplaatsStageSheet({ candidateId, candidateName, currentStage, open, onClose }: Props) {
  const router = useRouter()
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [note,          setNote]          = useState('')
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedStage(null)
      setNote('')
    }
  }, [open])

  if (!open) return null

  async function handleVerplaats() {
    if (selectedStage === null) return
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage: selectedStage, note: note.trim() || null }),
      })
      if (!res.ok) throw new Error('Mislukt')
      router.refresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-5 pb-8"
        style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: '#1A1A1A' }}>
            Verplaats <span style={{ color: '#A68A52' }}>{candidateName}</span>
          </h3>
          <button onClick={onClose} className="p-1">
            <X size={20} style={{ color: '#6B6B6B' }} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          {STAGES.map((s) => {
            const isCurrent  = s.pct === currentStage
            const isSelected = s.pct === selectedStage
            return (
              <button
                key={s.pct}
                disabled={isCurrent}
                onClick={() => setSelectedStage(s.pct)}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-left transition-colors"
                style={{
                  backgroundColor: isSelected ? 'rgba(203,173,116,0.15)' : isCurrent ? '#f9fafb' : '#f3f4f6',
                  color:            isCurrent ? '#9ca3af' : '#1A1A1A',
                  border:           isSelected ? '1.5px solid #CBAD74' : '1.5px solid transparent',
                }}
              >
                <span>{s.pct}% — {s.label}</span>
                {isCurrent && (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>(huidig)</span>
                )}
              </button>
            )
          })}
        </div>

        {selectedStage !== null && (
          <>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#1A1A1A' }}>
              Notitie (optioneel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Bijv. 'Gesprek ging goed, interesse van beide kanten'"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] resize-none mb-3"
            />
            <button
              onClick={handleVerplaats}
              disabled={saving}
              className="w-full py-2.5 text-sm font-medium rounded-lg"
              style={{ backgroundColor: saving ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
            >
              {saving ? 'Verplaatsen…' : `Verplaats naar ${selectedStage}%`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

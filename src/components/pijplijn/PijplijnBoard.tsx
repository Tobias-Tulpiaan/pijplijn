'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { STAGES, type CandidateWithRelations } from '@/types'
import { KandidaatKaart } from './KandidaatKaart'

// DndContext rendered exclusively on the client to avoid SSR hydration mismatch
// (dnd-kit generates auto-incrementing aria IDs that differ between server and client)
const PijplijnBoardDnd = dynamic(
  () => import('./PijplijnBoardDnd'),
  {
    ssr: false,
    loading: () => (
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <div
            key={s.pct}
            className="min-w-[280px] rounded-lg animate-pulse"
            style={{ height: 140, backgroundColor: 'rgba(203,173,116,0.08)' }}
          />
        ))}
      </div>
    ),
  }
)

interface PendingMove {
  candidateId:   string
  newStage:      number
  candidateName: string
  fromStage:     number
}

interface PijplijnBoardProps {
  initialCandidates: CandidateWithRelations[]
  users:             { id: string; name: string }[]
}

export function PijplijnBoard({ initialCandidates }: PijplijnBoardProps) {
  const [candidates,       setCandidates]       = useState(initialCandidates)
  const [activeCandidate,  setActiveCandidate]  = useState<CandidateWithRelations | null>(null)
  const [error,            setError]            = useState('')
  const [pendingMove,      setPendingMove]      = useState<PendingMove | null>(null)
  const [note,             setNote]             = useState('')
  const [saving,           setSaving]           = useState(false)
  const [mobileStageIdx,   setMobileStageIdx]   = useState(0)
  const router = useRouter()

  function handleDragStart(event: DragStartEvent) {
    const c = candidates.find((c) => c.id === event.active.id)
    setActiveCandidate(c ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCandidate(null)
    if (!over) return
    const candidateId = active.id as string
    const newStage    = over.id  as number
    const candidate   = candidates.find((c) => c.id === candidateId)
    if (!candidate || candidate.stage === newStage) return
    setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, stage: newStage } : c))
    setPendingMove({ candidateId, newStage, candidateName: candidate.name, fromStage: candidate.stage })
    setNote('')
  }

  async function commitMove(withNote: string | null) {
    if (!pendingMove) return
    setSaving(true)
    const previousCandidates = candidates.map((c) =>
      c.id === pendingMove.candidateId ? { ...c, stage: pendingMove.fromStage } : c
    )
    try {
      const res = await fetch(`/api/candidates/${pendingMove.candidateId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage: pendingMove.newStage, note: withNote }),
      })
      if (!res.ok) throw new Error('Update mislukt')
      router.refresh()
    } catch {
      setCandidates(previousCandidates)
      setError('Stage-wijziging mislukt. Probeer opnieuw.')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
      setPendingMove(null)
      setNote('')
    }
  }

  const mobileStage = STAGES[mobileStageIdx]

  return (
    <div>
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm font-medium border"
          style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
        >
          {error}
        </div>
      )}

      {/* Desktop kanban — DnD loaded client-only (no SSR) */}
      <PijplijnBoardDnd
        candidates={candidates}
        activeCandidate={activeCandidate}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* Mobile single-column view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMobileStageIdx((i) => Math.max(0, i - 1))}
            disabled={mobileStageIdx === 0}
            className="p-2 rounded-md border border-gray-200 disabled:opacity-30 transition-colors hover:bg-gray-50"
          >
            <ChevronLeft size={18} style={{ color: '#6B6B6B' }} />
          </button>
          <div className="text-center">
            <span className="text-2xl font-bold block" style={{ color: '#A68A52' }}>{mobileStage.pct}%</span>
            <span className="text-xs" style={{ color: '#6B6B6B' }}>{mobileStage.label}</span>
          </div>
          <button
            onClick={() => setMobileStageIdx((i) => Math.min(STAGES.length - 1, i + 1))}
            disabled={mobileStageIdx === STAGES.length - 1}
            className="p-2 rounded-md border border-gray-200 disabled:opacity-30 transition-colors hover:bg-gray-50"
          >
            <ChevronRight size={18} style={{ color: '#6B6B6B' }} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {STAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setMobileStageIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === mobileStageIdx ? 20 : 6,
                height: 6,
                backgroundColor: i === mobileStageIdx ? '#CBAD74' : '#d1d5db',
              }}
            />
          ))}
        </div>
        <div
          className="rounded-lg p-3 flex flex-col gap-2 min-h-[200px]"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
        >
          {candidates.filter((c) => c.stage === mobileStage.pct).map((c) => (
            <KandidaatKaart key={c.id} candidate={c} />
          ))}
          {candidates.filter((c) => c.stage === mobileStage.pct).length === 0 && (
            <div className="flex-1 flex items-center justify-center py-8 text-sm" style={{ color: '#9ca3af' }}>
              Geen kandidaten in deze fase
            </div>
          )}
        </div>
      </div>

      {/* Notitie-dialog */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div
            className="rounded-xl p-6 shadow-xl w-full max-w-sm mx-4"
            style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>Stage gewijzigd</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
              <span style={{ color: '#A68A52' }}>{pendingMove.candidateName}</span> → {pendingMove.newStage}%
            </p>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#1A1A1A' }}>
              Notitie (optioneel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Bijv. 'Gesprek ging goed, interesse van beide kanten'"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 outline-none focus:border-[#CBAD74] resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => commitMove(null)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
                style={{ color: '#6B6B6B' }}
              >
                Sla op zonder notitie
              </button>
              <button
                onClick={() => commitMove(note.trim() || null)}
                disabled={saving || !note.trim()}
                className="px-4 py-2 text-sm rounded-md font-medium"
                style={{ backgroundColor: saving || !note.trim() ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
              >
                {saving ? 'Opslaan…' : 'Sla op met notitie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

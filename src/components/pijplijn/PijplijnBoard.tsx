'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { STAGES, type CandidateWithRelations, type StageDefinition } from '@/types'
import { KandidaatKaart } from './KandidaatKaart'

interface PijplijnKolomProps {
  stage: StageDefinition
  candidates: CandidateWithRelations[]
}

function PijplijnKolom({ stage, candidates }: PijplijnKolomProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.pct })

  return (
    <div
      ref={setNodeRef}
      className="min-w-[280px] rounded-lg shadow-sm flex flex-col transition-all"
      style={{
        backgroundColor: isOver ? 'rgba(203,173,116,0.08)' : '#ffffff',
        outline: isOver ? '2px solid #CBAD74' : '2px solid transparent',
        outlineOffset: '2px',
      }}
    >
      <div
        className="px-4 py-3 rounded-t-lg flex items-center justify-between"
        style={{
          backgroundColor: 'rgba(203,173,116,0.15)',
          borderLeft: '4px solid #CBAD74',
        }}
      >
        <div>
          <span className="text-2xl font-bold leading-none block" style={{ color: '#A68A52' }}>
            {stage.pct}%
          </span>
          <span className="text-xs mt-0.5 block leading-tight" style={{ color: '#1A1A1A', maxWidth: '160px' }}>
            {stage.label}
          </span>
        </div>
        <span
          className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: candidates.length > 0 ? '#CBAD74' : '#e5e7eb',
            color: candidates.length > 0 ? '#1A1A1A' : '#6B6B6B',
          }}
        >
          {candidates.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1 min-h-[80px]">
        {candidates.map((candidate) => (
          <KandidaatKaart key={candidate.id} candidate={candidate} />
        ))}
        {candidates.length === 0 && (
          <div
            className="flex-1 rounded border-2 border-dashed flex items-center justify-center py-4 text-xs"
            style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}
          >
            Sleep hier naartoe
          </div>
        )}
      </div>
    </div>
  )
}

interface PendingMove {
  candidateId: string
  newStage: number
  candidateName: string
  fromStage: number
}

interface PijplijnBoardProps {
  initialCandidates: CandidateWithRelations[]
  users: { id: string; name: string }[]
}

export function PijplijnBoard({ initialCandidates }: PijplijnBoardProps) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [activeCandidate, setActiveCandidate] = useState<CandidateWithRelations | null>(null)
  const [error, setError] = useState('')
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const candidate = candidates.find((c) => c.id === event.active.id)
    setActiveCandidate(candidate ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCandidate(null)

    if (!over) return
    const candidateId = active.id as string
    const newStage = over.id as number
    const candidate = candidates.find((c) => c.id === candidateId)
    if (!candidate || candidate.stage === newStage) return

    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    )

    // Open note dialog
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: pendingMove.newStage, note: withNote }),
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <PijplijnKolom
              key={stage.pct}
              stage={stage}
              candidates={candidates.filter((c) => c.stage === stage.pct)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCandidate && (
            <div className="rotate-1 scale-105">
              <KandidaatKaart candidate={activeCandidate} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Notitie-dialog */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div
            className="rounded-xl p-6 shadow-xl w-full max-w-sm"
            style={{ backgroundColor: '#ffffff', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>
              Stage gewijzigd
            </h3>
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
                style={{
                  backgroundColor: saving || !note.trim() ? '#e5e7eb' : '#CBAD74',
                  color: '#1A1A1A',
                }}
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

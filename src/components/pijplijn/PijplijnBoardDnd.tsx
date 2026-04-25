'use client'

import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { STAGES, type CandidateWithRelations, type StageDefinition } from '@/types'
import { KandidaatKaart } from './KandidaatKaart'

interface PijplijnKolomProps {
  stage:      StageDefinition
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
        style={{ backgroundColor: 'rgba(203,173,116,0.15)', borderLeft: '4px solid #CBAD74' }}
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
        {candidates.map((c) => <KandidaatKaart key={c.id} candidate={c} />)}
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

interface Props {
  candidates:      CandidateWithRelations[]
  activeCandidate: CandidateWithRelations | null
  onDragStart:     (event: DragStartEvent) => void
  onDragEnd:       (event: DragEndEvent)   => void
}

export default function PijplijnBoardDnd({ candidates, activeCandidate, onDragStart, onDragEnd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
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
  )
}

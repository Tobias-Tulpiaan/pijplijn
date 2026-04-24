'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { CandidateWithRelations } from '@/types'

function initialen(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface KandidaatKaartProps {
  candidate: CandidateWithRelations
  overlay?: boolean
}

export function KandidaatKaart({ candidate, overlay = false }: KandidaatKaartProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
    disabled: overlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging && !overlay ? 0.4 : 1,
  }

  const lastContact = candidate.lastContact
    ? formatDistanceToNow(new Date(candidate.lastContact), { addSuffix: true, locale: nl })
    : candidate.createdAt
    ? formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true, locale: nl })
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <Link
        href={`/kandidaat/${candidate.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="block bg-white rounded-md shadow-sm p-3 border border-gray-100 cursor-pointer
          transition-all duration-150 hover:scale-[1.02] hover:shadow-md"
        style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
      >
        {/* Naam */}
        <p className="font-semibold text-sm leading-tight mb-0.5" style={{ color: '#1A1A1A' }}>
          {candidate.name}
        </p>

        {/* Functie */}
        <p className="text-xs mb-1" style={{ color: '#6B6B6B' }}>
          {candidate.role}
        </p>

        {/* Opdrachtgever */}
        {candidate.company && (
          <p className="text-xs font-medium mb-2" style={{ color: '#A68A52' }}>
            {candidate.company.name}
          </p>
        )}

        {/* Footer: owner + tijd */}
        <div className="flex items-center justify-between mt-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
            title={candidate.owner.name}
          >
            {initialen(candidate.owner.name)}
          </div>
          {lastContact && (
            <span className="text-xs" style={{ color: '#6B6B6B' }}>
              {lastContact}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { RotateCcw } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface Version {
  id: string
  version: number
  isActive: boolean
  scope: string
  inputSource: string
  createdAt: string
  createdByUser: { name: string } | null
}

interface Props {
  vacatureId: string
  versions: Version[]
  onRestored: () => void
}

export function VersieHistorieSection({ vacatureId, versions, onRestored }: Props) {
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function restore(versionId: string) {
    setRestoringId(versionId)
    try {
      const res = await fetch(`/api/vacatures/${vacatureId}/content/${versionId}/restore`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Herstel mislukt')
      onRestored()
    } catch (e) {
      console.error(e)
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <CollapsibleSection title={`Versie-historie (${versions.length})`} icon="🕓" defaultOpen={false}>
      {versions.length === 0 ? (
        <p className="text-sm" style={{ color: '#9ca3af' }}>Nog geen versies beschikbaar</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="font-medium" style={{ color: '#1A1A1A' }}>v{v.version}</span>
                {v.isActive && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#CBAD74', color: '#fff' }}
                  >
                    actief
                  </span>
                )}
                <span style={{ color: '#6B6B6B' }} className="truncate">
                  {format(new Date(v.createdAt), 'd MMM HH:mm', { locale: nl })}
                  {v.createdByUser && ` · ${v.createdByUser.name}`}
                  {' · '}
                  {v.scope === 'all' ? 'alles' : v.scope}
                </span>
              </div>
              {!v.isActive && (
                <button
                  onClick={() => restore(v.id)}
                  disabled={restoringId === v.id}
                  title="Herstel deze versie"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs border ml-2 shrink-0 transition-colors"
                  style={{ borderColor: '#e5e0d2', color: '#6B6B6B', backgroundColor: '#F8F5EE' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBAD74'; e.currentTarget.style.color = '#A68A52' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e0d2'; e.currentTarget.style.color = '#6B6B6B' }}
                >
                  <RotateCcw size={11} className={restoringId === v.id ? 'animate-spin' : ''} />
                  Herstel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}

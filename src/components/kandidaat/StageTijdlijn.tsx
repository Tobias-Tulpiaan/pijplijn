'use client'

import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { STAGE_LABEL } from '@/types'

interface StageEntry {
  id: string
  fromStage: number
  toStage: number
  changedAt: Date | string
  changedBy: { name: string }
  note?: string | null
}

export function StageTijdlijn({ entries }: { entries: StageEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm" style={{ color: '#6B6B6B' }}>Nog geen stage-wijzigingen</p>
  }

  return (
    <div className="relative">
      <div
        className="absolute left-3 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: 'rgba(203,173,116,0.3)' }}
      />
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-4 pl-8">
            <div
              className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-white"
              style={{ backgroundColor: i === 0 ? '#CBAD74' : '#e5e7eb', color: i === 0 ? '#1A1A1A' : '#6B6B6B' }}
            >
              {entry.toStage}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                    {STAGE_LABEL(entry.toStage)}
                  </p>
                  {entry.fromStage > 0 && (
                    <p className="text-xs" style={{ color: '#6B6B6B' }}>
                      Van {entry.fromStage}% → {entry.toStage}%
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>
                    {format(new Date(entry.changedAt), 'd MMM yyyy', { locale: nl })}
                  </p>
                  <p className="text-xs" style={{ color: '#A68A52' }}>
                    {entry.changedBy.name}
                  </p>
                </div>
              </div>
              {entry.note && (
                <p className="mt-1 text-xs italic" style={{ color: '#6B6B6B' }}>{entry.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

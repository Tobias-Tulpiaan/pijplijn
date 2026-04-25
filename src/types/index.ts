import { Prisma } from '@prisma/client'

export type CandidateWithRelations = Prisma.CandidateGetPayload<{
  include: {
    owner: true
    company: true
    contact: true
    tasks: true
    stageHistory: {
      include: { changedBy: true }
      orderBy: { changedAt: 'desc' }
      take: 1
    }
  }
}>

export type VacatureWithRelations = Prisma.VacatureGetPayload<{
  include: {
    company: true
    contact: true
    consultant: true
    _count: { select: { candidates: true } }
  }
}>

export type StageDefinition = { pct: number; label: string }

export const STAGES: StageDefinition[] = [
  { pct: 10, label: 'Positieve reactie kandidaat' },
  { pct: 20, label: 'Wachten op GO/CV' },
  { pct: 30, label: 'Kandidaat voorgesteld aan opdrachtgever' },
  { pct: 40, label: '1e gesprek gepland' },
  { pct: 50, label: 'Vervolggesprek' },
  { pct: 60, label: 'Aanbod gekregen' },
  { pct: 70, label: 'Contract getekend' },
  { pct: 80, label: 'Gefactureerd' },
  { pct: 90, label: 'Presentje regelen' },
  { pct: 100, label: 'Wachten op startdatum/betaling' },
]

export function STAGE_LABEL(pct: number): string {
  return STAGES.find((s) => s.pct === pct)?.label ?? `${pct}%`
}

export const VACATURE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:     { label: 'Open',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)'  },
  on_hold:  { label: 'On hold',  color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  vervuld:  { label: 'Vervuld',  color: '#A68A52', bg: 'rgba(203,173,116,0.15)' },
  gesloten: { label: 'Gesloten', color: '#6B6B6B', bg: 'rgba(107,107,107,0.1)' },
}

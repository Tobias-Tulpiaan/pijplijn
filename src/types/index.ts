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

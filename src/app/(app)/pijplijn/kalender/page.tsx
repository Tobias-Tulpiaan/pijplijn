export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@/lib/prisma'
import { KalenderView, type CalEvent } from '@/components/pijplijn/KalenderView'
import { format } from 'date-fns'

type SearchParams = Promise<{ owner?: string; stage?: string; vacatureId?: string }>

export default async function KalenderPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const { owner, stage, vacatureId } = params

  const candidates = await prisma.candidate.findMany({
    where: {
      archived: false,
      ...(owner      && { owner: { name: owner } }),
      ...(vacatureId && { vacatureId }),
      ...(stage && !isNaN(parseInt(stage)) && { stage: parseInt(stage) }),
    },
    include: {
      tasks: true,
      stageHistory: { orderBy: { changedAt: 'desc' } },
    },
  })

  const events: CalEvent[] = []

  for (const c of candidates) {
    // Gesprekken: stage 40 of 50 — datum van recentste stageHistory naar die stage
    const gesprekEntry = c.stageHistory.find((h) => h.toStage === 40 || h.toStage === 50)
    if (gesprekEntry) {
      events.push({
        id: `gesprek-${c.id}`,
        date: format(new Date(gesprekEntry.changedAt), 'yyyy-MM-dd'),
        type: 'gesprek',
        label: c.name,
        href: `/kandidaat/${c.id}`,
      })
    }

    // Taken met dueDate
    for (const task of c.tasks) {
      if (task.dueDate && !task.completed) {
        events.push({
          id: `taak-${task.id}`,
          date: format(new Date(task.dueDate), 'yyyy-MM-dd'),
          type: 'taak',
          label: `${task.title} (${c.name})`,
          href: `/kandidaat/${c.id}`,
        })
      }
    }

    // Startdatum: stage 100, lastContact als proxy
    if (c.stage === 100 && c.lastContact) {
      events.push({
        id: `start-${c.id}`,
        date: format(new Date(c.lastContact), 'yyyy-MM-dd'),
        type: 'start',
        label: c.name,
        href: `/kandidaat/${c.id}`,
      })
    }
  }

  const key = `${owner ?? 'all'}-${stage ?? 'all'}-${vacatureId ?? 'all'}`

  return <KalenderView key={key} events={events} />
}

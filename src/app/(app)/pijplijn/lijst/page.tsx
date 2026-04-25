export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { KandidatenTabel } from '@/components/pijplijn/KandidatenTabel'

const include = {
  owner: true,
  company: true,
  tasks: true,
  stageHistory: {
    include: { changedBy: true },
    orderBy: { changedAt: 'desc' as const },
    take: 1,
  },
} as const

type SearchParams = Promise<{ owner?: string; company?: string; stage?: string; q?: string }>

export default async function LijstPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const { owner, company, stage, q } = params

  const where = {
    archived: false,
    ...(owner && { owner: { name: owner } }),
    ...(company && { company: { name: company } }),
    ...(stage && !isNaN(parseInt(stage)) && { stage: parseInt(stage) }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { role: { contains: q, mode: 'insensitive' as const } },
        { company: { name: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const candidates = await prisma.candidate.findMany({
    where,
    include,
    orderBy: { name: 'asc' },
  })

  return <KandidatenTabel candidates={candidates} />
}

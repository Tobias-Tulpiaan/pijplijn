export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@/lib/prisma'
import { KandidatenTabel } from '@/components/pijplijn/KandidatenTabel'

const include = {
  owner: true,
  company: true,
  contact: true,
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
        { email: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
        { notes: { contains: q, mode: 'insensitive' as const } },
        { company: { name: { contains: q, mode: 'insensitive' as const } } },
        { contact: { name: { contains: q, mode: 'insensitive' as const } } },
        { contact: { email: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [candidates, users] = await Promise.all([
    prisma.candidate.findMany({ where, include, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const key = `${owner ?? 'all'}-${company ?? 'all'}-${stage ?? 'all'}-${q ?? ''}`

  return <KandidatenTabel key={key} candidates={candidates} users={users} />
}

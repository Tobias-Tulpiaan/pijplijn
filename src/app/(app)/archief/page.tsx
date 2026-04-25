export const dynamic = 'force-dynamic'

import { Archive } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ArchiefFilter } from '@/components/archief/ArchiefFilter'
import { ArchiefTabel } from '@/components/archief/ArchiefTabel'

type SearchParams = Promise<{ reden?: string; owner?: string; q?: string }>

export default async function ArchiefPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const { reden, owner, q } = params

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  const candidates = await prisma.candidate.findMany({
    where: {
      archived: true,
      ...(reden && { archivedReason: reden }),
      ...(owner && { owner: { name: owner } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
          { owner: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    },
    include: { company: true, owner: true },
    orderBy: { archivedAt: 'desc' },
  })

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Archive size={22} style={{ color: '#6B6B6B' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Archief</h1>
        </div>
        <ArchiefFilter users={users} currentReden={reden ?? ''} currentOwner={owner ?? ''} currentQ={q ?? ''} />
      </div>

      {candidates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}
        >
          <Archive size={40} style={{ color: '#d1d5db' }} className="mb-3" />
          <p className="text-lg font-semibold" style={{ color: '#9ca3af' }}>Geen gearchiveerde kandidaten</p>
        </div>
      ) : (
        <ArchiefTabel candidates={candidates} />
      )}
    </div>
  )
}

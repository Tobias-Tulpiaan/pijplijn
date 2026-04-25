export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { Users, CheckSquare, Receipt } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PijplijnBoard } from '@/components/pijplijn/PijplijnBoard'
import { NieuweKandidaatDialog } from '@/components/pijplijn/NieuweKandidaatDialog'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

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

type SearchParams = Promise<{ owner?: string; company?: string; q?: string; vacatureId?: string }>

export default async function PijplijnPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  const params = await searchParams
  const { owner, company, q, vacatureId } = params
  const key = `${owner ?? 'all'}-${company ?? 'all'}-${q ?? ''}-${vacatureId ?? 'all'}`

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Shared where-clause: stat cards use same filters as the board
  const baseWhere = {
    archived: false,
    ...(owner      && { owner: { name: owner } }),
    ...(company    && { company: { name: company } }),
    ...(vacatureId && { vacatureId }),
    ...(q && {
      OR: [
        { name:    { contains: q, mode: 'insensitive' as const } },
        { role:    { contains: q, mode: 'insensitive' as const } },
        { email:   { contains: q, mode: 'insensitive' as const } },
        { phone:   { contains: q } },
        { notes:   { contains: q, mode: 'insensitive' as const } },
        { company: { name:  { contains: q, mode: 'insensitive' as const } } },
        { contact: { name:  { contains: q, mode: 'insensitive' as const } } },
        { contact: { email: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [candidates, companies, users, actieveKandidatenCount, takenVandaagCount, gefactureerdCount] = await Promise.all([
    prisma.candidate.findMany({ where: baseWhere, include, orderBy: { createdAt: 'desc' } }),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),

    // Stat 1: active candidates — same filters as board
    prisma.candidate.count({ where: baseWhere }),

    // Stat 2: tasks today — owner filter → that consultant's tasks; else → logged-in user
    prisma.task.count({
      where: {
        completed: false,
        dueDate: { gte: todayStart, lte: todayEnd },
        ...(owner
          ? { assignedTo: { name: owner } }
          : { assignedToId: session!.user.id }),
      },
    }),

    // Stat 3: gefactureerd this month — same filters + stage >= 80
    prisma.candidate.count({
      where: {
        ...baseWhere,
        stage: { gte: 80 },
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ])

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg p-4 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold" style={{ color: '#A68A52' }}>{actieveKandidatenCount}</p>
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                {owner || company || q ? 'gefilterde kandidaten' : 'actieve kandidaten in pijplijn'}
              </p>
            </div>
            <Users size={22} style={{ color: '#CBAD74' }} />
          </div>
        </div>

        <Link
          href="/taken"
          className="rounded-lg p-4 shadow-sm border border-gray-100 block hover:shadow-md transition-shadow"
          style={{ backgroundColor: '#ffffff' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold" style={{ color: '#A68A52' }}>{takenVandaagCount}</p>
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                {owner ? `taken van ${owner} vandaag` : 'voor jou vandaag'}
              </p>
            </div>
            <CheckSquare size={22} style={{ color: '#CBAD74' }} />
          </div>
        </Link>

        <div className="rounded-lg p-4 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold" style={{ color: '#A68A52' }}>{gefactureerdCount}</p>
              <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>deze maand gefactureerd</p>
            </div>
            <Receipt size={22} style={{ color: '#CBAD74' }} />
          </div>
        </div>
      </div>

      {/* Kanban board */}
      {candidates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
        >
          <p className="text-lg font-semibold mb-2" style={{ color: '#A68A52' }}>
            {q || owner || company ? 'Geen kandidaten gevonden voor deze filters' : 'Nog geen kandidaten'}
          </p>
          {!q && !owner && !company && (
            <>
              <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
                Voeg je eerste kandidaat toe om de pijplijn te starten.
              </p>
              <NieuweKandidaatDialog
                companies={companies}
                users={users}
                currentUserId={session!.user.id}
              />
            </>
          )}
        </div>
      ) : (
        <PijplijnBoard key={key} initialCandidates={candidates} users={users} />
      )}
    </div>
  )
}

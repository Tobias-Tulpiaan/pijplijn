import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PijplijnBoard } from '@/components/pijplijn/PijplijnBoard'
import { NieuweKandidaatDialog } from '@/components/pijplijn/NieuweKandidaatDialog'

export const dynamic = 'force-dynamic'

const candidateInclude = {
  owner: true,
  company: true,
  tasks: true,
  stageHistory: {
    include: { changedBy: true },
    orderBy: { changedAt: 'desc' as const },
    take: 1,
  },
} as const

export default async function PijplijnPage() {
  const session = await auth()

  const [candidates, companies, users] = await Promise.all([
    prisma.candidate.findMany({
      include: candidateInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
          Pijplijn
        </h1>
        <NieuweKandidaatDialog
          companies={companies}
          users={users}
          currentUserId={session!.user.id}
        />
      </div>

      {/* Board of empty state */}
      {candidates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
        >
          <p className="text-lg font-semibold mb-2" style={{ color: '#A68A52' }}>
            Nog geen kandidaten
          </p>
          <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>
            Voeg je eerste kandidaat toe om de pijplijn te starten.
          </p>
          <NieuweKandidaatDialog
            companies={companies}
            users={users}
            currentUserId={session!.user.id}
          />
        </div>
      ) : (
        <PijplijnBoard initialCandidates={candidates} users={users} />
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Briefcase } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { VACATURE_STATUS } from '@/types'
import { NieuweVacatureDialog } from '@/components/vacature/NieuweVacatureDialog'
import { VacatureFilterBar } from '@/components/vacature/VacatureFilterBar'

type SearchParams = Promise<{ q?: string; status?: string; companyId?: string; consultantId?: string }>

function initialen(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default async function VacaturesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  const params = await searchParams
  const { q, status, companyId, consultantId } = params

  const [vacatures, companies, users] = await Promise.all([
    prisma.vacature.findMany({
      where: {
        ...(q         && { title: { contains: q, mode: 'insensitive' } }),
        ...(status    && { status }),
        ...(companyId && { companyId }),
        ...(consultantId && { consultantId }),
      },
      include: {
        company:    true,
        contact:    true,
        consultant: true,
        candidates: { select: { id: true, stage: true, archived: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const ORDER = ['open', 'on_hold', 'vervuld', 'gesloten']
  const grouped = ORDER.map((s) => ({
    status: s,
    items: vacatures.filter((v) => v.status === s),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6" style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase size={22} style={{ color: '#6B6B6B' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Vacatures</h1>
        </div>
        <NieuweVacatureDialog companies={companies} users={users} currentUserId={session!.user.id} />
      </div>

      <VacatureFilterBar companies={companies} users={users} currentQ={q ?? ''} currentStatus={status ?? ''} currentCompanyId={companyId ?? ''} currentConsultantId={consultantId ?? ''} />

      {vacatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}>
          <p className="text-lg font-semibold mb-2" style={{ color: '#A68A52' }}>
            {q || status || companyId || consultantId ? 'Geen vacatures gevonden voor deze filters' : 'Nog geen vacatures'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status: s, items }) => {
            const info = VACATURE_STATUS[s]
            return (
              <div key={s}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                  <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#6B6B6B' }}>
                    {info.label}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: info.bg, color: info.color }}>
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((v) => {
                    const activeCandidates = v.candidates.filter((c) => !c.archived).length
                    const aangenomen = v.candidates.filter((c) => c.stage >= 70 && !c.archived).length
                    return (
                      <Link
                        key={v.id}
                        href={`/vacatures/${v.id}`}
                        className="flex items-center justify-between rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1A1A1A' }}>{v.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#A68A52' }}>{v.company.name}</p>
                          {v.location && <p className="text-xs" style={{ color: '#6B6B6B' }}>{v.location}</p>}
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                              {aangenomen}/{v.positions}
                            </p>
                            <p className="text-xs" style={{ color: '#6B6B6B' }}>posities gevuld</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{activeCandidates}</p>
                            <p className="text-xs" style={{ color: '#6B6B6B' }}>in pijplijn</p>
                          </div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                            title={v.consultant.name}
                          >
                            {initialen(v.consultant.name)}
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: info.bg, color: info.color }}
                          >
                            {info.label}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

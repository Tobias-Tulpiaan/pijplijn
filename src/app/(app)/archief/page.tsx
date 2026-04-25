export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Archive } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ArchiefFilter } from '@/components/archief/ArchiefFilter'
import { ArchiefRijActies } from '@/components/archief/ArchiefRijActies'

type SearchParams = Promise<{ reden?: string; owner?: string }>

const REDEN_LABELS: Record<string, { label: string; color: string }> = {
  aangenomen:    { label: 'Aangenomen',                    color: '#16a34a' },
  afgewezen:     { label: 'Afgewezen',                    color: '#dc2626' },
  afgehaakt:     { label: 'Afgehaakt',                    color: '#d97706' },
  niet_relevant: { label: 'Niet relevant',                color: '#6B6B6B' },
}

export default async function ArchiefPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const { reden, owner } = params

  const users = await prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  const candidates = await prisma.candidate.findMany({
    where: {
      archived: true,
      ...(reden && { archivedReason: reden }),
      ...(owner && { owner: { name: owner } }),
    },
    include: { company: true, owner: true },
    orderBy: { archivedAt: 'desc' },
  })

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Archive size={22} style={{ color: '#6B6B6B' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Archief</h1>
        </div>
        <ArchiefFilter users={users} currentReden={reden ?? ''} currentOwner={owner ?? ''} />
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
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Naam</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Functie</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Opdrachtgever</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Reden</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Gearchiveerd</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B6B6B' }}>Consultant</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const redenInfo = c.archivedReason ? REDEN_LABELS[c.archivedReason] : null
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < candidates.length - 1 ? '1px solid #f3f4f6' : undefined }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/kandidaat/${c.id}`}
                        className="font-medium hover:underline"
                        style={{ color: '#1A1A1A' }}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>{c.role}</td>
                    <td className="px-4 py-3" style={{ color: '#6B6B6B' }}>
                      {c.company?.name ?? <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {redenInfo ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: redenInfo.color }}
                        >
                          {redenInfo.label}
                        </span>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                      {c.archivedAt
                        ? format(new Date(c.archivedAt), 'd MMM yyyy', { locale: nl })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#A68A52' }}>{c.owner.name}</td>
                    <td className="px-4 py-3">
                      <ArchiefRijActies candidateId={c.id} candidateName={c.name} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

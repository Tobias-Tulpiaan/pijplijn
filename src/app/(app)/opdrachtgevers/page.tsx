export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { NieuweOpdrachtgeverDialog } from '@/components/opdrachtgevers/NieuweOpdrachtgeverDialog'
import { OpdrachtgeversControls } from '@/components/opdrachtgevers/OpdrachtgeversControls'
import { OpdrachtgeversList } from '@/components/opdrachtgevers/OpdrachtgeversList'

type SearchParams = Promise<{ view?: string; archived?: string; q?: string }>

export default async function OpdrachtgeversPage({ searchParams }: { searchParams: SearchParams }) {
  const params       = await searchParams
  const view         = params.view === 'lijst' ? 'lijst' : 'cards'
  const showArchived = params.archived === 'true'
  const q            = params.q ?? ''

  const companies = await prisma.company.findMany({
    where: {
      archived: showArchived,
      ...(q && {
        OR: [
          { name:     { contains: q, mode: 'insensitive' } },
          { contacts: { some: { name:  { contains: q, mode: 'insensitive' } } } },
          { contacts: { some: { email: { contains: q, mode: 'insensitive' } } } },
          { vacatures: { some: { title: { contains: q, mode: 'insensitive' } } } },
        ],
      }),
    },
    orderBy: { name: 'asc' },
    include: {
      contacts: {
        orderBy: { name: 'asc' },
        take: 1,
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          candidates: { where: { archived: false } },
          vacatures:  { where: { status: { in: ['open', 'on_hold'] } } },
        },
      },
    },
  })

  const key = `${view}-${showArchived}-${q}`

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Opdrachtgevers</h1>
        {!showArchived && <NieuweOpdrachtgeverDialog />}
      </div>

      <Suspense>
        <OpdrachtgeversControls
          showArchived={showArchived}
          currentQ={q}
        />
      </Suspense>

      <OpdrachtgeversList
        key={key}
        companies={companies as Parameters<typeof OpdrachtgeversList>[0]['companies']}
        view={view}
        showArchived={showArchived}
      />
    </div>
  )
}

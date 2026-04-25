import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ViewSwitcher } from '@/components/pijplijn/ViewSwitcher'
import { FilterBar } from '@/components/pijplijn/FilterBar'
import { NieuweKandidaatDialog } from '@/components/pijplijn/NieuweKandidaatDialog'
import { Suspense } from 'react'

export default async function PijplijnLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  const [companies, users] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
          Pijplijn
        </h1>
        <NieuweKandidaatDialog
          companies={companies}
          users={users}
          currentUserId={session!.user.id}
        />
      </div>

      {/* View switcher */}
      <ViewSwitcher />

      {/* Filterbalk */}
      <Suspense>
        <FilterBar owners={users} companies={companies} />
      </Suspense>

      {/* View inhoud */}
      {children}
    </div>
  )
}

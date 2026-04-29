export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { PijplijnBoard } from '@/components/pijplijn/PijplijnBoard'
import { BewerkOpdrachtgeverDialog } from '@/components/opdrachtgever/BewerkOpdrachtgeverDialog'
import { ContactenLijst } from '@/components/opdrachtgever/ContactenLijst'
import { NieuweVacatureDialog } from '@/components/vacature/NieuweVacatureDialog'
import { TakenLijst } from '@/components/kandidaat/TakenLijst'
import { VACATURE_STATUS } from '@/types'
import { getCompanyCode } from '@/lib/companyCode'

type Params = Promise<{ id: string }>

export default async function OpdrachtgeverDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await auth()

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { name: 'asc' } },
      vacatures: {
        include: {
          consultant: { select: { id: true, name: true } },
          _count: { select: { candidates: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      },
      tasks: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      candidates: {
        include: {
          owner: true,
          company: true,
          contact: true,
          tasks: true,
          stageHistory: {
            include: { changedBy: true },
            orderBy: { changedAt: 'desc' as const },
            take: 1,
          },
        },
        where: { archived: false },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!company) notFound()

  const [users, allCompanies] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.company.findMany({ where: { archived: false }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <Link
        href="/opdrachtgevers"
        className="flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: '#6B6B6B' }}
      >
        <ArrowLeft size={15} />
        Opdrachtgevers
      </Link>

      {/* Company info */}
      <div className="rounded-xl p-6 mb-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{company.name}</h1>
          <BewerkOpdrachtgeverDialog company={company} />
        </div>
        <div className="space-y-1">
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            Pijplijn code:{' '}
            <span className="font-medium" style={{ color: '#6B6B6B' }}>{getCompanyCode(company)}</span>
          </p>
          {company.contactPerson && (
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              Primair contact: <span style={{ color: '#1A1A1A' }}>{company.contactPerson}</span>
            </p>
          )}
          {company.contactEmail && (
            <a href={`mailto:${company.contactEmail}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
              <Mail size={13} style={{ color: '#CBAD74' }} />
              {company.contactEmail}
            </a>
          )}
          {company.contactPhone && (
            <a href={`tel:${company.contactPhone}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
              <Phone size={13} style={{ color: '#CBAD74' }} />
              {company.contactPhone}
            </a>
          )}
        </div>
      </div>

      {/* Contactpersonen */}
      <div className="rounded-xl p-6 mb-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: '#A68A52' }}>Contactpersonen</h2>
        <ContactenLijst companyId={company.id} companyName={company.name} initialContacts={company.contacts} />
      </div>

      {/* Vacatures */}
      <div className="rounded-xl p-6 mb-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#A68A52' }}>
            Vacatures ({company.vacatures.length})
          </h2>
          <NieuweVacatureDialog
            companies={allCompanies}
            users={users}
            currentUserId={session!.user.id}
            defaultCompanyId={id}
          />
        </div>
        {company.vacatures.length === 0 ? (
          <p className="text-sm" style={{ color: '#6B6B6B' }}>Nog geen vacatures voor deze opdrachtgever.</p>
        ) : (
          <div className="space-y-2">
            {company.vacatures.map((v) => {
              const info = VACATURE_STATUS[v.status] ?? VACATURE_STATUS.open
              return (
                <Link
                  key={v.id}
                  href={`/vacatures/${v.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{v.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>{v.consultant.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#6B6B6B' }}>
                      {v._count.candidates} kandidaten
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: info.bg, color: info.color }}>
                      {info.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Taken */}
      <div className="rounded-xl p-6 mb-6 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
        <h2 className="text-base font-semibold mb-3" style={{ color: '#A68A52' }}>
          Taken ({company.tasks.length})
        </h2>
        <TakenLijst
          companyId={company.id}
          tasks={company.tasks}
          users={users}
          currentUserId={session!.user.id}
        />
      </div>

      {/* Mini kanban */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: '#1A1A1A' }}>
        Kandidaten ({company.candidates.length})
      </h2>

      {company.candidates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}
        >
          <p className="text-base" style={{ color: '#6B6B6B' }}>
            Nog geen kandidaten bij deze opdrachtgever
          </p>
        </div>
      ) : (
        <PijplijnBoard initialCandidates={company.candidates} users={users} />
      )}
    </div>
  )
}

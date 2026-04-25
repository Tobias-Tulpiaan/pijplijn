export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PijplijnBoard } from '@/components/pijplijn/PijplijnBoard'
import { BewerkOpdrachtgeverDialog } from '@/components/opdrachtgever/BewerkOpdrachtgeverDialog'
import { ContactenLijst } from '@/components/opdrachtgever/ContactenLijst'

type Params = Promise<{ id: string }>

export default async function OpdrachtgeverDetailPage({ params }: { params: Params }) {
  const { id } = await params

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { name: 'asc' } },
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

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

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
        <ContactenLijst companyId={company.id} initialContacts={company.contacts} />
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

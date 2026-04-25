export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Building2, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { NieuweOpdrachtgeverDialog } from '@/components/opdrachtgevers/NieuweOpdrachtgeverDialog'

export default async function OpdrachtgeversPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { candidates: true } } },
  })

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Opdrachtgevers</h1>
        <NieuweOpdrachtgeverDialog />
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20"
          style={{ borderColor: '#CBAD74', backgroundColor: 'rgba(203,173,116,0.05)' }}>
          <p className="text-lg font-semibold mb-2" style={{ color: '#A68A52' }}>Nog geen opdrachtgevers</p>
          <p className="text-sm mb-6" style={{ color: '#6B6B6B' }}>Voeg je eerste opdrachtgever toe.</p>
          <NieuweOpdrachtgeverDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/opdrachtgevers/${company.id}`}
              className="block rounded-xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:scale-[1.01]"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(203,173,116,0.2)' }}
                >
                  <Building2 size={20} style={{ color: '#A68A52' }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate" style={{ color: '#1A1A1A' }}>
                    {company.name}
                  </h3>
                  {company.contactPerson && (
                    <p className="text-sm truncate" style={{ color: '#6B6B6B' }}>
                      {company.contactPerson}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#A68A52' }}>
                <Users size={14} />
                <span>{company._count.candidates} kandidaten</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

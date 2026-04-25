export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ArrowLeft, Mail, Phone, MapPin, Clock, Euro, Calendar, Copy, Briefcase } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { VACATURE_STATUS } from '@/types'
import { PijplijnBoard } from '@/components/pijplijn/PijplijnBoard'
import { BewerkVacatureDialog } from '@/components/vacature/BewerkVacatureDialog'

type Params = Promise<{ id: string }>

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
      <span style={{ color: '#6B6B6B' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: '#1A1A1A' }}>{value}</span>
    </div>
  )
}

function formatSalary(min?: number | null, max?: number | null, suffix = '/mnd') {
  if (!min && !max) return null
  const fmt = (n: number) => `€${n.toLocaleString('nl-NL')}`
  if (min && max) return `${fmt(min)} – ${fmt(max)} ${suffix}`
  if (min)        return `vanaf ${fmt(min)} ${suffix}`
  return `tot ${fmt(max!)} ${suffix}`
}

export default async function VacatureDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await auth()

  const vacature = await prisma.vacature.findUnique({
    where: { id },
    include: {
      company:    true,
      contact:    true,
      consultant: true,
      _count:     { select: { candidates: true } },
      candidates: {
        where: { archived: false },
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
        orderBy: { createdAt: 'desc' as const },
      },
    },
  })

  if (!vacature) notFound()

  const [companies, users, archivedCandidates] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.candidate.findMany({
      where: { vacatureId: id, archived: true },
      select: { archivedReason: true },
    }),
  ])

  const info = VACATURE_STATUS[vacature.status] ?? VACATURE_STATUS.open
  const activeCandidates = vacature.candidates.length
  const aangenomen = vacature.candidates.filter((c) => c.stage >= 70).length
  const aangenomenArchief = archivedCandidates.filter((c) => c.archivedReason === 'aangenomen').length
  const totalAangenomen = aangenomen + aangenomenArchief
  const totalAfgesloten = archivedCandidates.length
  const conversie = totalAfgesloten > 0 ? Math.round(totalAangenomen / totalAfgesloten * 100) : 0

  const CONTRACT_LABELS: Record<string, string> = {
    vast: 'Vast dienstverband', tijdelijk: 'Tijdelijk', zzp: 'ZZP', detachering: 'Detachering',
  }
  const WERKMODEL_LABELS: Record<string, string> = {
    kantoor: 'Op kantoor', hybride: 'Hybride', remote: 'Volledig remote',
  }
  const LEASE_LABELS: Record<string, string> = { geen: 'Geen', optioneel: 'Optioneel', ja: 'Ja' }

  const salaryMnd  = formatSalary(vacature.salaryMonthMin, vacature.salaryMonthMax, '/mnd')
  const salaryJaar = formatSalary(vacature.salaryYearMin,  vacature.salaryYearMax,  '/jaar')

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      <Link href="/vacatures" className="flex items-center gap-1.5 text-sm mb-6 hover:underline" style={{ color: '#6B6B6B' }}>
        <ArrowLeft size={15} /> Vacatures
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{vacature.title}</h1>
            <span className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: info.bg, color: info.color }}>
              {info.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#6B6B6B' }}>
            <Link href={`/opdrachtgevers/${vacature.company.id}`} className="hover:underline" style={{ color: '#A68A52' }}>
              {vacature.company.name}
            </Link>
            <span>—</span>
            <span>{vacature.consultant.name}</span>
          </div>
        </div>
        <BewerkVacatureDialog vacature={vacature} users={users} companies={companies} />
      </div>

      {/* 3-koloms grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LINKS col-span-2 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vacature info */}
          <div className="rounded-lg p-5 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#A68A52' }}>Vacature info</h2>
            <div className="divide-y divide-gray-50">
              <InfoRow label="Posities" value={`${totalAangenomen} gevuld van ${vacature.positions}`} />
              <InfoRow label="Contracttype"  value={vacature.contractType ? CONTRACT_LABELS[vacature.contractType] ?? vacature.contractType : null} />
              <InfoRow label="Uren per week" value={vacature.hoursPerWeek ? `${vacature.hoursPerWeek} uur` : null} />
              <InfoRow label="Locatie"       value={vacature.location} />
              <InfoRow label="Werkmodel"     value={vacature.workModel ? WERKMODEL_LABELS[vacature.workModel] ?? vacature.workModel : null} />
              {salaryMnd  && <InfoRow label="Salaris per maand" value={salaryMnd} />}
              {salaryJaar && <InfoRow label="Salaris per jaar"  value={salaryJaar} />}
              <InfoRow label="Lease-auto"    value={vacature.leaseAuto ? LEASE_LABELS[vacature.leaseAuto] ?? vacature.leaseAuto : null} />
              {vacature.deadline && (
                <InfoRow label="Deadline" value={format(new Date(vacature.deadline), 'd MMMM yyyy', { locale: nl })} />
              )}
            </div>
            {vacature.feeOpdrachtgever && (
              <div className="mt-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(203,173,116,0.1)', border: '1px solid #CBAD74' }}>
                <p className="text-xs font-bold mb-0.5" style={{ color: '#A68A52' }}>TARIEF OPDRACHTGEVER</p>
                <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                  €{vacature.feeOpdrachtgever.toLocaleString('nl-NL')}
                </p>
              </div>
            )}
            {vacature.bonus && (
              <div className="mt-3">
                <p className="text-xs font-semibold mb-1" style={{ color: '#6B6B6B' }}>BONUS</p>
                <p className="text-sm" style={{ color: '#1A1A1A' }}>{vacature.bonus}</p>
              </div>
            )}
            {vacature.pensionExtras && (
              <div className="mt-3">
                <p className="text-xs font-semibold mb-1" style={{ color: '#6B6B6B' }}>PENSIOEN / EXTRAS</p>
                <p className="text-sm" style={{ color: '#1A1A1A' }}>{vacature.pensionExtras}</p>
              </div>
            )}
            {vacature.description && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>FUNCTIEBESCHRIJVING</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>{vacature.description}</p>
              </div>
            )}
            {vacature.highlights && (
              <div className="mt-3">
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>HIGHLIGHTS</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>{vacature.highlights}</p>
              </div>
            )}
            {vacature.notes && (
              <div className="mt-3 px-3 py-2.5 rounded" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#6B6B6B' }}>INTERNE NOTITIES</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>{vacature.notes}</p>
              </div>
            )}
          </div>

          {/* Contactpersoon */}
          {vacature.contact && (
            <div className="rounded-lg p-5 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#A68A52' }}>Contactpersoon</h2>
              <div className="space-y-1.5">
                <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>
                  {vacature.contact.name}
                  {vacature.contact.role && <span className="font-normal ml-2 text-xs" style={{ color: '#6B6B6B' }}>— {vacature.contact.role}</span>}
                </p>
                {vacature.contact.email && (
                  <a href={`mailto:${vacature.contact.email}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                    <Mail size={13} style={{ color: '#CBAD74' }} />{vacature.contact.email}
                  </a>
                )}
                {vacature.contact.phone && (
                  <a href={`tel:${vacature.contact.phone}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                    <Phone size={13} style={{ color: '#CBAD74' }} />{vacature.contact.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mini pijplijn */}
          <div className="rounded-lg p-5 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#A68A52' }}>
              Pijplijn voor deze vacature ({activeCandidates})
            </h2>
            {vacature.candidates.length === 0 ? (
              <p className="text-sm" style={{ color: '#9ca3af' }}>Nog geen kandidaten gekoppeld</p>
            ) : (
              <PijplijnBoard initialCandidates={vacature.candidates} users={users} />
            )}
          </div>
        </div>

        {/* RECHTS */}
        <div className="space-y-4">
          {/* Kengetallen */}
          <div className="rounded-lg p-5 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#A68A52' }}>Kengetallen</h2>
            <div className="space-y-3">
              {[
                { label: 'Actieve kandidaten', value: activeCandidates },
                { label: 'Aangenomen (totaal)', value: totalAangenomen },
                { label: 'Posities gevuld', value: `${totalAangenomen}/${vacature.positions}` },
                { label: 'Conversie', value: `${conversie}%` },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span style={{ color: '#6B6B6B' }}>{s.label}</span>
                  <span className="font-bold" style={{ color: '#A68A52' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Posities gevuld banner */}
          {totalAangenomen >= vacature.positions && vacature.status === 'open' && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: 'rgba(22,163,74,0.05)', borderColor: '#16a34a' }}>
              <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                Alle {vacature.positions} {vacature.positions === 1 ? 'positie is' : 'posities zijn'} gevuld.
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Overweeg de status te wijzigen naar "Vervuld".</p>
            </div>
          )}

          {/* Acties */}
          <div className="rounded-lg p-5 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#A68A52' }}>Acties</h2>
            <div className="space-y-2">
              <Link
                href={`/vacatures/nieuw?dupliceerVan=${vacature.id}`}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: '#6B6B6B' }}
              >
                <Copy size={14} /> Vacature dupliceren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ArrowLeft, Mail, Phone, ExternalLink, Building2, Calendar, FileText, CalendarPlus, Archive } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { STAGE_LABEL } from '@/types'
import { StageTijdlijn } from '@/components/kandidaat/StageTijdlijn'
import { BewerkKandidaatDialog } from '@/components/kandidaat/BewerkKandidaatDialog'
import { ArchiveerKandidaatDialog } from '@/components/kandidaat/ArchiveerKandidaatDialog'
import { TakenLijst } from '@/components/kandidaat/TakenLijst'
import { HeractiveerKnop } from '@/components/kandidaat/HeractiveerKnop'
import { VerwijderArchiefDialog } from '@/components/kandidaat/VerwijderArchiefDialog'
import { getSetting } from '@/lib/settings'

type Params = Promise<{ id: string }>

const REDEN_LABELS: Record<string, { label: string; color: string }> = {
  aangenomen:    { label: 'Aangenomen',                    color: '#16a34a' },
  afgewezen:     { label: 'Afgewezen door opdrachtgever', color: '#dc2626' },
  afgehaakt:     { label: 'Kandidaat afgehaakt',          color: '#d97706' },
  niet_relevant: { label: 'Niet meer relevant',           color: '#6B6B6B' },
}

function InfoCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4 shadow-sm border border-gray-100" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: '#A68A52' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function initialen(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default async function KandidaatDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const session = await auth()

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      owner: true,
      company: true,
      contact: true,
      tasks: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      stageHistory: {
        include: { changedBy: true },
        orderBy: { changedAt: 'desc' },
      },
    },
  })

  if (!candidate) notFound()

  const [companies, users, invoiceUrl] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    getSetting('invoiceUrl', 'https://secure20.e-boekhouden.nl/bh/inloggen.asp'),
  ])

  const gesprekStages = [30, 40, 50]
  const showGesprekKnop = !candidate.archived && gesprekStages.includes(candidate.stage)
  const redenInfo = candidate.archivedReason ? REDEN_LABELS[candidate.archivedReason] : null

  return (
    <div style={{ fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}>
      {/* Archief-banner */}
      {candidate.archived && (
        <div
          className="mb-4 px-4 py-3 rounded-lg flex items-start justify-between gap-4"
          style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
        >
          <div className="flex items-start gap-2">
            <Archive size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#6B6B6B' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                Gearchiveerd op {format(new Date(candidate.archivedAt!), 'd MMMM yyyy', { locale: nl })}
                {redenInfo && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: redenInfo.color, color: '#fff' }}
                  >
                    {redenInfo.label}
                  </span>
                )}
              </p>
              {candidate.archivedNote && (
                <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>{candidate.archivedNote}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeractiveerKnop candidateId={candidate.id} />
            <VerwijderArchiefDialog candidateId={candidate.id} candidateName={candidate.name} />
          </div>
        </div>
      )}

      {/* Top navigatie */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={candidate.archived ? '/archief' : '/pijplijn'}
          className="flex items-center gap-1.5 text-sm hover:underline"
          style={{ color: '#6B6B6B' }}
        >
          <ArrowLeft size={15} />
          {candidate.archived ? 'Archief' : 'Pijplijn'}
        </Link>
        {!candidate.archived && (
          <div className="flex items-center gap-2">
            {showGesprekKnop && (
              <a
                href={`/api/calendar/stage/${candidate.id}?stage=${candidate.stage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border hover:bg-gray-50"
                style={{ color: '#A68A52', borderColor: '#CBAD74' }}
              >
                <CalendarPlus size={14} />
                Gesprek inplannen in Outlook
              </a>
            )}
            <ArchiveerKandidaatDialog candidateId={candidate.id} candidateName={candidate.name} />
            <BewerkKandidaatDialog candidate={candidate} companies={companies} users={users} />
          </div>
        )}
      </div>

      {/* Naam + stage badge */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{candidate.name}</h1>
        <span
          className="px-3 py-1 rounded-full text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: candidate.archived ? '#e5e7eb' : '#CBAD74', color: '#1A1A1A' }}
        >
          {candidate.stage}% — {STAGE_LABEL(candidate.stage)}
        </span>
      </div>
      <p className="text-base mb-6" style={{ color: '#6B6B6B' }}>
        {candidate.role}
        {candidate.company && (
          <> bij <span style={{ color: '#A68A52' }}>{candidate.company.name}</span></>
        )}
      </p>

      {/* 2-kolommen grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LINKS */}
        <div className="space-y-4">
          <InfoCard title="Contactgegevens">
            {!candidate.email && !candidate.phone && !candidate.linkedinUrl ? (
              <p className="text-sm" style={{ color: '#6B6B6B' }}>Geen contactgegevens</p>
            ) : (
              <div className="space-y-2">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                    <Mail size={14} style={{ color: '#CBAD74' }} />
                    {candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                    <Phone size={14} style={{ color: '#CBAD74' }} />
                    {candidate.phone}
                  </a>
                )}
                {candidate.linkedinUrl && (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                    <ExternalLink size={14} style={{ color: '#CBAD74' }} />
                    LinkedIn profiel
                  </a>
                )}
              </div>
            )}
          </InfoCard>

          {candidate.company && (
            <InfoCard
              title="Opdrachtgever"
              action={
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
                >
                  <FileText size={11} />
                  Factureer
                </a>
              }
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 size={14} style={{ color: '#CBAD74' }} />
                  <Link href={`/opdrachtgevers/${candidate.company.id}`} className="text-sm font-medium hover:underline" style={{ color: '#A68A52' }}>
                    {candidate.company.name}
                  </Link>
                </div>
                {candidate.company.contactPerson && (
                  <p className="text-sm pl-6" style={{ color: '#6B6B6B' }}>
                    Contactpersoon: {candidate.company.contactPerson}
                  </p>
                )}
                {candidate.company.contactEmail && (
                  <a href={`mailto:${candidate.company.contactEmail}`} className="flex items-center gap-2 text-sm pl-6 hover:underline" style={{ color: '#1A1A1A' }}>
                    <Mail size={12} style={{ color: '#CBAD74' }} />
                    {candidate.company.contactEmail}
                  </a>
                )}
                {candidate.contact ? (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                    <p className="text-xs font-semibold" style={{ color: '#6B6B6B' }}>Contactpersoon</p>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                      {candidate.contact.name}
                      {candidate.contact.role && (
                        <span className="font-normal text-xs ml-1.5" style={{ color: '#6B6B6B' }}>
                          — {candidate.contact.role}
                        </span>
                      )}
                    </p>
                    {candidate.contact.email && (
                      <a href={`mailto:${candidate.contact.email}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                        <Mail size={12} style={{ color: '#CBAD74' }} />
                        {candidate.contact.email}
                      </a>
                    )}
                    {candidate.contact.phone && (
                      <a href={`tel:${candidate.contact.phone}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#1A1A1A' }}>
                        <Phone size={12} style={{ color: '#CBAD74' }} />
                        {candidate.contact.phone}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>Geen contactpersoon gekoppeld</p>
                )}
              </div>
            </InfoCard>
          )}

          <InfoCard title="Consultant">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: '#CBAD74', color: '#1A1A1A' }}
              >
                {initialen(candidate.owner.name)}
              </div>
              <div>
                <p className="font-medium" style={{ color: '#1A1A1A' }}>{candidate.owner.name}</p>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>{candidate.owner.email}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Datums">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={13} style={{ color: '#CBAD74' }} />
                <span style={{ color: '#6B6B6B' }}>Aangemaakt:</span>
                <span style={{ color: '#1A1A1A' }}>
                  {format(new Date(candidate.createdAt), 'd MMMM yyyy', { locale: nl })}
                </span>
              </div>
              {candidate.lastContact && (
                <div className="flex items-center gap-2">
                  <Calendar size={13} style={{ color: '#CBAD74' }} />
                  <span style={{ color: '#6B6B6B' }}>Laatste contact:</span>
                  <span style={{ color: '#1A1A1A' }}>
                    {format(new Date(candidate.lastContact), 'd MMMM yyyy', { locale: nl })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar size={13} style={{ color: '#CBAD74' }} />
                <span style={{ color: '#6B6B6B' }}>Bijgewerkt:</span>
                <span style={{ color: '#1A1A1A' }}>
                  {format(new Date(candidate.updatedAt), 'd MMMM yyyy', { locale: nl })}
                </span>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* RECHTS */}
        <div className="space-y-4">
          <InfoCard title="Stage Historie">
            <StageTijdlijn entries={candidate.stageHistory} />
          </InfoCard>

          <InfoCard title="Taken">
            {candidate.archived ? (
              <div className="space-y-2">
                {candidate.tasks.length === 0 ? (
                  <p className="text-sm" style={{ color: '#6B6B6B' }}>Geen taken</p>
                ) : (
                  candidate.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                        style={{ borderColor: t.completed ? '#CBAD74' : '#d1d5db', backgroundColor: t.completed ? '#CBAD74' : 'transparent' }}
                      />
                      <p className="text-sm" style={{ color: '#6B6B6B', textDecoration: t.completed ? 'line-through' : undefined }}>
                        {t.title}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <TakenLijst
                candidateId={candidate.id}
                tasks={candidate.tasks}
                users={users}
                currentUserId={session!.user.id}
              />
            )}
          </InfoCard>

          {candidate.notes && (
            <InfoCard title="Notities">
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#1A1A1A' }}>
                {candidate.notes}
              </p>
            </InfoCard>
          )}
        </div>
      </div>
    </div>
  )
}

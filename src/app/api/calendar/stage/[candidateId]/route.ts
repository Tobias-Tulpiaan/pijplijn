export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGE_LABEL } from '@/types'

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId } = await params
  const { searchParams } = new URL(request.url)
  const stage = parseInt(searchParams.get('stage') ?? '0')

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { company: true },
  })

  if (!candidate) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setUTCHours(14, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const stageLabel = STAGE_LABEL(stage || candidate.stage)
  const summary = `Gesprek met ${candidate.name} — ${candidate.role}`
  const description = [
    `Stage: ${stageLabel}`,
    candidate.company ? `Opdrachtgever: ${candidate.company.name}` : '',
    `Aangemeld via Tulpiaan Pijplijn`,
  ].filter(Boolean).join('\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tulpiaan//Pijplijn//NL',
    'BEGIN:VEVENT',
    `UID:stage-${candidateId}-${Date.now()}@tulpiaan.nl`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="gesprek-${candidateId}.ics"`,
    },
  })
}

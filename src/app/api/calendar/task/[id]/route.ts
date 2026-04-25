export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const task = await prisma.task.findUnique({
    where: { id },
    include: { candidate: { include: { company: true } } },
  })

  if (!task) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const now = new Date()
  const start = task.dueDate ? new Date(task.dueDate) : now
  if (task.dueTime) {
    const [h, m] = task.dueTime.split(':').map(Number)
    start.setHours(h, m, 0, 0)
  } else {
    start.setUTCHours(9, 0, 0, 0)
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const companyName = task.candidate?.company?.name ?? ''
  const description = [
    task.candidate ? `Kandidaat: ${task.candidate.name}` : '',
    companyName ? `Opdrachtgever: ${companyName}` : '',
    task.description ?? '',
  ].filter(Boolean).join('\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tulpiaan//Pijplijn//NL',
    'BEGIN:VEVENT',
    `UID:task-${id}@tulpiaan.nl`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${task.title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="taak-${id}.ics"`,
    },
  })
}

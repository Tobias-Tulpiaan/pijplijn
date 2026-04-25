export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { ids, archivedNote, closeOpenVacatures } = body as {
      ids: string[]
      archivedNote?: string
      closeOpenVacatures: boolean
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Geen ids opgegeven' }, { status: 400 })
    }

    const successful: string[] = []
    const failed: { id: string; name: string; reason: string }[] = []

    for (const id of ids) {
      const company = await prisma.company.findUnique({ where: { id }, select: { name: true } })
      if (!company) { failed.push({ id, name: id, reason: 'Niet gevonden' }); continue }

      const activeCandidates = await prisma.candidate.count({ where: { companyId: id, archived: false } })
      if (activeCandidates > 0) {
        failed.push({ id, name: company.name, reason: `${activeCandidates} actieve kandidaten` })
        continue
      }

      if (closeOpenVacatures) {
        await prisma.vacature.updateMany({
          where: { companyId: id, status: { in: ['open', 'on_hold'] } },
          data: { status: 'gesloten' },
        })
      }

      await prisma.company.update({
        where: { id },
        data: { archived: true, archivedAt: new Date(), archivedNote: archivedNote?.trim() || null },
      })
      successful.push(id)
    }

    return NextResponse.json({ successful, failed })
  } catch (e) {
    console.error('POST /api/companies/bulk-archive error:', e)
    return NextResponse.json({ error: 'Bulk archiveren mislukt' }, { status: 500 })
  }
}

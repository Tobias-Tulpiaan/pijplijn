export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { archivedNote, closeOpenVacatures } = body as {
      archivedNote?: string
      closeOpenVacatures: boolean
    }

    const activeCandidates = await prisma.candidate.count({
      where: { companyId: id, archived: false },
    })
    if (activeCandidates > 0) {
      return NextResponse.json(
        { error: `${activeCandidates} actieve kandidaten gevonden. Archiveer deze eerst.` },
        { status: 400 }
      )
    }

    const openVacatures = await prisma.vacature.count({
      where: { companyId: id, status: { in: ['open', 'on_hold'] } },
    })
    if (openVacatures > 0 && !closeOpenVacatures) {
      return NextResponse.json(
        { warning: true, openVacatures },
        { status: 200 }
      )
    }

    let closedVacatures = 0
    if (openVacatures > 0 && closeOpenVacatures) {
      const result = await prisma.vacature.updateMany({
        where: { companyId: id, status: { in: ['open', 'on_hold'] } },
        data: { status: 'gesloten' },
      })
      closedVacatures = result.count
    }

    await prisma.company.update({
      where: { id },
      data: {
        archived:    true,
        archivedAt:  new Date(),
        archivedNote: archivedNote?.trim() || null,
      },
    })

    return NextResponse.json({ ok: true, closedVacatures })
  } catch (e) {
    console.error('POST /api/companies/[id]/archive error:', e)
    return NextResponse.json({ error: 'Archiveren mislukt' }, { status: 500 })
  }
}

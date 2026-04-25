export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { createdAt, archivedAt, stageHistoryUpdates } = body as {
      createdAt?:          string
      archivedAt?:         string
      stageHistoryUpdates?: { id: string; changedAt: string }[]
    }

    const candidate = await prisma.candidate.findUnique({ where: { id } })
    if (!candidate) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const newCreatedAt  = createdAt  ? new Date(createdAt)  : candidate.createdAt
    const newArchivedAt = archivedAt ? new Date(archivedAt) : candidate.archivedAt

    if (newArchivedAt && newArchivedAt < newCreatedAt) {
      return NextResponse.json(
        { error: '"Gearchiveerd op" mag niet vóór "Aangemaakt op" liggen.' },
        { status: 400 }
      )
    }

    await prisma.candidate.update({
      where: { id },
      data: {
        ...(createdAt  && { createdAt:  newCreatedAt }),
        ...(archivedAt && { archivedAt: newArchivedAt }),
      },
    })

    if (stageHistoryUpdates?.length) {
      await Promise.all(
        stageHistoryUpdates.map(({ id: histId, changedAt }) =>
          prisma.stageHistory.update({
            where: { id: histId },
            data: { changedAt: new Date(changedAt) },
          })
        )
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PUT /api/candidates/[id]/dates error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

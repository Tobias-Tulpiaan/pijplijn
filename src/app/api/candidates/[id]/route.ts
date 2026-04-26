export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

const candidateInclude = {
  owner: true,
  company: true,
  contact: true,
  tasks: true,
  stageHistory: {
    include: { changedBy: true },
    orderBy: { changedAt: 'desc' as const },
  },
} as const

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: candidateInclude,
    })
    if (!candidate) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    return NextResponse.json(candidate)
  } catch (e) {
    console.error('GET /api/candidates/[id] error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.candidate.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const stageChanged = body.stage !== undefined && body.stage !== existing.stage

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.stage !== undefined && { stage: body.stage }),
        ...(body.companyId  !== undefined && { companyId:  body.companyId }),
        ...(body.contactId  !== undefined && { contactId:  body.contactId }),
        ...(body.vacatureId !== undefined && { vacatureId: body.vacatureId || null }),
        ...(body.ownerId !== undefined && { ownerId: body.ownerId }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.linkedinUrl !== undefined && { linkedinUrl: body.linkedinUrl }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.lastContact !== undefined && { lastContact: new Date(body.lastContact) }),
        ...(stageChanged && {
          stageHistory: {
            create: {
              fromStage: existing.stage,
              toStage: body.stage,
              changedById: session.user.id,
              note: body.note ?? null,
            },
          },
        }),
      },
      include: candidateInclude,
    })

    const action = stageChanged ? 'candidate_stage_change' : 'candidate_update'
    await logAction({ userId: session.user.id, action, entityType: 'candidate', entityId: id, metadata: stageChanged ? { from: existing.stage, to: body.stage } : null, request })
    return NextResponse.json(candidate)
  } catch (e) {
    console.error('PUT /api/candidates/[id] error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    const data = body.archived === true
      ? {
          archived: true,
          archivedAt: new Date(),
          archivedReason: body.archivedReason ?? null,
          archivedNote: body.archivedNote ?? null,
        }
      : {
          archived: false,
          archivedAt: null,
          archivedReason: null,
          archivedNote: null,
          stage: 10,
        }

    const candidate = await prisma.candidate.update({ where: { id }, data })
    const archiveAction = body.archived === true ? 'candidate_archive' : 'candidate_unarchive'
    await logAction({ userId: session.user.id, action: archiveAction, entityType: 'candidate', entityId: id, request })
    return NextResponse.json(candidate)
  } catch (e) {
    console.error('PATCH /api/candidates/[id] error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.candidate.delete({ where: { id } })
    await logAction({ userId: session.user?.id, action: 'candidate_delete', entityType: 'candidate', entityId: id })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/candidates/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    if (body.dueTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(body.dueTime)) {
      return NextResponse.json({ error: 'Ongeldige tijd (gebruik HH:MM)' }, { status: 400 })
    }

    const shared = body.isShared === true

    const completingNow  = body.completed === true
    const reactivating   = body.completed === false

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title       !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.dueDate     !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.dueTime     !== undefined && { dueTime: body.dueTime?.trim() || null }),
        ...(body.completed   !== undefined && { completed: body.completed }),
        ...(body.isShared    !== undefined && { isShared: shared }),
        ...(body.candidateId !== undefined && { candidateId: body.candidateId || null }),
        ...(body.companyId   !== undefined && { companyId: body.companyId || null }),
        ...(body.assignedToId !== undefined && { assignedToId: shared ? null : (body.assignedToId || null) }),
        ...(completingNow && {
          completedAt:   new Date(),
          completedById: session.user.id,
        }),
        ...(reactivating && {
          completedAt:   null,
          completedById: null,
        }),
      },
      include: {
        assignedTo:  { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
        candidate:   { select: { id: true, name: true, company: { select: { name: true } } } },
        company:     { select: { id: true, name: true } },
      },
    })

    if (completingNow) {
      await logAction({ userId: session.user.id, action: 'complete_task', entityType: 'task', entityId: id, request })
    } else if (reactivating) {
      await logAction({ userId: session.user.id, action: 'reactivate_task', entityType: 'task', entityId: id, request })
    }

    return NextResponse.json(task)
  } catch (e) {
    console.error('PUT /api/tasks/[id] error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.task.delete({ where: { id } })
    await logAction({ userId: session.user.id, action: 'delete_task', entityType: 'task', entityId: id, request: _req })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/tasks/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

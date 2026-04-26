export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, dueDate, dueTime, candidateId, assignedToId, isShared } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    if (dueTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(dueTime)) {
      return NextResponse.json({ error: 'Ongeldige tijd (gebruik HH:MM)' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime?.trim() || null,
        isShared: isShared === true,
        candidateId: candidateId || null,
        assignedToId: isShared ? null : (assignedToId || session.user.id),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        candidate: { select: { id: true, name: true, company: { select: { name: true } } } },
      },
    })

    await logAction({ userId: session.user.id, action: 'task_create', entityType: 'task', entityId: task.id, request })
    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    console.error('POST /api/tasks error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

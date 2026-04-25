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

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    })

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
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/tasks/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

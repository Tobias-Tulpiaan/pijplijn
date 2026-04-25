export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, dueDate, candidateId, assignedToId } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    if (!candidateId) return NextResponse.json({ error: 'Kandidaat is verplicht' }, { status: 400 })
    if (!assignedToId) return NextResponse.json({ error: 'Toegewezen aan is verplicht' }, { status: 400 })

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        candidateId,
        assignedToId,
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    console.error('POST /api/tasks error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

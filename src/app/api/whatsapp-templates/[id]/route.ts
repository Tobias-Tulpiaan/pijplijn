export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { whatsappTemplateSchema } from '@/lib/validators'
import { extractVariables } from '@/lib/whatsapp'
import { logAction } from '@/lib/auditLog'

type Params = Promise<{ id: string }>

export async function PUT(request: Request, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = whatsappTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }, { status: 400 })
    }

    const variables = extractVariables(parsed.data.body)
    const template = await prisma.whatsappTemplate.update({
      where: { id },
      data: { ...parsed.data, variables },
      include: { _count: { select: { messages: true } } },
    })

    await logAction({
      userId: session.user.id,
      action: 'update_whatsapp_template',
      entityType: 'WhatsappTemplate',
      entityId: id,
      metadata: { name: template.name },
      request,
    })

    return NextResponse.json(template)
  } catch (e) {
    console.error('PUT /api/whatsapp-templates/[id] error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const messageCount = await prisma.whatsappMessage.count({ where: { templateId: id } })

    if (messageCount === 0) {
      await prisma.whatsappTemplate.delete({ where: { id } })
    } else {
      await prisma.whatsappTemplate.update({ where: { id }, data: { active: false } })
    }

    await logAction({
      userId: session.user.id,
      action: 'delete_whatsapp_template',
      entityType: 'WhatsappTemplate',
      entityId: id,
      metadata: { permanent: messageCount === 0 },
      request,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/whatsapp-templates/[id] error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

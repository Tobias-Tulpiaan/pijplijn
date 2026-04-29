export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const recipientType = searchParams.get('recipientType')
  const recipientId = searchParams.get('recipientId')

  if (!recipientType || !recipientId) {
    return NextResponse.json({ error: 'recipientType en recipientId zijn verplicht' }, { status: 400 })
  }

  try {
    const messages = await prisma.whatsappMessage.findMany({
      where: { recipientType, recipientId },
      include: { sentBy: { select: { id: true, name: true } } },
      orderBy: { sentAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(messages)
  } catch (e) {
    console.error('GET /api/whatsapp-messages error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { templateId, recipientType, recipientId, recipientName, recipientPhone, body: messageBody } = body

    if (!recipientType || !recipientId || !recipientName || !recipientPhone || !messageBody) {
      return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
    }

    const message = await prisma.whatsappMessage.create({
      data: {
        templateId: templateId || null,
        recipientType,
        recipientId,
        recipientName,
        recipientPhone,
        body: messageBody,
        sentById: session.user.id,
      },
    })

    await logAction({
      userId: session.user.id,
      action: 'send_whatsapp',
      entityType: recipientType,
      entityId: recipientId,
      metadata: { recipientType, recipientId, templateId: templateId || null },
      request,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (e) {
    console.error('POST /api/whatsapp-messages error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

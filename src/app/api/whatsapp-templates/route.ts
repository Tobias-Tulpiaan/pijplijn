export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { whatsappTemplateSchema } from '@/lib/validators'
import { extractVariables } from '@/lib/whatsapp'
import { logAction } from '@/lib/auditLog'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get('categories')
  const categories = categoriesParam ? categoriesParam.split(',').map((c) => c.trim()) : null

  try {
    const templates = await prisma.whatsappTemplate.findMany({
      where: {
        active: true,
        ...(categories ? { category: { in: categories } } : {}),
      },
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(templates)
  } catch (e) {
    console.error('GET /api/whatsapp-templates error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = whatsappTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }, { status: 400 })
    }

    const variables = extractVariables(parsed.data.body)
    const template = await prisma.whatsappTemplate.create({
      data: {
        ...parsed.data,
        variables,
        createdById: session.user.id,
      },
      include: { _count: { select: { messages: true } } },
    })

    await logAction({
      userId: session.user.id,
      action: 'create_whatsapp_template',
      entityType: 'WhatsappTemplate',
      entityId: template.id,
      metadata: { name: template.name },
      request,
    })

    return NextResponse.json(template, { status: 201 })
  } catch (e) {
    console.error('POST /api/whatsapp-templates error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

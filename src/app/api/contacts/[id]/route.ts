export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const contact = await prisma.contact.findUnique({ where: { id } })
  if (!contact) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json(contact)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        role: body.role?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    })
    return NextResponse.json(contact)
  } catch (e) {
    console.error('PUT /api/contacts/[id] error:', e)
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const linked = await prisma.candidate.count({ where: { contactId: id } })
    if (linked > 0) {
      return NextResponse.json(
        { error: `Kan niet verwijderen: ${linked} kandidaat${linked > 1 ? 'en' : ''} gekoppeld aan deze contactpersoon` },
        { status: 400 }
      )
    }
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/contacts/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

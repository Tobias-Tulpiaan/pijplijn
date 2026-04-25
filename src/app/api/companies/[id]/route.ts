export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    return NextResponse.json(company)
  } catch (e) {
    console.error('GET /api/companies/[id] error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { name, contactPerson, contactEmail, contactPhone } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
      },
    })

    return NextResponse.json(company)
  } catch (e) {
    console.error('PUT /api/companies/[id] error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      select: { _count: { select: { candidates: true, vacatures: true } } },
    })
    if (!company) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    const { candidates, vacatures } = company._count
    if (candidates > 0 || vacatures > 0) {
      return NextResponse.json(
        { error: `Kan niet verwijderen: ${candidates} kandidaten en ${vacatures} vacatures gekoppeld.` },
        { status: 400 }
      )
    }

    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/companies/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

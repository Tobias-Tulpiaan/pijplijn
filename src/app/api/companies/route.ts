export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(companies)
  } catch (e) {
    console.error('GET /api/companies error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, contactPerson, contactEmail, contactPhone } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })

    const company = await prisma.company.upsert({
      where: { name: name.trim() },
      update: {},
      create: {
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (e) {
    console.error('POST /api/companies error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

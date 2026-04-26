export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'
    const q        = searchParams.get('q')?.trim() || ''

    const companies = await prisma.company.findMany({
      where: {
        archived,
        ...(q && {
          OR: [
            { name:     { contains: q, mode: 'insensitive' } },
            { contacts: { some: { name:  { contains: q, mode: 'insensitive' } } } },
            { contacts: { some: { email: { contains: q, mode: 'insensitive' } } } },
            { vacatures: { some: { title: { contains: q, mode: 'insensitive' } } } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    })
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
    const { name, customCode, contactPerson, contactEmail, contactPhone } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.upsert({
        where: { name: name.trim() },
        update: {},
        create: {
          name: name.trim(),
          customCode: customCode?.trim() || null,
          contactPerson: contactPerson?.trim() || null,
          contactEmail: contactEmail?.trim() || null,
          contactPhone: contactPhone?.trim() || null,
        },
      })

      if (contactPerson?.trim()) {
        const nameTrimmed  = contactPerson.trim()
        const emailTrimmed = contactEmail?.trim() || null
        const existing = await tx.contact.findFirst({
          where: {
            companyId: created.id,
            OR: [
              { name: nameTrimmed },
              ...(emailTrimmed ? [{ email: emailTrimmed }] : []),
            ],
          },
        })
        if (!existing) {
          await tx.contact.create({
            data: {
              name: nameTrimmed,
              email: emailTrimmed,
              phone: contactPhone?.trim() || null,
              role: 'Hoofdcontact',
              companyId: created.id,
            },
          })
        }
      }

      return created
    })

    await logAction({ userId: session.user.id, action: 'company_create', entityType: 'company', entityId: company.id, request })
    return NextResponse.json(company, { status: 201 })
  } catch (e) {
    console.error('POST /api/companies error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

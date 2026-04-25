export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId verplicht' }, { status: 400 })

  const contacts = await prisma.contact.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  })
  contacts.sort((a, b) => {
    const aMain = a.role === 'Hoofdcontact' ? 0 : 1
    const bMain = b.role === 'Hoofdcontact' ? 0 : 1
    return aMain - bMain
  })
  return NextResponse.json(contacts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, email, phone, role, notes, companyId } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    if (!companyId) return NextResponse.json({ error: 'companyId verplicht' }, { status: 400 })

    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        role: role?.trim() || null,
        notes: notes?.trim() || null,
        companyId,
      },
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (e) {
    console.error('POST /api/contacts error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

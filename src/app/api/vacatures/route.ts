export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

const vacatureInclude = {
  company:    true,
  contact:    true,
  consultant: true,
  _count: { select: { candidates: true } },
} as const

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId     = searchParams.get('companyId') || undefined
  const status        = searchParams.get('status') || undefined
  const consultantId  = searchParams.get('consultantId') || undefined
  const q             = searchParams.get('q') || undefined

  try {
    const vacatures = await prisma.vacature.findMany({
      where: {
        ...(companyId    && { companyId }),
        ...(status       && { status }),
        ...(consultantId && { consultantId }),
        ...(q && { title: { contains: q, mode: 'insensitive' } }),
      },
      include: vacatureInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(vacatures)
  } catch (e) {
    console.error('GET /api/vacatures error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      title, companyId, contactId, consultantId, status, positions,
      contractType, hoursPerWeek, location, workModel,
      salaryMonthMin, salaryMonthMax, salaryYearMin, salaryYearMax,
      bonus, leaseAuto, pensionExtras, feeOpdrachtgever,
      description, highlights, notes, deadline,
      werkenbijUrl, vacatureTekst,
    } = body

    if (!title?.trim())       return NextResponse.json({ error: 'Titel is verplicht' },       { status: 400 })
    if (!companyId)           return NextResponse.json({ error: 'Opdrachtgever is verplicht' }, { status: 400 })
    if (!consultantId)        return NextResponse.json({ error: 'Consultant is verplicht' },   { status: 400 })

    const vacature = await prisma.vacature.create({
      data: {
        title:           title.trim(),
        companyId,
        contactId:       contactId       || null,
        consultantId,
        status:          status          || 'open',
        positions:       positions        ? parseInt(positions) : 1,
        contractType:    contractType    || null,
        hoursPerWeek:    hoursPerWeek    ? parseInt(hoursPerWeek) : null,
        location:        location?.trim()  || null,
        workModel:       workModel        || null,
        salaryMonthMin:  salaryMonthMin  ? parseInt(salaryMonthMin) : null,
        salaryMonthMax:  salaryMonthMax  ? parseInt(salaryMonthMax) : null,
        salaryYearMin:   salaryYearMin   ? parseInt(salaryYearMin) : null,
        salaryYearMax:   salaryYearMax   ? parseInt(salaryYearMax) : null,
        bonus:           bonus?.trim()   || null,
        leaseAuto:       leaseAuto        || null,
        pensionExtras:   pensionExtras?.trim() || null,
        feeOpdrachtgever: feeOpdrachtgever ? parseInt(feeOpdrachtgever) : null,
        description:     description?.trim() || null,
        highlights:      highlights?.trim()  || null,
        notes:           notes?.trim()       || null,
        deadline:        deadline ? new Date(deadline) : null,
        werkenbijUrl:    werkenbijUrl?.trim() || null,
        vacatureTekst:   vacatureTekst?.trim() || null,
      },
      include: vacatureInclude,
    })

    await logAction({ userId: session.user.id, action: 'vacature_create', entityType: 'vacature', entityId: vacature.id, metadata: { companyId }, request })
    return NextResponse.json(vacature, { status: 201 })
  } catch (e) {
    console.error('POST /api/vacatures error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

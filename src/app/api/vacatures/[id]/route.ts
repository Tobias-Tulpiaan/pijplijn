export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const vacatureInclude = {
  company:    true,
  contact:    true,
  consultant: true,
  candidates: {
    where: { archived: false },
    include: {
      owner: true,
      company: true,
      contact: true,
      tasks: true,
      stageHistory: {
        include: { changedBy: true },
        orderBy: { changedAt: 'desc' as const },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const vacature = await prisma.vacature.findUnique({ where: { id }, include: vacatureInclude })
    if (!vacature) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
    return NextResponse.json(vacature)
  } catch (e) {
    console.error('GET /api/vacatures/[id] error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()

    const vacature = await prisma.vacature.update({
      where: { id },
      data: {
        ...(body.title            !== undefined && { title:            body.title }),
        ...(body.companyId        !== undefined && { companyId:        body.companyId }),
        ...(body.contactId        !== undefined && { contactId:        body.contactId || null }),
        ...(body.consultantId     !== undefined && { consultantId:     body.consultantId }),
        ...(body.status           !== undefined && { status:           body.status }),
        ...(body.positions        !== undefined && { positions:        parseInt(body.positions) }),
        ...(body.contractType     !== undefined && { contractType:     body.contractType || null }),
        ...(body.hoursPerWeek     !== undefined && { hoursPerWeek:     body.hoursPerWeek ? parseInt(body.hoursPerWeek) : null }),
        ...(body.location         !== undefined && { location:         body.location || null }),
        ...(body.workModel        !== undefined && { workModel:        body.workModel || null }),
        ...(body.salaryMonthMin   !== undefined && { salaryMonthMin:   body.salaryMonthMin ? parseInt(body.salaryMonthMin) : null }),
        ...(body.salaryMonthMax   !== undefined && { salaryMonthMax:   body.salaryMonthMax ? parseInt(body.salaryMonthMax) : null }),
        ...(body.salaryYearMin    !== undefined && { salaryYearMin:    body.salaryYearMin ? parseInt(body.salaryYearMin) : null }),
        ...(body.salaryYearMax    !== undefined && { salaryYearMax:    body.salaryYearMax ? parseInt(body.salaryYearMax) : null }),
        ...(body.bonus            !== undefined && { bonus:            body.bonus || null }),
        ...(body.leaseAuto        !== undefined && { leaseAuto:        body.leaseAuto || null }),
        ...(body.pensionExtras    !== undefined && { pensionExtras:    body.pensionExtras || null }),
        ...(body.feeOpdrachtgever !== undefined && { feeOpdrachtgever: body.feeOpdrachtgever ? parseInt(body.feeOpdrachtgever) : null }),
        ...(body.description      !== undefined && { description:      body.description || null }),
        ...(body.highlights       !== undefined && { highlights:       body.highlights || null }),
        ...(body.notes            !== undefined && { notes:            body.notes || null }),
        ...(body.deadline         !== undefined && { deadline:         body.deadline ? new Date(body.deadline) : null }),
      },
      include: vacatureInclude,
    })
    return NextResponse.json(vacature)
  } catch (e) {
    console.error('PUT /api/vacatures/[id] error:', e)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const count = await prisma.candidate.count({ where: { vacatureId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `Kan niet verwijderen: ${count} kandidaten zijn gekoppeld aan deze vacature.` },
        { status: 400 }
      )
    }
    await prisma.vacature.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/vacatures/[id] error:', e)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }
}

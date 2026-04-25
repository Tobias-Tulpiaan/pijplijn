export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const candidateInclude = {
  owner: true,
  company: true,
  tasks: true,
  stageHistory: {
    include: { changedBy: true },
    orderBy: { changedAt: 'desc' as const },
    take: 1,
  },
} as const

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner') || undefined
  const company = searchParams.get('company') || undefined
  const stageStr = searchParams.get('stage')
  const stage = stageStr ? parseInt(stageStr) : undefined
  const q = searchParams.get('q') || undefined

  const where = {
    archived: false,
    ...(owner && { owner: { name: owner } }),
    ...(company && { company: { name: company } }),
    ...(stage && !isNaN(stage) && { stage }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { role: { contains: q, mode: 'insensitive' as const } },
        { company: { name: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  try {
    const candidates = await prisma.candidate.findMany({
      where,
      include: candidateInclude,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(candidates)
  } catch (e) {
    console.error('GET /api/candidates error:', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, role, ownerId, companyId, phone, email, linkedinUrl } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    if (!role?.trim()) return NextResponse.json({ error: 'Functie is verplicht' }, { status: 400 })
    if (!ownerId) return NextResponse.json({ error: 'Owner is verplicht' }, { status: 400 })

    const candidate = await prisma.candidate.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        ownerId,
        companyId: companyId || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        stage: 10,
        stageHistory: {
          create: { fromStage: 0, toStage: 10, changedById: ownerId },
        },
      },
      include: candidateInclude,
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (e) {
    console.error('POST /api/candidates error:', e)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}

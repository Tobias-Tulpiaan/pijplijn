export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const vacature = await prisma.vacature.findUnique({
    where: { id },
    select: { contentStatus: true, werkenbijUrl: true, vacatureTekst: true, recruiterInput: true },
  })
  if (!vacature) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const [activeContent, allVersions] = await Promise.all([
    prisma.vacatureContent.findFirst({
      where: { vacatureId: id, isActive: true },
      include: { createdByUser: { select: { name: true } } },
    }),
    prisma.vacatureContent.findMany({
      where: { vacatureId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        isActive: true,
        scope: true,
        inputSource: true,
        createdAt: true,
        createdByUser: { select: { name: true } },
      },
    }),
  ])

  return NextResponse.json({
    contentStatus: vacature.contentStatus,
    werkenbijUrl: vacature.werkenbijUrl,
    vacatureTekst: vacature.vacatureTekst,
    recruiterInput: vacature.recruiterInput,
    activeContent,
    versions: allVersions,
  })
}

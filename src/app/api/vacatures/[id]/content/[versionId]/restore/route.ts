export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: vacatureId, versionId } = await params

  const target = await prisma.vacatureContent.findUnique({
    where: { id: versionId },
    select: { id: true, version: true, vacatureId: true },
  })
  if (!target || target.vacatureId !== vacatureId) {
    return NextResponse.json({ error: 'Versie niet gevonden' }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.vacatureContent.updateMany({
      where: { vacatureId, isActive: true },
      data: { isActive: false },
    }),
    prisma.vacatureContent.update({
      where: { id: versionId },
      data: { isActive: true },
    }),
    prisma.vacature.update({
      where: { id: vacatureId },
      data: { contentStatus: 'READY' },
    }),
  ])

  await logAction({
    userId: session.user.id,
    action: 'vacature_content_restored',
    entityType: 'vacature',
    entityId: vacatureId,
    metadata: { version: target.version, versionId },
  })

  return NextResponse.json({ success: true, version: target.version })
}

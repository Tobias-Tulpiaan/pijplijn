export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    await prisma.company.update({
      where: { id },
      data: {
        archived:    false,
        archivedAt:  null,
        archivedNote: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/companies/[id]/restore error:', e)
    return NextResponse.json({ error: 'Heractiveren mislukt' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Geen ids opgegeven' }, { status: 400 })
    }

    await prisma.company.updateMany({
      where: { id: { in: ids } },
      data: { archived: false, archivedAt: null, archivedNote: null },
    })

    return NextResponse.json({ ok: true, count: ids.length })
  } catch (e) {
    console.error('POST /api/companies/bulk-restore error:', e)
    return NextResponse.json({ error: 'Bulk heractiveren mislukt' }, { status: 500 })
  }
}

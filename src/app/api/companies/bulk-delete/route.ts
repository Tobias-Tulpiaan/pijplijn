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

    const successful: string[] = []
    const failed: { id: string; name: string; reason: string }[] = []

    for (const id of ids) {
      const company = await prisma.company.findUnique({
        where: { id },
        select: { name: true, _count: { select: { candidates: true, vacatures: true } } },
      })
      if (!company) { failed.push({ id, name: id, reason: 'Niet gevonden' }); continue }

      if (company._count.candidates > 0 || company._count.vacatures > 0) {
        failed.push({
          id,
          name: company.name,
          reason: `${company._count.candidates} kandidaten, ${company._count.vacatures} vacatures`,
        })
        continue
      }

      await prisma.company.delete({ where: { id } })
      successful.push(id)
    }

    return NextResponse.json({ successful, failed })
  } catch (e) {
    console.error('POST /api/companies/bulk-delete error:', e)
    return NextResponse.json({ error: 'Bulk verwijderen mislukt' }, { status: 500 })
  }
}

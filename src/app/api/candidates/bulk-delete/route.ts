export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ids } = body
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: 'Geen kandidaten opgegeven' }, { status: 400 })

  const successful: string[] = []
  const failed: { id: string; error: string }[] = []

  for (const id of ids) {
    try {
      await prisma.candidate.delete({ where: { id } })
      successful.push(id)
    } catch {
      failed.push({ id, error: 'Verwijderen mislukt' })
    }
  }

  return NextResponse.json({ successful, failed })
}

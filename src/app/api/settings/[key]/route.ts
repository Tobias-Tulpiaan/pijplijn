export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSetting, invalidateSetting } from '@/lib/settings'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  const value = await getSetting(key)
  return NextResponse.json({ value })
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  const body = await request.json()
  const { value } = body
  if (typeof value !== 'string' || value.trim() === '') {
    return NextResponse.json({ error: 'Ongeldige waarde' }, { status: 400 })
  }
  await prisma.settings.upsert({
    where: { key },
    update: { value: value.trim() },
    create: { key, value: value.trim() },
  })
  invalidateSetting(key)
  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpEnabled:   false,
      totpSecret:    null,
      recoveryCodes: [],
      totpVerifiedAt: null,
    },
  })

  await logAction({
    userId:     session.user.id,
    action:     '2fa_disabled',
    entityType: 'user',
    entityId:   session.user.id,
    request,
  })

  return NextResponse.json({ ok: true })
}

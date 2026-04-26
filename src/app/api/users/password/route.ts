export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/validators'
import { logAction } from '@/lib/auditLog'

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { newPassword } = body

  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'Wachtwoord is verplicht' }, { status: 400 })
  }

  const validationError = validatePassword(newPassword)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  })

  await logAction({
    userId: session.user.id,
    action: 'change_password',
    entityType: 'user',
    entityId: session.user.id,
    request,
  })

  return NextResponse.json({ success: true })
}

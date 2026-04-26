export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifyTotpCode, verifyRecoveryCode } from '@/lib/totp'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: 'Code is verplicht' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: '2FA niet ingeschakeld' }, { status: 400 })
  }

  const totpValid = verifyTotpCode(user.totpSecret, code)
  if (!totpValid) {
    const recovery = await verifyRecoveryCode(code, user.recoveryCodes)
    if (!recovery.match) return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 })
    const updatedCodes = user.recoveryCodes.filter((_, i) => i !== recovery.index)
    await prisma.user.update({ where: { id: user.id }, data: { recoveryCodes: updatedCodes } })
  }

  return NextResponse.json({ ok: true })
}

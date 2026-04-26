export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCodes,
} from '@/lib/totp'
import { logAction } from '@/lib/auditLog'
import { encode, decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { secret, code } = await request.json()

  if (!secret || !code) {
    return NextResponse.json({ error: 'secret en code zijn verplicht' }, { status: 400 })
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: 'Ongeldige code. Probeer opnieuw.' }, { status: 400 })
  }

  const plainCodes  = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(plainCodes)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpSecret:     secret,
      totpEnabled:    true,
      recoveryCodes:  hashedCodes,
      totpVerifiedAt: new Date(),
    },
  })

  await logAction({
    userId:     session.user.id,
    action:     '2fa_setup_complete',
    entityType: 'user',
    entityId:   session.user.id,
    request,
  })

  // Re-issue the JWT cookie so the middleware immediately sees requiresSetup = false.
  // update() from useSession only refreshes client-side state, not the cookie the
  // middleware reads. Writing the cookie here ensures the very next navigation works.
  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const cookieStore  = await cookies()
  const existingStr  = cookieStore.get(cookieName)?.value ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let baseToken: Record<string, any> = {}
  if (existingStr) {
    baseToken = (await decode({
      token:  existingStr,
      secret: process.env.AUTH_SECRET!,
      salt:   cookieName,
    })) ?? {}
  }

  const freshToken = await encode({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    token:  { ...baseToken, requiresSetup: false } as any,
    secret: process.env.AUTH_SECRET!,
    salt:   cookieName,
    maxAge: 24 * 60 * 60,
  })

  const response = NextResponse.json({ recoveryCodes: plainCodes })
  response.cookies.set(cookieName, freshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   24 * 60 * 60,
  })
  return response
}

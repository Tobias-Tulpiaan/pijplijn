export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateTotpSecret, generateOtpAuthUrl, generateQrCode } from '@/lib/totp'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret     = generateTotpSecret()
  const otpAuthUrl = generateOtpAuthUrl(session.user.email, secret)
  const qrDataUrl  = await generateQrCode(otpAuthUrl)

  return NextResponse.json({ secret, qrDataUrl, otpAuthUrl })
}

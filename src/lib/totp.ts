import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'

export function generateTotpSecret(): string {
  return generateSecret()
}

export function generateOtpAuthUrl(email: string, secret: string): string {
  return generateURI({
    strategy: 'totp',
    issuer:   'Tulpiaan Pijplijn',
    label:    email,
    secret,
  })
}

export async function generateQrCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl)
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    const result = verifySync({ secret, token: code, strategy: 'totp' })
    return result.valid === true
  } catch {
    return false
  }
}

export function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
    codes.push(`${part()}-${part()}-${part()}`)
  }
  return codes
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c, 10)))
}

export async function verifyRecoveryCode(
  plainCode: string,
  hashedCodes: string[]
): Promise<{ match: boolean; index: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(plainCode, hashedCodes[i])) {
      return { match: true, index: i }
    }
  }
  return { match: false, index: -1 }
}

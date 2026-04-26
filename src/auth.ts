import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit'
import { verifyTotpCode, verifyRecoveryCode } from '@/lib/totp'
import { logAction } from '@/lib/auditLog'

class TotpRequired extends CredentialsSignin {
  code = 'REQUIRES_TOTP' as const
}

function getIp(request: Request): string {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:     { label: 'Email',      type: 'email' },
        password:  { label: 'Wachtwoord', type: 'password' },
        totpCode:  { label: '2FA Code',   type: 'text' },
      },
      async authorize(credentials, request) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined
        const totpCode = credentials?.totpCode as string | undefined

        if (!email || !password) return null

        const ip = getIp(request as Request)
        const rl = checkRateLimit(ip)
        if (!rl.allowed) {
          const minutes = Math.ceil((rl.remainingMs ?? 0) / 60000)
          throw new Error(`Te veel pogingen. Probeer over ${minutes} minuten opnieuw.`)
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await compare(password, user.passwordHash))) {
          await logAction({ action: 'login_failed', metadata: { email, reason: 'invalid_credentials' } })
          return null
        }

        // 2FA check
        if (user.totpEnabled) {
          if (!totpCode) throw new TotpRequired()

          const totpValid = verifyTotpCode(user.totpSecret!, totpCode)
          if (!totpValid) {
            const recovery = await verifyRecoveryCode(totpCode, user.recoveryCodes)
            if (!recovery.match) {
              await logAction({ userId: user.id, action: 'login_failed', metadata: { reason: 'invalid_2fa' } })
              throw new Error('Ongeldige 2FA-code.')
            }
            // Verbruik recovery code
            const updatedCodes = user.recoveryCodes.filter((_, i) => i !== recovery.index)
            await prisma.user.update({ where: { id: user.id }, data: { recoveryCodes: updatedCodes } })
          }
        }

        resetRateLimit(ip)
        await logAction({ userId: user.id, action: 'login', request: request as Request })

        return {
          id:            user.id,
          email:         user.email,
          name:          user.name,
          requiresSetup: !user.totpEnabled,
        }
      },
    }),
  ],
  session: {
    strategy:  'jwt',
    maxAge:    24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id           = user.id
        token.requiresSetup = (user as { requiresSetup?: boolean }).requiresSetup ?? false
      }
      // After 2FA setup: re-read DB to clear flag
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { totpEnabled: true },
        })
        if (dbUser) token.requiresSetup = !dbUser.totpEnabled
      }
      return token
    },
    async session({ session, token }) {
      if (typeof token.id === 'string' && session.user) {
        session.user.id           = token.id
        session.user.requiresSetup = Boolean(token.requiresSetup)
      }
      return session
    },
  },
})

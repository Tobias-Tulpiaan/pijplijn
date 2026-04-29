import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'tobias@tulpiaan.nl' },
    select: { id: true, email: true, name: true, passwordHash: true, totpEnabled: true },
  })

  if (!user) { console.log('GEBRUIKER NIET GEVONDEN in database'); return }

  console.log('Gebruiker gevonden:', user.email, '| naam:', user.name)
  console.log('totpEnabled:', user.totpEnabled)
  console.log('passwordHash aanwezig:', !!user.passwordHash, '| lengte:', user.passwordHash?.length ?? 0)

  const passwords = ['tulpiaan2026', 'tulpiaan2026!', 'Tulpiaan2026!']
  for (const pw of passwords) {
    const match = await compare(pw, user.passwordHash)
    console.log(`  "${pw}" → ${match ? '✅ KLOPT' : '❌ klopt niet'}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

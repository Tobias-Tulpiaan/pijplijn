import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'tobias@tulpiaan.nl'
  const newPassword = 'tulpiaan2026!'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { console.error('Gebruiker niet gevonden:', email); process.exit(1) }

  const passwordHash = await hash(newPassword, 12)
  await prisma.user.update({ where: { email }, data: { passwordHash } })

  console.log(`Wachtwoord gereset voor ${email}`)
  console.log(`Nieuw wachtwoord: ${newPassword}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

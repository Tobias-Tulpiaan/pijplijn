import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await hash('tulpiaan2026', 10)

  await prisma.user.upsert({
    where: { email: 'tobias@tulpiaan.nl' },
    update: {},
    create: {
      email: 'tobias@tulpiaan.nl',
      name: 'Tobias',
      passwordHash: password,
    },
  })

  await prisma.user.upsert({
    where: { email: 'ralf@tulpiaan.nl' },
    update: {},
    create: {
      email: 'ralf@tulpiaan.nl',
      name: 'Ralf',
      passwordHash: password,
    },
  })

  console.log('Seed geslaagd: Tobias en Ralf aangemaakt')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

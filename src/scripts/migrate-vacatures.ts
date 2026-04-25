import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      candidates: {
        where: { vacatureId: null },
        select: { id: true, ownerId: true },
      },
    },
  })

  let total = 0

  for (const company of companies) {
    if (company.candidates.length === 0) continue

    const existing = await prisma.vacature.findFirst({
      where: { companyId: company.id, isAlgemeen: true },
    })

    let algemeen = existing
    if (!algemeen) {
      const firstCandidate = company.candidates[0]
      algemeen = await prisma.vacature.create({
        data: {
          title: 'Algemene vacature',
          companyId: company.id,
          consultantId: firstCandidate.ownerId,
          status: 'open',
          isAlgemeen: true,
        },
      })
    }

    const updated = await prisma.candidate.updateMany({
      where: { companyId: company.id, vacatureId: null },
      data: { vacatureId: algemeen.id },
    })

    total += updated.count
    console.log(`${company.name}: ${updated.count} kandidaten → "${algemeen.title}"`)
  }

  console.log(`\nKlaar: ${total} kandidaten bijgewerkt.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

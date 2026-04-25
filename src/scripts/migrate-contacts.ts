import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const companies = await prisma.company.findMany()
  let created = 0
  let skipped = 0

  for (const company of companies) {
    if (!company.contactPerson) { skipped++; continue }

    const existing = await prisma.contact.findFirst({
      where: { companyId: company.id, name: company.contactPerson },
    })

    if (existing) { skipped++; continue }

    await prisma.contact.create({
      data: {
        companyId: company.id,
        name: company.contactPerson,
        email: company.contactEmail ?? null,
        phone: company.contactPhone ?? null,
      },
    })
    created++
    console.log(`  ✓ ${company.name}: contact "${company.contactPerson}" aangemaakt`)
  }

  console.log(`\nKlaar: ${created} aangemaakt, ${skipped} overgeslagen.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

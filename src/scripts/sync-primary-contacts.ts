import { prisma } from '@/lib/prisma'

async function main() {
  const companies = await prisma.company.findMany({
    where: { contactPerson: { not: null } },
    include: { contacts: true },
  })

  let created = 0
  let skipped = 0

  for (const company of companies) {
    if (!company.contactPerson) continue

    const exists = company.contacts.some(
      (c) =>
        c.name === company.contactPerson ||
        (c.email && c.email === company.contactEmail)
    )

    if (exists) {
      skipped++
      continue
    }

    await prisma.contact.create({
      data: {
        name: company.contactPerson,
        email: company.contactEmail || null,
        phone: company.contactPhone || null,
        role: 'Hoofdcontact',
        companyId: company.id,
      },
    })
    created++
  }

  console.log(`Created ${created} contacts, skipped ${skipped} duplicates`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

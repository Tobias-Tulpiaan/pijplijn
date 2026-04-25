import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await hash('tulpiaan2026', 10)

  const tobias = await prisma.user.upsert({
    where: { email: 'tobias@tulpiaan.nl' },
    update: {},
    create: { email: 'tobias@tulpiaan.nl', name: 'Tobias', passwordHash: password },
  })

  const ralf = await prisma.user.upsert({
    where: { email: 'ralf@tulpiaan.nl' },
    update: {},
    create: { email: 'ralf@tulpiaan.nl', name: 'Ralf', passwordHash: password },
  })

  console.log('Users: Tobias en Ralf aangemaakt')

  const techcorp = await prisma.company.upsert({
    where: { name: 'TechCorp BV' },
    update: {},
    create: { name: 'TechCorp BV', contactPerson: 'Jan de Vries', contactEmail: 'jan@techcorp.nl' },
  })

  const hrSolutions = await prisma.company.upsert({
    where: { name: 'HR Solutions Nederland' },
    update: {},
    create: { name: 'HR Solutions Nederland', contactPerson: 'Marieke Bakker', contactEmail: 'marieke@hrsolutions.nl' },
  })

  const apeldoornseGroep = await prisma.company.upsert({
    where: { name: 'Apeldoornse Groep' },
    update: {},
    create: { name: 'Apeldoornse Groep', contactPerson: 'Peter van den Berg', contactEmail: 'peter@apeldoornsegroep.nl' },
  })

  console.log('Companies: 3 opdrachtgevers aangemaakt')

  const kandidaten = [
    {
      email: 'lisa.devries@email.nl',
      data: {
        name: 'Lisa de Vries',
        role: 'Accountmanager',
        company: { connect: { id: techcorp.id } },
        owner: { connect: { id: tobias.id } },
        phone: '+31 6 12345678',
        email: 'lisa.devries@email.nl',
        linkedinUrl: 'https://linkedin.com/in/lisa-de-vries',
        stage: 30,
      },
      ownerId: tobias.id,
    },
    {
      email: 'mark.jansen@email.nl',
      data: {
        name: 'Mark Jansen',
        role: 'Commercieel Binnendienst',
        company: { connect: { id: hrSolutions.id } },
        owner: { connect: { id: ralf.id } },
        phone: '+31 6 23456789',
        email: 'mark.jansen@email.nl',
        linkedinUrl: 'https://linkedin.com/in/mark-jansen',
        stage: 50,
      },
      ownerId: ralf.id,
    },
    {
      email: 'sophie.bakker@email.nl',
      data: {
        name: 'Sophie Bakker',
        role: 'Klantenservice Medewerker',
        company: { connect: { id: apeldoornseGroep.id } },
        owner: { connect: { id: tobias.id } },
        phone: '+31 6 34567890',
        email: 'sophie.bakker@email.nl',
        linkedinUrl: 'https://linkedin.com/in/sophie-bakker',
        stage: 10,
      },
      ownerId: tobias.id,
    },
    {
      email: 'thomas.visser@email.nl',
      data: {
        name: 'Thomas Visser',
        role: 'Sales Manager',
        company: { connect: { id: techcorp.id } },
        owner: { connect: { id: ralf.id } },
        phone: '+31 6 45678901',
        email: 'thomas.visser@email.nl',
        linkedinUrl: 'https://linkedin.com/in/thomas-visser',
        stage: 70,
      },
      ownerId: ralf.id,
    },
    {
      email: 'emma.vandam@email.nl',
      data: {
        name: 'Emma van Dam',
        role: 'Commercieel Medewerker',
        company: { connect: { id: hrSolutions.id } },
        owner: { connect: { id: tobias.id } },
        phone: '+31 6 56789012',
        email: 'emma.vandam@email.nl',
        linkedinUrl: 'https://linkedin.com/in/emma-van-dam',
        stage: 40,
      },
      ownerId: tobias.id,
    },
  ]

  for (const kandidaat of kandidaten) {
    const existing = await prisma.candidate.findFirst({
      where: { email: kandidaat.email },
    })

    if (!existing) {
      const created = await prisma.candidate.create({
        data: {
          ...kandidaat.data,
          stageHistory: {
            create: {
              fromStage: 0,
              toStage: kandidaat.data.stage,
              changedById: kandidaat.ownerId,
            },
          },
        },
      })
      console.log(`Kandidaat aangemaakt: ${created.name} (stage ${created.stage})`)
    } else {
      console.log(`Kandidaat al aanwezig: ${existing.name}`)
    }
  }

  await prisma.settings.upsert({
    where: { key: 'invoiceUrl' },
    update: { value: 'https://secure20.e-boekhouden.nl/bh/inloggen.asp' },
    create: { key: 'invoiceUrl', value: 'https://secure20.e-boekhouden.nl/bh/inloggen.asp' },
  })
  console.log('Settings: invoiceUrl aangemaakt')

  console.log('\nSeed geslaagd!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

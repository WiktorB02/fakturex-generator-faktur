import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Users
  const password = await bcrypt.hash('admin123', 10)
  const accountantPassword = await bcrypt.hash('demo123', 10)
  const viewerPassword = await bcrypt.hash('demo123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fakturex.pl' },
    update: {},
    create: {
      email: 'admin@fakturex.pl',
      name: 'Administrator',
      password: password,
      role: 'OWNER',
    },
  })

  const accountant = await prisma.user.upsert({
    where: { email: 'ksiegowy@fakturex.pl' },
    update: {},
    create: {
      email: 'ksiegowy@fakturex.pl',
      name: 'Księgowy',
      password: accountantPassword,
      role: 'ACCOUNTANT',
    },
  })

  const viewer = await prisma.user.upsert({
    where: { email: 'podglad@fakturex.pl' },
    update: {},
    create: {
      email: 'podglad@fakturex.pl',
      name: 'Obserwator',
      password: viewerPassword,
      role: 'VIEWER',
    },
  })

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Fakturex Sp. z o.o.',
      nip: '1234567890',
      address: 'ul. Programistów 42',
      city: 'Warszawa',
      postal: '00-001',
      country: 'Polska',
      email: 'kontakt@fakturex.pl',
      users: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: accountant.id, role: 'ACCOUNTANT' },
          { userId: viewer.id, role: 'VIEWER' },
        ],
      },
      settings: {
        create: {
          defaultCurrency: 'PLN',
          defaultLanguage: 'pl',
          paymentDays: 14,
        },
      },
    },
  })

  console.log({ admin, accountant, viewer, company })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

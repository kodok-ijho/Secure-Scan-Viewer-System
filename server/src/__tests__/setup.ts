import { prisma } from '../config/database'

// Clean up database before each test
beforeEach(async () => {
  await prisma.fileLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.setting.deleteMany()
})

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect()
})

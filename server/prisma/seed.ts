import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '../.env' })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', admin.username)

  // Create default settings
  const defaultSourceFolder = process.env.DEFAULT_SOURCE || '\\\\127.12.23.23\\Folder A\\Folder B'
  const defaultRetentionDays = parseInt(process.env.RETENTION_DAYS || '7')

  const settings = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      sourceFolder: defaultSourceFolder,
      retentionDays: defaultRetentionDays,
    },
  })

  console.log('✅ Created default settings:', {
    sourceFolder: settings.sourceFolder,
    retentionDays: settings.retentionDays,
  })

  // Create a test user for demonstration
  const testUserPasswordHash = await bcrypt.hash('Test@123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      passwordHash: testUserPasswordHash,
      role: 'USER',
    },
  })

  console.log('✅ Created test user:', testUser.username)

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

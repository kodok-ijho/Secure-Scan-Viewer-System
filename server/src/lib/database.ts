import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

export async function initializeDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize default admin user if not exists
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      await prisma.user.create({
        data: {
          username: process.env.ADMIN_USERNAME || 'admin',
          passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123', // In production, this should be hashed
          role: 'ADMIN'
        }
      });
      console.log('👤 Default admin user created');
    }

    // Initialize default user if not exists
    const defaultUser = await prisma.user.findUnique({
      where: { username: 'dhaniy' }
    });

    if (!defaultUser) {
      await prisma.user.create({
        data: {
          username: 'dhaniy',
          passwordHash: '123456', // In production, this should be hashed
          role: 'USER'
        }
      });
      console.log('👤 Default user created');
    }

    // Initialize settings if not exists
    const settings = await prisma.setting.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings) {
      await prisma.setting.create({
        data: {
          id: 'singleton',
          sourceFolder: process.env.DEFAULT_SOURCE,
          retentionDays: parseInt(process.env.RETENTION_DAYS || '7')
        }
      });
      console.log('⚙️ Default settings created');
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
}

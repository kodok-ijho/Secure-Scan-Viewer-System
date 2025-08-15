"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    });
    console.log('✅ Created admin user:', admin.username);
    const defaultSourceFolder = process.env.DEFAULT_SOURCE || '\\\\127.12.23.23\\Folder A\\Folder B';
    const defaultRetentionDays = parseInt(process.env.RETENTION_DAYS || '7');
    const settings = await prisma.setting.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            sourceFolder: defaultSourceFolder,
            retentionDays: defaultRetentionDays,
        },
    });
    console.log('✅ Created default settings:', {
        sourceFolder: settings.sourceFolder,
        retentionDays: settings.retentionDays,
    });
    const testUserPasswordHash = await bcryptjs_1.default.hash('Test@123', 12);
    const testUser = await prisma.user.upsert({
        where: { username: 'testuser' },
        update: {},
        create: {
            username: 'testuser',
            passwordHash: testUserPasswordHash,
            role: 'USER',
        },
    });
    console.log('✅ Created test user:', testUser.username);
    console.log('🎉 Database seed completed!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
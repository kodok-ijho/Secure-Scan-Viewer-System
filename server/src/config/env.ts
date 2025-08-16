import path from 'node:path';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpires: string;
  refreshTokenExpires: string;
  databaseUrl: string;
  retentionDays: number;
  retentionMinutes: number;
  cronMode: 'internal' | 'external';
  adminUsername: string;
  adminPassword: string;
  
  // Resolved paths
  storageDir: string;
  sourceDir: string;
  dbDir: string;
  volumePath?: string;
}

function parseStringArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
}

function resolveStoragePaths(volumePath?: string) {
  const hasVolume = Boolean(volumePath);
  
  // New env names with legacy fallbacks
  const storageDir = process.env.LOCAL_STORAGE_PATH || 
    process.env.LOCAL_ROOT || 
    (hasVolume ? path.join(volumePath!, 'storage') : path.resolve(process.cwd(), 'storage', 'local'));
    
  const sourceDir = process.env.DEFAULT_SOURCE_FOLDER || 
    process.env.DEFAULT_SOURCE || 
    (hasVolume ? path.join(volumePath!, 'source') : undefined);
    
  const dbDir = hasVolume ? path.join(volumePath!, 'db') : path.resolve(process.cwd(), 'data');
  
  return { storageDir, sourceDir, dbDir };
}

export function loadConfig(): AppConfig {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  const { storageDir, sourceDir, dbDir } = resolveStoragePaths(volumePath);
  
  // CORS origins: new name with legacy fallback
  const corsOriginEnv = process.env.CORS_ORIGIN || process.env.WEB_ORIGIN || '';
  const corsOrigins = parseStringArray(corsOriginEnv);
  
  // Database URL with smart defaults
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    databaseUrl = `file:${path.join(dbDir, 'app.db')}`;
  }
  
  const config: AppConfig = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins,
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production_minimum_32_characters',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_too_in_production_minimum_32_characters',
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
    databaseUrl,
    retentionDays: parseInt(process.env.RETENTION_DAYS || '7', 10),
    retentionMinutes: parseInt(process.env.RETENTION_MINUTES || '0', 10),
    cronMode: (process.env.CRON_MODE as 'internal' | 'external') || 'internal',
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
    
    // Resolved paths
    storageDir,
    sourceDir: sourceDir || '',
    dbDir,
    volumePath
  };
  
  // Validation
  if (config.jwtSecret.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters for security');
  }
  
  if (config.retentionDays < 1 && config.retentionMinutes < 1) {
    console.warn('⚠️ Both RETENTION_DAYS and RETENTION_MINUTES are 0 - files will never be cleaned up');
  }
  
  // Set DATABASE_URL for Prisma if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = config.databaseUrl;
  }
  
  return config;
}

// Export singleton instance
export const cfg = loadConfig();

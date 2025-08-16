import fs from 'node:fs';
import path from 'node:path';

export interface FileSystemPaths {
  localRoot: string;
  source: string | undefined;
  volume: string | undefined;
  database: string;
}

export function resolvePaths(): FileSystemPaths {
  // Railway provides RAILWAY_VOLUME_MOUNT_PATH when volume is attached
  const vol = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  
  // Determine storage paths
  const localRoot = process.env.LOCAL_ROOT || 
    (vol ? path.join(vol, 'storage', 'local') : path.resolve(process.cwd(), 'storage/local'));
  
  const source = process.env.DEFAULT_SOURCE || 
    (vol ? path.join(vol, 'source') : undefined);
  
  // Database path for SQLite
  const database = vol ? 
    path.join(vol, 'db', 'app.db') : 
    path.resolve(process.cwd(), 'data', 'app.db');

  // Auto-create required directories
  const dirsToCreate = [
    localRoot,
    source,
    vol && path.join(vol, 'db'),
    path.dirname(database)
  ].filter(Boolean) as string[];

  dirsToCreate.forEach(dirPath => {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    } catch (error) {
      // Directory might already exist, that's fine
      if ((error as any).code !== 'EEXIST') {
        console.warn(`⚠️ Failed to create directory ${dirPath}:`, error);
      }
    }
  });

  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${database}`;
  }

  console.log('🔧 File system paths resolved:');
  console.log(`   Local storage: ${localRoot}`);
  console.log(`   Source folder: ${source || 'Not configured'}`);
  console.log(`   Volume mount: ${vol || 'Not available'}`);
  console.log(`   Database: ${database}`);

  return {
    localRoot,
    source,
    volume: vol,
    database
  };
}

export function ensureDirectoryExists(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}

export function getFileStats(filePath: string) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

export function listFiles(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

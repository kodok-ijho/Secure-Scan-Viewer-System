import fs from 'node:fs';
import path from 'node:path';
import { cfg } from '../config/env';

export interface FileSystemPaths {
  localRoot: string;
  source: string | undefined;
  volume: string | undefined;
  database: string;
}

export function ensureDirs(): void {
  const dirsToCreate = [
    cfg.storageDir,
    cfg.sourceDir,
    cfg.dbDir
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

  console.log('🔧 File system paths resolved:');
  console.log(`   Local storage: ${cfg.storageDir}`);
  console.log(`   Source folder: ${cfg.sourceDir || 'Not configured'}`);
  console.log(`   Volume mount: ${cfg.volumePath || 'Not available'}`);
  console.log(`   Database: ${cfg.databaseUrl}`);
}

// Legacy function for backward compatibility
export function resolvePaths(): FileSystemPaths {
  ensureDirs();

  return {
    localRoot: cfg.storageDir,
    source: cfg.sourceDir || undefined,
    volume: cfg.volumePath,
    database: cfg.databaseUrl
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

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface CleanupResult {
  deletedFiles: number;
  deletedDirectories: number;
  errors: string[];
  totalSize: number;
}

async function getRetentionSettings() {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'singleton' }
    });
    
    const retentionDays = settings?.retentionDays || parseInt(process.env.RETENTION_DAYS || '7');
    const retentionMinutes = parseInt(process.env.RETENTION_MINUTES || '0');
    
    return { retentionDays, retentionMinutes };
  } catch (error) {
    console.warn('Failed to get retention settings from database, using environment defaults');
    return {
      retentionDays: parseInt(process.env.RETENTION_DAYS || '7'),
      retentionMinutes: parseInt(process.env.RETENTION_MINUTES || '0')
    };
  }
}

function getStoragePath(): string {
  const vol = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  return process.env.LOCAL_ROOT || 
    (vol ? path.join(vol, 'storage', 'local') : path.resolve(process.cwd(), 'storage/local'));
}

function isFileExpired(filePath: string, retentionDays: number, retentionMinutes: number): boolean {
  try {
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileAge = now.getTime() - stats.mtime.getTime();
    
    // Convert retention to milliseconds
    const retentionMs = (retentionDays * 24 * 60 * 60 * 1000) + (retentionMinutes * 60 * 1000);
    
    return fileAge > retentionMs;
  } catch {
    return false;
  }
}

async function logDeletion(filename: string, filePath: string) {
  try {
    await prisma.log.create({
      data: {
        filename,
        localPath: filePath,
        action: 'AUTO_DELETED',
        actorId: null // System action
      }
    });
  } catch (error) {
    console.warn(`Failed to log deletion of ${filename}:`, error);
  }
}

function removeEmptyDirectories(dirPath: string): number {
  let removedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        removedCount += removeEmptyDirectories(itemPath);
        
        // Check if directory is now empty
        try {
          const remainingItems = fs.readdirSync(itemPath);
          if (remainingItems.length === 0) {
            fs.rmdirSync(itemPath);
            removedCount++;
            console.log(`📁 Removed empty directory: ${itemPath}`);
          }
        } catch {
          // Directory not empty or other error
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return removedCount;
}

async function cleanupFiles(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedFiles: 0,
    deletedDirectories: 0,
    errors: [],
    totalSize: 0
  };

  try {
    const { retentionDays, retentionMinutes } = await getRetentionSettings();
    const storagePath = getStoragePath();
    
    console.log(`🧹 Starting cleanup with retention: ${retentionDays} days, ${retentionMinutes} minutes`);
    console.log(`📁 Storage path: ${storagePath}`);
    
    if (!fs.existsSync(storagePath)) {
      console.log('📁 Storage directory does not exist, nothing to clean');
      return result;
    }
    
    const files = fs.readdirSync(storagePath);
    
    for (const filename of files) {
      const filePath = path.join(storagePath, filename);
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && isFileExpired(filePath, retentionDays, retentionMinutes)) {
          const fileSize = stats.size;
          
          // Delete the file
          fs.unlinkSync(filePath);
          result.deletedFiles++;
          result.totalSize += fileSize;
          
          // Log the deletion
          await logDeletion(filename, filePath);
          
          console.log(`🗑️ Deleted expired file: ${filename} (${fileSize} bytes)`);
        }
      } catch (error) {
        const errorMsg = `Failed to process ${filename}: ${(error as Error).message}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // Remove empty directories
    result.deletedDirectories = removeEmptyDirectories(storagePath);
    
    console.log(`✅ Cleanup completed:`);
    console.log(`   Files deleted: ${result.deletedFiles}`);
    console.log(`   Directories removed: ${result.deletedDirectories}`);
    console.log(`   Total size freed: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Errors: ${result.errors.length}`);
    
  } catch (error) {
    const errorMsg = `Cleanup failed: ${(error as Error).message}`;
    result.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
  
  return result;
}

async function main() {
  try {
    console.log('🚀 File cleanup script started');
    
    const result = await cleanupFiles();
    
    if (result.errors.length > 0) {
      console.error('⚠️ Cleanup completed with errors:');
      result.errors.forEach(error => console.error(`   ${error}`));
      process.exit(1);
    } else {
      console.log('✅ Cleanup completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  main();
}

export { cleanupFiles };

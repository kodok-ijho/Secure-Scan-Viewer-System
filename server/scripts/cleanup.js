const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function getRetentionSettings() {
  try {
    const settings = await prisma.settings.findUnique({
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

function getStoragePath() {
  const vol = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  return process.env.LOCAL_ROOT || 
    (vol ? path.join(vol, 'storage', 'local') : path.resolve(process.cwd(), 'storage/local'));
}

function isFileExpired(filePath, retentionDays, retentionMinutes) {
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

async function logDeletion(filename, filePath) {
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

async function cleanupFiles() {
  const result = {
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
        const errorMsg = `Failed to process ${filename}: ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`✅ Cleanup completed:`);
    console.log(`   Files deleted: ${result.deletedFiles}`);
    console.log(`   Total size freed: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Errors: ${result.errors.length}`);
    
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error.message}`;
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

module.exports = { cleanupFiles };

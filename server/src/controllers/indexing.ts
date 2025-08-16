import { Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { AuthenticatedRequest } from '../middleware/auth';
import { resolvePaths, listFiles, getFileStats } from '../lib/fs-init';
import { prisma } from '../lib/database';

export async function runIndexing(req: AuthenticatedRequest, res: Response) {
  try {
    const { mode } = req.body; // 'COPY' or 'MOVE'
    
    if (!mode || !['COPY', 'MOVE'].includes(mode)) {
      return res.status(400).json({ error: 'Mode must be COPY or MOVE' });
    }

    // Get current settings
    const settings = await prisma.setting.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings?.sourceFolder) {
      return res.status(400).json({ error: 'Source folder not configured' });
    }

    const { localRoot } = resolvePaths();
    const sourceFolder = settings.sourceFolder;
    
    if (!fs.existsSync(sourceFolder)) {
      return res.status(400).json({ error: 'Source folder does not exist' });
    }
    
    if (!fs.existsSync(localRoot)) {
      fs.mkdirSync(localRoot, { recursive: true });
    }
    
    const sourceFiles = listFiles(sourceFolder);
    const results = {
      processed: 0,
      copied: 0,
      moved: 0,
      errors: [] as Array<{ filename: string; error: string }>,
      files: [] as Array<{ original: string; final: string; size: number; action: string }>
    };
    
    for (const filename of sourceFiles) {
      try {
        const sourcePath = path.join(sourceFolder, filename);
        const targetPath = path.join(localRoot, filename);
        const stats = getFileStats(sourcePath);
        
        if (stats?.isFile()) {
          results.processed++;
          
          // Check if file already exists and create unique name if needed
          let finalTargetPath = targetPath;
          let counter = 1;
          while (fs.existsSync(finalTargetPath)) {
            const ext = path.extname(filename);
            const name = path.basename(filename, ext);
            finalTargetPath = path.join(localRoot, `${name}(${counter})${ext}`);
            counter++;
          }
          
          if (mode === 'COPY') {
            fs.copyFileSync(sourcePath, finalTargetPath);
            results.copied++;
            
            // Create log entry
            await prisma.log.create({
              data: {
                filename: path.basename(finalTargetPath),
                sourcePath,
                localPath: finalTargetPath,
                action: 'COPIED',
                actorId: req.user?.id
              }
            });
          } else if (mode === 'MOVE') {
            fs.renameSync(sourcePath, finalTargetPath);
            results.moved++;
            
            // Create log entry
            await prisma.log.create({
              data: {
                filename: path.basename(finalTargetPath),
                sourcePath,
                localPath: finalTargetPath,
                action: 'MOVED',
                actorId: req.user?.id
              }
            });
          }
          
          results.files.push({
            original: filename,
            final: path.basename(finalTargetPath),
            size: stats.size,
            action: mode.toLowerCase()
          });
        }
      } catch (error) {
        results.errors.push({
          filename,
          error: (error as Error).message
        });
      }
    }
    
    // Update settings with last indexing info
    await prisma.setting.update({
      where: { id: 'singleton' },
      data: {
        lastIndexingAt: new Date(),
        lastIndexingMode: mode
      }
    });
    
    res.json({
      success: true,
      mode,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running indexing:', error);
    res.status(500).json({ error: 'Failed to run indexing' });
  }
}

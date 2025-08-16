import { Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { AuthenticatedRequest } from '../middleware/auth';
import { resolvePaths, listFiles, getFileStats } from '../lib/fs-init';
import { prisma } from '../lib/database';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const { localRoot } = resolvePaths();
    let totalFiles = 0;
    let totalSize = 0;
    let userFiles = 0;
    let userSize = 0;
    
    if (fs.existsSync(localRoot)) {
      const files = listFiles(localRoot);
      
      files.forEach(filename => {
        const filePath = path.join(localRoot, filename);
        const stats = getFileStats(filePath);
        
        if (stats?.isFile()) {
          totalFiles++;
          totalSize += stats.size;
          
          // Count user-specific files
          if (req.user?.role === 'USER' && filename.startsWith(req.user.username + '_')) {
            userFiles++;
            userSize += stats.size;
          }
        }
      });
    }
    
    // Get recent logs
    const recentLogs = await prisma.log.findMany({
      take: 10,
      include: {
        actor: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get activity in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24hLogs = await prisma.log.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });
    
    // Get settings
    const settings = await prisma.setting.findUnique({
      where: { id: 'singleton' }
    });
    
    // Transform recent logs
    const transformedRecentLogs = recentLogs.map(log => ({
      id: log.id,
      filename: log.filename,
      sourcePath: log.sourcePath,
      localPath: log.localPath,
      action: log.action,
      actorUsername: log.actor?.username || 'System',
      createdAt: log.createdAt.toISOString()
    }));
    
    // Filter recent logs for regular users
    const filteredRecentLogs = req.user?.role === 'USER' 
      ? transformedRecentLogs.filter(log => 
          log.filename.startsWith(req.user!.username + '_')
        )
      : transformedRecentLogs;
    
    const stats = {
      totalFiles: req.user?.role === 'ADMIN' ? totalFiles : userFiles,
      totalSize: req.user?.role === 'ADMIN' ? totalSize : userSize,
      recentActivity: last24hLogs,
      retentionDays: settings?.retentionDays || 7,
      lastIndexing: settings?.lastIndexingAt?.toISOString() || null,
      indexingMode: settings?.lastIndexingMode || null,
      sourceFolder: req.user?.role === 'ADMIN' ? settings?.sourceFolder : null,
      recentLogs: filteredRecentLogs
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}

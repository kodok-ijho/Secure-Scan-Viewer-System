import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/database';

export async function getLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, action } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.filename = {
        contains: search as string,
        mode: 'insensitive'
      };
    }
    
    if (action && action !== 'All Actions') {
      where.action = action;
    }
    
    const logs = await prisma.log.findMany({
      where,
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
    
    // Transform logs to match expected format
    const transformedLogs = logs.map(log => ({
      id: log.id,
      filename: log.filename,
      sourcePath: log.sourcePath,
      localPath: log.localPath,
      action: log.action,
      actorUsername: log.actor?.username || 'System',
      createdAt: log.createdAt.toISOString()
    }));
    
    res.json(transformedLogs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
}

export async function getLogStats(req: AuthenticatedRequest, res: Response) {
  try {
    const totalLogs = await prisma.log.count();
    
    const actionCounts = await prisma.log.groupBy({
      by: ['action'],
      _count: {
        action: true
      }
    });
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.log.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });
    
    const actionCountsMap = actionCounts.reduce((acc, item) => {
      acc[item.action] = item._count.action;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      totalLogs,
      actionCounts: actionCountsMap,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({ error: 'Failed to get log stats' });
  }
}

import { prisma } from '../config/database'
import { FileAction } from '../types/common'

export interface LogEntry {
  id: string
  filename: string
  sourcePath: string | null
  localPath: string
  action: FileAction
  actorUsername: string | null
  createdAt: Date
}

export interface LogsQuery {
  page?: number
  limit?: number
  action?: FileAction
  filename?: string
}

export interface LogsResponse {
  logs: LogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class LogsService {
  static async getLogs(query: LogsQuery = {}): Promise<LogsResponse> {
    const page = Math.max(1, query.page || 1)
    const limit = Math.min(100, Math.max(1, query.limit || 20))
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (query.action) {
      where.action = query.action
    }
    
    if (query.filename) {
      where.filename = {
        contains: query.filename,
        mode: 'insensitive',
      }
    }

    // Get total count
    const total = await prisma.fileLog.count({ where })

    // Get logs with pagination
    const logs = await prisma.fileLog.findMany({
      where,
      include: {
        actor: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const logEntries: LogEntry[] = logs.map(log => ({
      id: log.id,
      filename: log.filename,
      sourcePath: log.sourcePath,
      localPath: log.localPath,
      action: log.action as FileAction,
      actorUsername: log.actor?.username || null,
      createdAt: log.createdAt,
    }))

    return {
      logs: logEntries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async getLogById(id: string): Promise<LogEntry | null> {
    const log = await prisma.fileLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            username: true,
          },
        },
      },
    })

    if (!log) {
      return null
    }

    return {
      id: log.id,
      filename: log.filename,
      sourcePath: log.sourcePath,
      localPath: log.localPath,
      action: log.action as FileAction,
      actorUsername: log.actor?.username || null,
      createdAt: log.createdAt,
    }
  }

  static async getLogStats(): Promise<{
    totalLogs: number
    actionCounts: Record<FileAction, number>
    recentActivity: number
  }> {
    const totalLogs = await prisma.fileLog.count()

    // Get action counts
    const actionCounts = await prisma.fileLog.groupBy({
      by: ['action'],
      _count: {
        action: true,
      },
    })

    const actionCountsMap: Record<FileAction, number> = {
      'COPIED': 0,
      'MOVED': 0,
      'DELETED_RETENTION': 0,
      'DELETED_MANUAL': 0,
    }

    actionCounts.forEach(item => {
      actionCountsMap[item.action as FileAction] = item._count.action
    })

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const recentActivity = await prisma.fileLog.count({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
    })

    return {
      totalLogs,
      actionCounts: actionCountsMap,
      recentActivity,
    }
  }
}

import { Request, Response } from 'express'
import { LogsService } from '../services/logs.service'
import { FileAction } from '../types/common'

export class LogsController {
  static async getLogs(req: Request, res: Response) {
    try {
      const { page, limit, action, filename } = req.query as {
        page?: string
        limit?: string
        action?: FileAction
        filename?: string
      }

      const query = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        action,
        filename,
      }

      const result = await LogsService.getLogs(query)
      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get logs',
      })
    }
  }

  static async getLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const log = await LogsService.getLogById(id)

      if (!log) {
        res.status(404).json({ error: 'Log not found' })
        return
      }

      res.json(log)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get log',
      })
    }
  }

  static async getLogStats(req: Request, res: Response) {
    try {
      const stats = await LogsService.getLogStats()
      res.json(stats)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get log stats',
      })
    }
  }
}

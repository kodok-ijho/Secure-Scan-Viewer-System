import { Request, Response } from 'express'
import { IndexingService } from '../services/indexing.service'
import { IndexingMode } from '../types/common'

export class IndexingController {
  static async indexFiles(req: Request, res: Response) {
    try {
      const { mode } = req.body as { mode: IndexingMode }
      const actorUserId = req.user!.id

      const result = await IndexingService.indexFiles(mode, actorUserId)
      res.json(result)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Indexing failed',
      })
    }
  }
}

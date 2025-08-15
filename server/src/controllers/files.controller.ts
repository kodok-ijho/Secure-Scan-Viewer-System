import { Request, Response } from 'express'
import { createReadStream } from 'fs'
import { FilesService } from '../services/files.service'

export class FilesController {
  static async listFiles(req: Request, res: Response) {
    try {
      const { owner } = req.query as { owner?: string }
      const userRole = req.user!.role
      const username = req.user!.username

      const files = await FilesService.listFiles(userRole, username, owner)
      res.json(files)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list files',
      })
    }
  }

  static async streamFile(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params
      const userRole = req.user!.role
      const username = req.user!.username

      console.log(`Streaming file: ${name} for user: ${username} (${userRole})`)

      // Check file access permissions
      const files = await FilesService.listFiles(userRole, username)
      const file = files.find(f => f.name === name)

      if (!file) {
        console.log(`File not found or access denied: ${name}`)
        res.status(404).json({ error: 'File not found or access denied' })
        return
      }

      const filePath = await FilesService.getFilePath(name)
      const { mimeType } = await FilesService.getFileStats(name)

      console.log(`Serving file: ${filePath} with MIME type: ${mimeType}`)

      res.setHeader('Content-Type', mimeType)
      res.setHeader('Cache-Control', 'private, max-age=3600')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

      const stream = createReadStream(filePath)

      stream.on('error', (error) => {
        console.error('Stream error:', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream file' })
        }
      })

      stream.pipe(res)
    } catch (error) {
      console.error('Stream file error:', error)
      res.status(404).json({
        error: error instanceof Error ? error.message : 'File not found',
      })
    }
  }

  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params
      const userRole = req.user!.role
      const username = req.user!.username

      // Check file access permissions
      const files = await FilesService.listFiles(userRole, username)
      const file = files.find(f => f.name === name)

      if (!file) {
        res.status(404).json({ error: 'File not found or access denied' })
        return
      }

      const filePath = await FilesService.getFilePath(name)
      const { mimeType } = await FilesService.getFileStats(name)

      res.setHeader('Content-Type', mimeType)
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
      res.setHeader('Cache-Control', 'private, max-age=3600')

      const stream = createReadStream(filePath)

      stream.on('error', (error) => {
        console.error('Download stream error:', error)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' })
        }
      })

      stream.pipe(res)
    } catch (error) {
      console.error('Download file error:', error)
      res.status(404).json({
        error: error instanceof Error ? error.message : 'File not found',
      })
    }
  }

  static async deleteFile(req: Request, res: Response) {
    try {
      const { name } = req.params
      const userRole = req.user!.role
      const username = req.user!.username
      const actorUserId = req.user!.id

      await FilesService.deleteFile(name, userRole, username, actorUserId)
      res.json({ message: 'File deleted successfully' })
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('access denied') ? 403 : 404
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Failed to delete file',
      })
    }
  }

  static async deleteAllFiles(req: Request, res: Response) {
    try {
      const userRole = req.user!.role
      const username = req.user!.username
      const actorUserId = req.user!.id

      console.log(`Delete all files requested by: ${username} (${userRole})`)

      const result = await FilesService.deleteAllFiles(userRole, username, actorUserId)

      res.json({
        message: `Successfully deleted ${result.deletedCount} files`,
        deletedCount: result.deletedCount,
        errors: result.errors
      })
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete files',
      })
    }
  }
}

import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../config/database'
import { FileUtils } from '../utils/file'
import { SettingsService } from './settings.service'
import { Role, FileAction } from '../types/common'

export interface FileInfo {
  name: string
  size: number
  ext: string
  modifiedAt: Date
  owner: string | null
  fullPathHidden: true
}

export class FilesService {
  static async listFiles(userRole: Role, username: string, ownerFilter?: string): Promise<FileInfo[]> {
    const settings = await SettingsService.getSettings()
    const targetDir = FileUtils.getTargetDirectory(settings.sourceFolder)

    // Check if target directory exists
    if (!(await FileUtils.isAccessible(targetDir))) {
      return []
    }

    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true })
      const files = entries.filter(entry => entry.isFile())

      const fileInfos: FileInfo[] = []

      for (const file of files) {
        const filePath = path.join(targetDir, file.name)
        const stats = await FileUtils.getFileStats(filePath)
        
        if (!stats) continue

        const owner = FileUtils.extractOwnerFromFilename(file.name)
        const ext = path.extname(file.name).toLowerCase()

        // Apply role-based filtering
        if (userRole === 'USER') {
          // Users can only see their own files
          if (owner !== username) {
            continue
          }
        } else if (userRole === 'ADMIN' && ownerFilter) {
          // Admin with owner filter
          if (owner !== ownerFilter) {
            continue
          }
        }

        fileInfos.push({
          name: file.name,
          size: stats.size,
          ext: ext.substring(1), // Remove the dot
          modifiedAt: stats.mtime,
          owner,
          fullPathHidden: true,
        })
      }

      // Sort by modified date (newest first)
      return fileInfos.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())

    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getFilePath(filename: string): Promise<string> {
    // Validate filename for security
    if (!FileUtils.isValidFilename(filename) || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename')
    }

    const settings = await SettingsService.getSettings()
    const targetDir = FileUtils.getTargetDirectory(settings.sourceFolder)
    const filePath = path.join(targetDir, filename)

    // Ensure the file path is within the target directory (prevent path traversal)
    if (!FileUtils.isSafePath(filename, targetDir)) {
      throw new Error('Invalid file path')
    }

    // Check if file exists
    if (!(await FileUtils.isAccessible(filePath))) {
      throw new Error('File not found')
    }

    return filePath
  }

  static async deleteFile(filename: string, userRole: Role, username: string, actorUserId: string): Promise<void> {
    const filePath = await this.getFilePath(filename)
    
    // Check ownership for non-admin users
    if (userRole === 'USER') {
      const owner = FileUtils.extractOwnerFromFilename(filename)
      if (owner !== username) {
        throw new Error('You can only delete your own files')
      }
    }

    try {
      await fs.unlink(filePath)

      // Log the deletion
      await prisma.fileLog.create({
        data: {
          filename,
          localPath: filePath,
          action: 'DELETED_MANUAL',
          actorUserId,
        },
      })

    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getFileStats(filename: string): Promise<{ size: number; mimeType: string }> {
    const filePath = await this.getFilePath(filename)
    const stats = await FileUtils.getFileStats(filePath)
    
    if (!stats) {
      throw new Error('File not found')
    }

    // Simple MIME type detection based on extension
    const ext = path.extname(filename).toLowerCase()
    const mimeType = this.getMimeType(ext)

    return {
      size: stats.size,
      mimeType,
    }
  }

  private static getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }

    return mimeTypes[ext] || 'application/octet-stream'
  }

  static async deleteAllFiles(userRole: string, username: string, actorUserId: string): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      // Get files that user can access
      const files = await this.listFiles(userRole as Role, username)

      const result = {
        deletedCount: 0,
        errors: [] as string[]
      }

      for (const file of files) {
        try {
          await this.deleteFile(file.name, userRole as Role, username, actorUserId)
          result.deletedCount++
        } catch (error) {
          result.errors.push(`Failed to delete ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

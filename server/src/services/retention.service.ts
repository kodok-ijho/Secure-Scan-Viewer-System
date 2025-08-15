import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../config/database'
import { FileUtils } from '../utils/file'
import { SettingsService } from './settings.service'
import { FileAction } from '../types/common'

export interface RetentionResult {
  totalScanned: number
  totalDeleted: number
  errors: string[]
}

export class RetentionService {
  static async cleanupExpiredFiles(): Promise<RetentionResult> {
    const result: RetentionResult = {
      totalScanned: 0,
      totalDeleted: 0,
      errors: [],
    }

    try {
      const settings = await SettingsService.getSettings()
      const targetDir = FileUtils.getTargetDirectory(settings.sourceFolder)

      // Check if target directory exists
      if (!(await FileUtils.isAccessible(targetDir))) {
        console.log('Target directory does not exist, skipping retention cleanup')
        return result
      }

      // Calculate cutoff date
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays)

      console.log(`Starting retention cleanup for files older than ${cutoffDate.toISOString()}`)

      // Read files from target directory
      const entries = await fs.readdir(targetDir, { withFileTypes: true })
      const files = entries.filter(entry => entry.isFile())

      result.totalScanned = files.length

      for (const file of files) {
        try {
          const filePath = path.join(targetDir, file.name)
          const stats = await FileUtils.getFileStats(filePath)

          if (!stats) {
            result.errors.push(`${file.name}: Could not get file stats`)
            continue
          }

          // Check if file is older than retention period
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath)
            result.totalDeleted++

            // Log the deletion
            await prisma.fileLog.create({
              data: {
                filename: file.name,
                localPath: filePath,
                action: 'DELETED_RETENTION',
                actorUserId: null, // System action
              },
            })

            console.log(`Deleted expired file: ${file.name}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`${file.name}: ${errorMessage}`)
          console.error(`Failed to process file ${file.name}:`, errorMessage)
        }
      }

      console.log(`Retention cleanup completed: ${result.totalDeleted}/${result.totalScanned} files deleted`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Retention cleanup failed: ${errorMessage}`)
      console.error('Retention cleanup failed:', errorMessage)
    }

    return result
  }

  static async getRetentionStats(): Promise<{
    nextCleanup: Date
    retentionDays: number
    estimatedFilesToDelete: number
  }> {
    const settings = await SettingsService.getSettings()
    const targetDir = FileUtils.getTargetDirectory(settings.sourceFolder)

    // Calculate next cleanup time (next 15-minute interval)
    const now = new Date()
    const nextCleanup = new Date(now)
    nextCleanup.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)

    let estimatedFilesToDelete = 0

    try {
      if (await FileUtils.isAccessible(targetDir)) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays)

        const entries = await fs.readdir(targetDir, { withFileTypes: true })
        const files = entries.filter(entry => entry.isFile())

        for (const file of files) {
          try {
            const filePath = path.join(targetDir, file.name)
            const stats = await FileUtils.getFileStats(filePath)
            
            if (stats && stats.mtime < cutoffDate) {
              estimatedFilesToDelete++
            }
          } catch {
            // Ignore errors for estimation
          }
        }
      }
    } catch {
      // Ignore errors for estimation
    }

    return {
      nextCleanup,
      retentionDays: settings.retentionDays,
      estimatedFilesToDelete,
    }
  }
}

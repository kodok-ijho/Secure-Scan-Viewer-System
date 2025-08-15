import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../config/database'
import { FileUtils } from '../utils/file'
import { SettingsService } from './settings.service'
import { IndexingMode, FileAction } from '../types/common'

export interface IndexingResult {
  totalFound: number
  totalProcessed: number
  skipped: number
  targetDir: string
  errors: string[]
}

export class IndexingService {
  static async indexFiles(mode: IndexingMode, actorUserId: string): Promise<IndexingResult> {
    const settings = await SettingsService.getSettings()
    const sourceFolder = settings.sourceFolder
    
    // Validate source folder access
    const accessCheck = await SettingsService.testSourceAccess(sourceFolder)
    if (!accessCheck.accessible) {
      throw new Error(accessCheck.error || 'Source folder not accessible')
    }

    // Determine target directory
    const targetDir = FileUtils.getTargetDirectory(sourceFolder)
    await FileUtils.ensureDir(targetDir)

    const result: IndexingResult = {
      totalFound: 0,
      totalProcessed: 0,
      skipped: 0,
      targetDir,
      errors: [],
    }

    try {
      // Read files from source directory (non-recursive)
      const entries = await fs.readdir(sourceFolder, { withFileTypes: true })
      const files = entries.filter(entry => entry.isFile())
      
      result.totalFound = files.length

      for (const file of files) {
        try {
          await this.processFile(file.name, sourceFolder, targetDir, mode, actorUserId)
          result.totalProcessed++
        } catch (error) {
          result.skipped++
          result.errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update settings with indexing info
      await SettingsService.updateIndexingInfo(mode)

    } catch (error) {
      throw new Error(`Failed to read source directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private static async processFile(
    filename: string,
    sourceDir: string,
    targetDir: string,
    mode: IndexingMode,
    actorUserId: string
  ): Promise<void> {
    // Validate filename
    if (!FileUtils.isValidFilename(filename)) {
      throw new Error('Invalid filename characters')
    }

    const sourcePath = path.join(sourceDir, filename)
    const targetPath = path.join(targetDir, filename)

    try {
      // Check if file already exists in target directory
      const fileExists = await FileUtils.isAccessible(targetPath)

      if (fileExists) {
        console.log(`File already exists, replacing: ${filename}`)

        // Remove existing file first
        await fs.unlink(targetPath)

        // Remove existing log entries for this file
        await prisma.fileLog.deleteMany({
          where: { filename }
        })
      }

      // Copy or move the file
      if (mode === 'COPY') {
        await FileUtils.copyFile(sourcePath, targetPath)
      } else {
        await FileUtils.moveFile(sourcePath, targetPath)
      }

      // Get current retention settings for the new file
      const settings = await SettingsService.getSettings()
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() + settings.retentionDays)

      // Log the action with retention date
      await prisma.fileLog.create({
        data: {
          filename,
          sourcePath,
          localPath: targetPath,
          action: mode === 'COPY' ? 'COPIED' : 'MOVED',
          actorUserId,
          retentionDate,
        },
      })

      console.log(`Successfully ${mode.toLowerCase()}d file: ${filename}`)

    } catch (error) {
      throw new Error(`Failed to ${mode.toLowerCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

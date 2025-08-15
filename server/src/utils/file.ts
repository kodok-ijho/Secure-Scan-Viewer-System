import fs from 'fs/promises'
import path from 'path'
import { config } from '../config/env'

export class FileUtils {
  /**
   * Ensure a directory exists, create if it doesn't
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * Check if a path is safe (no path traversal)
   */
  static isSafePath(filePath: string, basePath: string): boolean {
    const resolvedPath = path.resolve(basePath, filePath)
    const resolvedBase = path.resolve(basePath)
    return resolvedPath.startsWith(resolvedBase)
  }

  /**
   * Get the basename of a folder path (last segment)
   */
  static getFolderBasename(folderPath: string): string {
    // Handle both Windows and Unix paths
    const normalized = folderPath.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(Boolean)
    return segments[segments.length - 1] || 'unknown'
  }

  /**
   * Generate a unique filename if the original exists
   */
  static async getUniqueFilename(dirPath: string, filename: string): Promise<string> {
    const ext = path.extname(filename)
    const nameWithoutExt = path.basename(filename, ext)
    
    let counter = 0
    let newFilename = filename
    
    while (true) {
      try {
        await fs.access(path.join(dirPath, newFilename))
        counter++
        newFilename = `${nameWithoutExt} (${counter})${ext}`
      } catch {
        // File doesn't exist, we can use this name
        break
      }
    }
    
    return newFilename
  }

  /**
   * Extract owner from filename based on convention [owner]_[code].ext
   */
  static extractOwnerFromFilename(filename: string): string | null {
    const parts = filename.split('_')
    if (parts.length >= 2) {
      return parts[0]
    }
    return null
  }

  /**
   * Validate filename for security (only allow safe characters)
   */
  static isValidFilename(filename: string): boolean {
    // Allow letters, numbers, spaces, dots, dashes, underscores
    const validPattern = /^[a-zA-Z0-9\s._-]+$/
    return validPattern.test(filename) && filename.length > 0 && filename.length <= 255
  }

  /**
   * Get target directory for indexing based on source folder
   */
  static getTargetDirectory(sourceFolder: string): string {
    const basename = this.getFolderBasename(sourceFolder)
    return path.join(config.localRoot, basename)
  }

  /**
   * Check if a path exists and is accessible
   */
  static async isAccessible(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK)
      return true
    } catch (error) {
      console.log(`Path not accessible: ${filePath}`, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  /**
   * Get file stats safely
   */
  static async getFileStats(filePath: string) {
    try {
      return await fs.stat(filePath)
    } catch {
      return null
    }
  }

  /**
   * Copy file with fallback for cross-device moves
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination)
  }

  /**
   * Move file with fallback for cross-device moves
   */
  static async moveFile(source: string, destination: string): Promise<void> {
    try {
      await fs.rename(source, destination)
    } catch (error: any) {
      // If rename fails (cross-device), fallback to copy + delete
      if (error.code === 'EXDEV') {
        await this.copyFile(source, destination)
        await fs.unlink(source)
      } else {
        throw error
      }
    }
  }
}

import { prisma } from '../config/database'
import { FileUtils } from '../utils/file'
import { IndexingMode } from '../types/common'

export interface SettingsData {
  sourceFolder: string
  retentionDays: number
  lastIndexingAt?: Date | null
  lastIndexingMode?: IndexingMode | null
}

export class SettingsService {
  static async getSettings(): Promise<SettingsData> {
    let settings = await prisma.setting.findUnique({
      where: { id: 1 },
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: 1,
          sourceFolder: '\\\\127.12.23.23\\Folder A\\Folder B',
          retentionDays: 7,
        },
      })
    }

    return {
      sourceFolder: settings.sourceFolder,
      retentionDays: settings.retentionDays,
      lastIndexingAt: settings.lastIndexingAt,
      lastIndexingMode: settings.lastIndexingMode as IndexingMode | null,
    }
  }

  static async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    // Validate source folder if provided
    if (data.sourceFolder) {
      const isAccessible = await FileUtils.isAccessible(data.sourceFolder)
      if (!isAccessible) {
        throw new Error(`Source folder is not accessible: ${data.sourceFolder}`)
      }
    }

    // Validate retention days
    if (data.retentionDays !== undefined && (data.retentionDays < 1 || data.retentionDays > 365)) {
      throw new Error('Retention days must be between 1 and 365')
    }

    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        ...(data.sourceFolder && { sourceFolder: data.sourceFolder }),
        ...(data.retentionDays !== undefined && { retentionDays: data.retentionDays }),
      },
      create: {
        id: 1,
        sourceFolder: data.sourceFolder || '\\\\127.12.23.23\\Folder A\\Folder B',
        retentionDays: data.retentionDays || 7,
      },
    })

    return {
      sourceFolder: settings.sourceFolder,
      retentionDays: settings.retentionDays,
      lastIndexingAt: settings.lastIndexingAt,
      lastIndexingMode: settings.lastIndexingMode as IndexingMode | null,
    }
  }

  static async updateIndexingInfo(mode: IndexingMode): Promise<void> {
    await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        lastIndexingAt: new Date(),
        lastIndexingMode: mode,
      },
      create: {
        id: 1,
        sourceFolder: '\\\\127.12.23.23\\Folder A\\Folder B',
        retentionDays: 7,
        lastIndexingAt: new Date(),
        lastIndexingMode: mode,
      },
    })
  }

  static async testSourceAccess(sourceFolder?: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      const folderToTest = sourceFolder || (await this.getSettings()).sourceFolder

      console.log(`Testing access to folder: ${folderToTest}`)

      const isAccessible = await FileUtils.isAccessible(folderToTest)

      if (!isAccessible) {
        return {
          accessible: false,
          error: `Cannot access folder: ${folderToTest}. Please check if the path exists and you have proper permissions.`,
        }
      }

      console.log(`Folder access test successful: ${folderToTest}`)
      return { accessible: true }
    } catch (error) {
      console.error('Error testing folder access:', error)
      return {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while testing folder access',
      }
    }
  }
}

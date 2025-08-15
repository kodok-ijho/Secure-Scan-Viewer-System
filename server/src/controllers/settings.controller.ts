import { Request, Response } from 'express'
import { SettingsService } from '../services/settings.service'

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getSettings()
      res.json(settings)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get settings',
      })
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const settings = await SettingsService.updateSettings(req.body)
      res.json(settings)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to update settings',
      })
    }
  }

  static async testAccess(req: Request, res: Response) {
    try {
      const { sourceFolder } = req.body
      const result = await SettingsService.testSourceAccess(sourceFolder)
      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to test access',
      })
    }
  }
}

import cron from 'node-cron'
import { RetentionService } from '../services/retention.service'

export class RetentionJob {
  private static task: cron.ScheduledTask | null = null

  static start(): void {
    if (this.task) {
      console.log('Retention job is already running')
      return
    }

    // Run every 15 minutes
    this.task = cron.schedule('*/15 * * * *', async () => {
      console.log('Starting scheduled retention cleanup...')
      
      try {
        const result = await RetentionService.cleanupExpiredFiles()
        
        if (result.totalDeleted > 0 || result.errors.length > 0) {
          console.log('Retention cleanup summary:', {
            scanned: result.totalScanned,
            deleted: result.totalDeleted,
            errors: result.errors.length,
          })
        }

        if (result.errors.length > 0) {
          console.error('Retention cleanup errors:', result.errors)
        }
      } catch (error) {
        console.error('Retention job failed:', error)
      }
    }, {
      scheduled: false, // Don't start immediately
    })

    this.task.start()
    console.log('Retention job started - running every 15 minutes')
  }

  static stop(): void {
    if (this.task) {
      this.task.stop()
      this.task = null
      console.log('Retention job stopped')
    }
  }

  static isRunning(): boolean {
    return this.task !== null
  }

  static async runNow(): Promise<void> {
    console.log('Running retention cleanup manually...')
    
    try {
      const result = await RetentionService.cleanupExpiredFiles()
      console.log('Manual retention cleanup completed:', {
        scanned: result.totalScanned,
        deleted: result.totalDeleted,
        errors: result.errors.length,
      })

      if (result.errors.length > 0) {
        console.error('Manual retention cleanup errors:', result.errors)
      }
    } catch (error) {
      console.error('Manual retention cleanup failed:', error)
      throw error
    }
  }
}

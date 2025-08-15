import { createApp } from './app'
import { config } from './config/env'
import { RetentionJob } from './jobs/retention.job'

async function startServer() {
  try {
    console.log('🚀 Starting Secure Scanner Viewer Server...')
    
    // Create Express app
    const app = await createApp()

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`✅ Server running on port ${config.port}`)
      console.log(`📁 Local storage: ${config.localRoot}`)
      console.log(`🌐 CORS origin: ${config.webOrigin}`)
      console.log(`🔒 Environment: ${config.nodeEnv}`)
    })

    // Start retention job
    RetentionJob.start()

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`)
      
      // Stop retention job
      RetentionJob.stop()
      
      // Close server
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })

      // Force close after 10 seconds
      setTimeout(() => {
        console.log('❌ Forced shutdown')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

startServer()

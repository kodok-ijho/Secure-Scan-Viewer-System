import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/env'
import { FileUtils } from './utils/file'

// Import routes
import authRoutes from './routes/auth.routes'
import settingsRoutes from './routes/settings.routes'
import indexingRoutes from './routes/indexing.routes'
import filesRoutes from './routes/files.routes'
import usersRoutes from './routes/users.routes'
import logsRoutes from './routes/logs.routes'

// Error handling middleware
import { errorHandler } from './middleware/error'

export async function createApp() {
  console.log('🔧 Creating Express app...')
  const app = express()

  // Security middleware
  console.log('🛡️ Setting up security middleware...')
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }))

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      // Allow configured web origin
      if (origin === config.webOrigin) return callback(null, true)

      // Allow file:// protocol for debug pages
      if (origin.startsWith('file://')) return callback(null, true)

      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Ensure local storage directory exists
  await FileUtils.ensureDir(config.localRoot)

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    })
  })

  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/index', indexingRoutes)
  app.use('/api/files', filesRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/logs', logsRoutes)

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not found',
      path: req.originalUrl,
    })
  })

  // Error handling middleware (must be last)
  app.use(errorHandler)

  return app
}

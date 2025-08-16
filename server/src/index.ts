import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { cfg } from './config/env';
import { ensureDirs } from './lib/fs-init';
import { initializeDatabase, closeDatabase } from './lib/database';

// Import routes
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import settingsRoutes from './routes/settings';
import usersRoutes from './routes/users';
import indexingRoutes from './routes/indexing';
import logsRoutes from './routes/logs';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = cfg.port;

// Initialize file system paths
ensureDirs();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(globalLimiter);

// Auth-specific rate limiting (more restrictive)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 auth requests per minute
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration with multi-origin support
const allowedOrigins = new Set(cfg.corsOrigins);
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin) return cb(null, true);

    // Allow configured origins
    if (allowedOrigins.has(origin)) return cb(null, true);

    // In development, allow localhost
    if (cfg.nodeEnv !== 'production' && origin.includes('localhost')) {
      return cb(null, true);
    }

    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    ts: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Netlify deployment helper route
app.get('/deploy/netlify', (req, res) => {
  const repo = 'https://github.com/kodok-ijho/Secure-Scan-Viewer-System';
  const base = 'web';
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || req.headers.host || '';
  const backend = host.startsWith('http') ? host : `https://${host}`;
  const url = `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(repo)}&base=${base}#VITE_API_URL=${encodeURIComponent(backend)}`;
  res.redirect(url);
});

// API routes with auth rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/indexing', indexingRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Setup internal cron if enabled
    if (cfg.cronMode === 'internal') {
      const cron = await import('node-cron');
      const { cleanupOldFiles } = await import('../scripts/cleanup');

      // Run cleanup every 15 minutes
      cron.schedule('*/15 * * * *', async () => {
        console.log('🧹 Running scheduled cleanup...');
        try {
          await cleanupOldFiles();
        } catch (error) {
          console.error('❌ Scheduled cleanup failed:', error);
        }
      });

      console.log('⏰ Internal cron scheduler started (every 15 minutes)');
    } else {
      console.log('⏰ External cron mode - cleanup should be handled by Railway Cron');
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Secure Scanner Viewer Server running on port ${PORT}`);
      console.log(`🌐 CORS origins: ${Array.from(allowedOrigins).join(', ') || 'localhost (development)'}`);
      console.log(`🔒 Environment: ${cfg.nodeEnv}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗂️ Cron mode: ${cfg.cronMode}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

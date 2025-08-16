import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { resolvePaths } from './lib/fs-init';
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
const PORT = process.env.PORT || 4000;

// Initialize file system paths
resolvePaths();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration for production
const allowedOrigins = (process.env.WEB_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);
    
    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return cb(null, true);
    }
    
    cb(new Error('Not allowed by CORS'));
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

// API routes
app.use('/api/auth', authRoutes);
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
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Secure Scanner Viewer Server running on port ${PORT}`);
      console.log(`🌐 CORS origins: ${allowedOrigins.join(', ') || 'localhost (development)'}`);
      console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
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

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  jwtSecret: process.env.JWT_SECRET || 'change_this_in_prod',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change_this_in_prod_refresh',
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  localRoot: process.env.LOCAL_ROOT || './storage/local',
  defaultSource: process.env.DEFAULT_SOURCE || '\\\\127.12.23.23\\Folder A\\Folder B',
  retentionDays: parseInt(process.env.RETENTION_DAYS || '7'),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set in environment variables`)
  }
}

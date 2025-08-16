import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test_secret_minimum_32_characters_long';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.LOCAL_STORAGE_PATH = './test-storage';
process.env.RETENTION_DAYS = '1';
process.env.RETENTION_MINUTES = '0';
process.env.CRON_MODE = 'external';

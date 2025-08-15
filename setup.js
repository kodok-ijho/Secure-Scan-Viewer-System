#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Setting up Secure Scanner Viewer System...\n')

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...')
  fs.copyFileSync('.env.example', '.env')
  console.log('✅ .env file created. Please review and update the configuration.\n')
} else {
  console.log('✅ .env file already exists.\n')
}

// Install dependencies
console.log('📦 Installing dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed.\n')
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message)
  process.exit(1)
}

// Setup database
console.log('🗄️ Setting up database...')
try {
  execSync('npm run prisma:generate', { stdio: 'inherit' })
  execSync('npm run prisma:migrate', { stdio: 'inherit' })
  console.log('✅ Database setup complete.\n')
} catch (error) {
  console.error('❌ Failed to setup database:', error.message)
  process.exit(1)
}

// Seed database
console.log('🌱 Seeding database with initial data...')
try {
  execSync('npm run seed', { stdio: 'inherit' })
  console.log('✅ Database seeded with initial data.\n')
} catch (error) {
  console.error('❌ Failed to seed database:', error.message)
  process.exit(1)
}

console.log('🎉 Setup complete!\n')
console.log('📋 Default credentials:')
console.log('   Admin: admin / Admin@123')
console.log('   User:  testuser / Test@123\n')
console.log('🚀 To start the application, run:')
console.log('   npm run dev\n')
console.log('🌐 The application will be available at:')
console.log('   Frontend: http://localhost:5173')
console.log('   Backend:  http://localhost:4000\n')
console.log('📖 For more information, see README.md')

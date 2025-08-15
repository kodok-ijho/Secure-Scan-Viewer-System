const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Secure Scanner Viewer Server...')

// Start backend server
const serverProcess = spawn('npx', ['ts-node', 'src/index.ts'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
})

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error)
})

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📡 Shutting down server...')
  serverProcess.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n📡 Shutting down server...')
  serverProcess.kill('SIGTERM')
  process.exit(0)
})

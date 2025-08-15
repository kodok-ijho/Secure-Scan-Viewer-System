const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Secure Scanner Viewer System...')

// Start Backend Server
console.log('📡 Starting Backend Server...')
const backendProcess = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', 'src/index.ts'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
})

// Start Frontend Server
setTimeout(() => {
  console.log('🌐 Starting Frontend Server...')
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'web'),
    stdio: 'inherit',
    shell: true
  })

  frontendProcess.on('error', (error) => {
    console.error('❌ Frontend error:', error)
  })
}, 3000)

backendProcess.on('error', (error) => {
  console.error('❌ Backend error:', error)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...')
  backendProcess.kill()
  process.exit()
})

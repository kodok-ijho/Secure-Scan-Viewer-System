const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Backend Server...')

const serverProcess = spawn('npx', ['ts-node', 'src/index.ts'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
})

serverProcess.on('error', (error) => {
  console.error('❌ Server error:', error)
})

serverProcess.on('close', (code) => {
  console.log(`Server exited with code ${code}`)
})

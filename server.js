const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const mime = require('mime-types')

// Load environment variables
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './storage'
const DEFAULT_SOURCE_FOLDER = process.env.DEFAULT_SOURCE_FOLDER || './source-files'
const DEFAULT_RETENTION_DAYS = parseInt(process.env.DEFAULT_RETENTION_DAYS) || 7

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow configured origins
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim())
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

// Create storage directory if it doesn't exist
if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
  fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true })
  console.log(`📁 Created storage directory: ${LOCAL_STORAGE_PATH}`)
}

// Settings file path
const SETTINGS_FILE = path.join(__dirname, 'settings.json')

// Default settings
const DEFAULT_SETTINGS = {
  sourceFolder: DEFAULT_SOURCE_FOLDER,
  retentionDays: DEFAULT_RETENTION_DAYS,
  lastIndexingAt: null,
  lastIndexingMode: null
}

// Load settings from file or use defaults
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (error) {
    console.warn('Failed to load settings file, using defaults:', error.message)
  }
  return { ...DEFAULT_SETTINGS }
}

// Save settings to file
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    console.log('Settings saved to file')
  } catch (error) {
    console.error('Failed to save settings file:', error.message)
  }
}

// Current settings in memory
let currentSettings = loadSettings()

// In-memory log storage
let logs = []
let logIdCounter = 1

// In-memory users storage with environment-based admin user
let users = [
  {
    id: 'user_admin_001',
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_dhaniy_002',
    username: 'dhaniy',
    password: '123456',
    role: 'USER',
    createdAt: new Date().toISOString()
  }
]
let userIdCounter = 3

// Helper function to generate log ID
function generateLogId() {
  return `log_${logIdCounter++}_${Date.now()}`
}

// Helper function to extract owner from filename
function extractOwnerFromFilename(filename) {
  const parts = filename.split('_')
  if (parts.length >= 2) {
    return parts[0]
  }
  return null
}

// Helper function to create a log entry
function createLogEntry(filename, action, sourcePath = null, localPath = null, actorUsername = 'admin') {
  const logEntry = {
    id: generateLogId(),
    filename,
    sourcePath,
    localPath: localPath || path.join(getTargetDirectory(currentSettings.sourceFolder), filename),
    action,
    actorUsername,
    createdAt: new Date().toISOString()
  }

  logs.unshift(logEntry) // Add to beginning for newest first
  console.log(`📝 Log created: ${action} - ${filename}`)
  return logEntry
}

// Helper function to get target directory
function getTargetDirectory(sourceFolder) {
  return LOCAL_STORAGE_PATH
}

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  // Support query parameter tokens for file operations
  if (!token && req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = users.find(u => u.username === decoded.username)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Token verification failed:', error.message)
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = users.find(u => u.username === username && u.password === password)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  })
})

// File management endpoints
app.get('/api/files', authenticateToken, (req, res) => {
  try {
    const targetDir = getTargetDirectory(currentSettings.sourceFolder)

    if (!fs.existsSync(targetDir)) {
      return res.json([])
    }

    const files = fs.readdirSync(targetDir)
    const fileInfos = files.map(filename => {
      const filePath = path.join(targetDir, filename)
      const stats = fs.statSync(filePath)
      const owner = extractOwnerFromFilename(filename)

      return {
        name: filename,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        owner: owner || 'Unassigned (Admin only)',
        type: path.extname(filename).toLowerCase()
      }
    })

    // Filter files based on user role
    let filteredFiles = fileInfos
    if (req.user.role === 'USER') {
      filteredFiles = fileInfos.filter(file => {
        return file.name.startsWith(req.user.username + '_')
      })
    }

    res.json(filteredFiles)
  } catch (error) {
    console.error('Error listing files:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
})

// Stream file for preview
app.get('/api/files/:filename/stream', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename
    const targetDir = getTargetDirectory(currentSettings.sourceFolder)
    const filePath = path.join(targetDir, filename)

    // Check if user has access to this file
    if (req.user.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream'
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', 'public, max-age=3600')

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error streaming file:', error)
    res.status(500).json({ error: 'Failed to stream file' })
  }
})

// Download file
app.get('/api/files/:filename/download', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename
    const targetDir = getTargetDirectory(currentSettings.sourceFolder)
    const filePath = path.join(targetDir, filename)

    // Check if user has access to this file
    if (req.user.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream'
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// Delete file
app.delete('/api/files/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename
    const targetDir = getTargetDirectory(currentSettings.sourceFolder)
    const filePath = path.join(targetDir, filename)

    // Check if user has access to this file
    if (req.user.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    fs.unlinkSync(filePath)

    // Create log entry
    createLogEntry(filename, 'Manual Deleted', null, filePath, req.user.username)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// Settings endpoints (Admin only)
app.get('/api/settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  res.json(currentSettings)
})

app.put('/api/settings', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { sourceFolder, retentionDays } = req.body

    if (sourceFolder) currentSettings.sourceFolder = sourceFolder
    if (retentionDays) currentSettings.retentionDays = parseInt(retentionDays)

    saveSettings(currentSettings)
    res.json(currentSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Users endpoints (Admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const safeUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt
  }))

  res.json(safeUsers)
})

app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' })
    }

    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const newUser = {
      id: `user_${username}_${userIdCounter++}`,
      username,
      password,
      role,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    const safeUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt
    }

    res.status(201).json(safeUser)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Logs endpoints (Admin only)
app.get('/api/logs', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const { search, action } = req.query
  let filteredLogs = [...logs]

  if (search) {
    filteredLogs = filteredLogs.filter(log =>
      log.filename.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (action && action !== 'All Actions') {
    filteredLogs = filteredLogs.filter(log => log.action === action)
  }

  res.json(filteredLogs)
})

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const targetDir = getTargetDirectory(currentSettings.sourceFolder)
    let totalFiles = 0
    let totalSize = 0
    let userFiles = 0
    let userSize = 0

    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir)

      files.forEach(filename => {
        const filePath = path.join(targetDir, filename)
        const stats = fs.statSync(filePath)

        totalFiles++
        totalSize += stats.size

        // Count user-specific files
        if (req.user.role === 'USER' && filename.startsWith(req.user.username + '_')) {
          userFiles++
          userSize += stats.size
        }
      })
    }

    const recentLogs = logs.slice(0, 10)
    const last24hLogs = logs.filter(log => {
      const logTime = new Date(log.createdAt)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logTime > yesterday
    })

    const stats = {
      totalFiles: req.user.role === 'ADMIN' ? totalFiles : userFiles,
      totalSize: req.user.role === 'ADMIN' ? totalSize : userSize,
      recentActivity: last24hLogs.length,
      retentionDays: currentSettings.retentionDays,
      lastIndexing: currentSettings.lastIndexingAt,
      indexingMode: currentSettings.lastIndexingMode,
      sourceFolder: req.user.role === 'ADMIN' ? currentSettings.sourceFolder : null,
      recentLogs: req.user.role === 'ADMIN' ? recentLogs : recentLogs.filter(log =>
        log.filename.startsWith(req.user.username + '_')
      )
    }

    res.json(stats)
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
})

// Indexing endpoints (Admin only)
app.post('/api/indexing/run', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { mode } = req.body // 'COPY' or 'MOVE'
    const sourceFolder = currentSettings.sourceFolder
    const targetDir = getTargetDirectory(sourceFolder)

    if (!fs.existsSync(sourceFolder)) {
      return res.status(400).json({ error: 'Source folder does not exist' })
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const sourceFiles = fs.readdirSync(sourceFolder)
    const results = {
      processed: 0,
      copied: 0,
      moved: 0,
      errors: [],
      files: []
    }

    sourceFiles.forEach(filename => {
      try {
        const sourcePath = path.join(sourceFolder, filename)
        const targetPath = path.join(targetDir, filename)
        const stats = fs.statSync(sourcePath)

        if (stats.isFile()) {
          results.processed++

          // Check if file already exists and create unique name if needed
          let finalTargetPath = targetPath
          let counter = 1
          while (fs.existsSync(finalTargetPath)) {
            const ext = path.extname(filename)
            const name = path.basename(filename, ext)
            finalTargetPath = path.join(targetDir, `${name}(${counter})${ext}`)
            counter++
          }

          if (mode === 'COPY') {
            fs.copyFileSync(sourcePath, finalTargetPath)
            results.copied++
            createLogEntry(path.basename(finalTargetPath), 'Copied', sourcePath, finalTargetPath, req.user.username)
          } else if (mode === 'MOVE') {
            fs.renameSync(sourcePath, finalTargetPath)
            results.moved++
            createLogEntry(path.basename(finalTargetPath), 'Moved', sourcePath, finalTargetPath, req.user.username)
          }

          results.files.push({
            original: filename,
            final: path.basename(finalTargetPath),
            size: stats.size,
            action: mode.toLowerCase()
          })
        }
      } catch (error) {
        results.errors.push({
          filename,
          error: error.message
        })
      }
    })

    // Update settings
    currentSettings.lastIndexingAt = new Date().toISOString()
    currentSettings.lastIndexingMode = mode
    saveSettings(currentSettings)

    res.json({
      success: true,
      mode,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error running indexing:', error)
    res.status(500).json({ error: 'Failed to run indexing' })
  }
})

// Test source folder access
app.post('/api/settings/test-access', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { folderPath } = req.body

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' })
    }

    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({
        success: false,
        error: 'Folder does not exist'
      })
    }

    const stats = fs.statSync(folderPath)
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: 'Path is not a directory'
      })
    }

    // Try to read the directory
    const files = fs.readdirSync(folderPath)

    res.json({
      success: true,
      message: 'Folder access successful',
      fileCount: files.length,
      path: folderPath
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Access denied: ${error.message}`
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure Scanner Viewer Server running on port ${PORT}`)
  console.log(`📁 Storage directory: ${LOCAL_STORAGE_PATH}`)
  console.log(`🌐 CORS origin: ${CORS_ORIGIN}`)
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app

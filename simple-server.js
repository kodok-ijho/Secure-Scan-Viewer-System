const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = 4000

// Enable CORS for all origins
app.use(cors())
app.use(express.json())

// In-memory settings storage with persistence to JSON file
const SETTINGS_FILE = path.join(__dirname, 'settings.json')

// Default settings
const DEFAULT_SETTINGS = {
  sourceFolder: 'C:\\Users\\dhaniy\\Pictures\\Screenshots\\TestFolder',
  retentionDays: 7,
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

// In-memory users storage
let users = [
  {
    id: 'user_admin_001',
    username: 'admin',
    password: 'Admin@123', // Store password for authentication
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_dhaniy_002',
    username: 'dhaniy',
    password: '123456', // Correct password for dhaniy user
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

  // Keep only last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000)
  }

  return logEntry
}

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body

  console.log('Login attempt:', username)

  // Find user by username
  const user = users.find(u => u.username === username)

  if (!user) {
    console.log('User not found:', username)
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Check password
  if (user.password !== password) {
    console.log('Invalid password for user:', username)
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  console.log('Login successful for user:', username)
  res.json({
    accessToken: `token-${user.id}-${Date.now()}`,
    user: { id: user.id, username: user.username, role: user.role }
  })
})

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  // For file streaming and download, also check query parameter
  if (!token && req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  // Simple token validation - extract user ID from token
  const tokenMatch = token.match(/^token-(.+)-\d+$/)
  if (!tokenMatch) {
    return res.status(401).json({ error: 'Invalid token format' })
  }

  const userId = tokenMatch[1]
  const user = users.find(u => u.id === userId)

  if (!user) {
    return res.status(401).json({ error: 'Invalid token - user not found' })
  }

  // Add user info to request
  req.user = {
    id: user.id,
    username: user.username,
    role: user.role
  }

  next()
}

// Helper function to get target directory from source folder
function getTargetDirectory(sourceFolder) {
  // Extract the last folder name from the source path
  const folderName = path.basename(sourceFolder)
  return path.join(__dirname, 'server/storage/local', folderName)
}

// Simple files list endpoint with role-based filtering
app.get('/api/files', authenticateToken, (req, res) => {
  const settings = loadSettings()
  const filesDir = getTargetDirectory(settings.sourceFolder)
  const user = req.user

  console.log(`Listing files from: ${filesDir} for user: ${user.username} (${user.role})`)

  if (!fs.existsSync(filesDir)) {
    console.log('Files directory not found:', filesDir)
    return res.json([])
  }

  try {
    const files = fs.readdirSync(filesDir)
    const fileInfos = files.map(filename => {
      const filePath = path.join(filesDir, filename)
      const stats = fs.statSync(filePath)
      const ext = path.extname(filename).toLowerCase()

      return {
        name: filename,
        size: stats.size,
        ext: ext,
        modifiedAt: stats.mtime.toISOString(),
        owner: extractOwnerFromFilename(filename),
        fullPathHidden: true
      }
    })

    // Apply role-based filtering
    let filteredFiles = fileInfos
    if (user.role === 'USER') {
      // Regular users only see files that start with their username followed by underscore
      filteredFiles = fileInfos.filter(file => {
        return file.name.startsWith(user.username + '_')
      })
      console.log(`Filtered ${fileInfos.length} files to ${filteredFiles.length} for user ${user.username}`)
    } else if (user.role === 'ADMIN') {
      // Admin users see all files
      console.log(`Admin user ${user.username} sees all ${fileInfos.length} files`)
    }

    console.log(`Returning ${filteredFiles.length} files for user ${user.username}`)
    res.json(filteredFiles)
  } catch (error) {
    console.error('Error reading files:', error)
    res.status(500).json({ error: 'Failed to read files' })
  }
})

// Simple settings endpoints
app.get('/api/settings', (req, res) => {
  console.log('Getting settings')
  const settings = loadSettings()
  res.json(settings)
})

app.patch('/api/settings', (req, res) => {
  console.log('Updating settings:', req.body)

  const { sourceFolder, retentionDays } = req.body

  // Validate input
  if (sourceFolder && typeof sourceFolder !== 'string') {
    return res.status(400).json({ error: 'Invalid sourceFolder' })
  }

  if (retentionDays && (typeof retentionDays !== 'number' || retentionDays < 1 || retentionDays > 365)) {
    return res.status(400).json({ error: 'Invalid retentionDays (must be 1-365)' })
  }

  // Load current settings and update with new values
  const settings = loadSettings()

  if (sourceFolder !== undefined) {
    settings.sourceFolder = sourceFolder
  }

  if (retentionDays !== undefined) {
    settings.retentionDays = retentionDays
  }

  // Save updated settings to file and memory
  saveSettings(settings)
  currentSettings = settings

  console.log('Settings updated and saved:', settings)
  res.json(settings)
})

app.post('/api/settings/test-access', (req, res) => {
  console.log('Testing folder access:', req.body)

  const { sourceFolder } = req.body
  const settings = loadSettings()
  const folderToTest = sourceFolder || settings.sourceFolder

  if (!folderToTest) {
    return res.status(400).json({ error: 'sourceFolder is required' })
  }

  // Test if folder exists and is accessible
  try {
    if (fs.existsSync(folderToTest)) {
      // Try to read the directory
      fs.readdirSync(folderToTest)
      res.json({ accessible: true })
    } else {
      res.json({ accessible: false, error: 'Folder does not exist' })
    }
  } catch (error) {
    console.error('Access test error:', error)
    res.json({ accessible: false, error: 'Access denied or invalid path' })
  }
})

// Indexing endpoint
app.post('/api/index', (req, res) => {
  console.log('Starting indexing operation:', req.body)

  const { mode } = req.body

  if (!mode || !['COPY', 'MOVE'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be COPY or MOVE' })
  }

  const settings = loadSettings()
  const sourceFolder = settings.sourceFolder
  const targetDir = getTargetDirectory(sourceFolder)

  console.log(`Indexing mode: ${mode}`)
  console.log(`Source folder: ${sourceFolder}`)
  console.log(`Target directory: ${targetDir}`)

  // Validate source folder access
  if (!fs.existsSync(sourceFolder)) {
    return res.status(400).json({ error: `Source folder not found: ${sourceFolder}` })
  }

  try {
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
      console.log(`Created target directory: ${targetDir}`)
    }

    // Read files from source directory
    const entries = fs.readdirSync(sourceFolder, { withFileTypes: true })
    const files = entries.filter(entry => entry.isFile())

    const result = {
      totalFound: files.length,
      totalProcessed: 0,
      skipped: 0,
      targetDir: targetDir,
      errors: []
    }

    console.log(`Found ${files.length} files in source folder`)

    // Process each file
    for (const file of files) {
      try {
        const sourcePath = path.join(sourceFolder, file.name)
        const targetPath = path.join(targetDir, file.name)

        console.log(`Processing file: ${file.name}`)

        // Check if file already exists in target
        if (fs.existsSync(targetPath)) {
          console.log(`File already exists, replacing: ${file.name}`)
          fs.unlinkSync(targetPath)
        }

        // Copy or move the file
        if (mode === 'COPY') {
          fs.copyFileSync(sourcePath, targetPath)
          console.log(`Copied: ${file.name}`)
          // Create log entry for copy
          createLogEntry(file.name, 'COPIED', sourcePath, targetPath)
        } else {
          fs.renameSync(sourcePath, targetPath)
          console.log(`Moved: ${file.name}`)
          // Create log entry for move
          createLogEntry(file.name, 'MOVED', sourcePath, targetPath)
        }

        result.totalProcessed++
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        result.skipped++
        result.errors.push(`${file.name}: ${error.message}`)
      }
    }

    // Update settings with indexing info
    settings.lastIndexingAt = new Date().toISOString()
    settings.lastIndexingMode = mode
    saveSettings(settings)
    currentSettings = settings

    console.log(`Indexing completed. Processed: ${result.totalProcessed}, Skipped: ${result.skipped}`)
    res.json(result)

  } catch (error) {
    console.error('Indexing failed:', error)
    res.status(500).json({ error: `Indexing failed: ${error.message}` })
  }
})

// Simple file stream endpoint with access control
app.get('/api/files/:filename/stream', authenticateToken, (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const user = req.user
  const settings = loadSettings()
  const targetDir = getTargetDirectory(settings.sourceFolder)
  const filePath = path.join(targetDir, filename)

  console.log(`Streaming file: ${filePath} for user: ${user.username} (${user.role})`)

  // Check if user has access to this file
  if (user.role === 'USER' && !filename.startsWith(user.username + '_')) {
    console.log(`Access denied: User ${user.username} cannot access file ${filename}`)
    return res.status(403).json({ error: 'Access denied' })
  }

  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath)
    return res.status(404).json({ error: 'File not found' })
  }

  try {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'

    // Set appropriate content type (same as download endpoint for consistency)
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.txt') contentType = 'text/plain'
    else if (ext === '.csv') contentType = 'text/csv'
    else if (ext === '.json') contentType = 'application/json'
    else if (ext === '.xml') contentType = 'application/xml'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'private, max-age=3600')

    const stream = fs.createReadStream(filePath)

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' })
      }
    })

    stream.pipe(res)
  } catch (error) {
    console.error('Error streaming file:', error)
    res.status(500).json({ error: 'Failed to stream file' })
  }
})

// Simple file download endpoint with access control
app.get('/api/files/:filename/download', authenticateToken, (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const user = req.user
  const settings = loadSettings()
  const targetDir = getTargetDirectory(settings.sourceFolder)
  const filePath = path.join(targetDir, filename)

  console.log(`Downloading file: ${filePath} for user: ${user.username} (${user.role})`)

  // Check if user has access to this file
  if (user.role === 'USER' && !filename.startsWith(user.username + '_')) {
    console.log(`Access denied: User ${user.username} cannot download file ${filename}`)
    return res.status(403).json({ error: 'Access denied' })
  }

  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath)
    return res.status(404).json({ error: 'File not found' })
  }

  try {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'

    // Set appropriate content type
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.txt') contentType = 'text/plain'
    else if (ext === '.csv') contentType = 'text/csv'
    else if (ext === '.json') contentType = 'application/json'
    else if (ext === '.xml') contentType = 'application/xml'

    // Set headers for download
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

    console.log(`Serving download: ${filename} (${stats.size} bytes, ${contentType})`)

    // Create log entry for download (we'll log it as an access/download action)
    // Note: Using 'COPIED' as the closest action type for downloads since there's no specific download action
    createLogEntry(filename, 'COPIED', null, filePath)

    const stream = fs.createReadStream(filePath)

    stream.on('error', (error) => {
      console.error('Download stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' })
      }
    })

    stream.pipe(res)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// Simple file delete endpoint with access control
app.delete('/api/files/:filename', authenticateToken, (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const user = req.user
  const settings = loadSettings()
  const targetDir = getTargetDirectory(settings.sourceFolder)
  const filePath = path.join(targetDir, filename)

  console.log(`Deleting file: ${filePath} for user: ${user.username} (${user.role})`)

  // Check if user has access to this file
  if (user.role === 'USER' && !filename.startsWith(user.username + '_')) {
    console.log(`Access denied: User ${user.username} cannot delete file ${filename}`)
    return res.status(403).json({ error: 'Access denied' })
  }

  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath)
    return res.status(404).json({ error: 'File not found' })
  }

  try {
    // Delete the file
    fs.unlinkSync(filePath)
    console.log(`Successfully deleted file: ${filename}`)

    // Create log entry
    createLogEntry(filename, 'DELETED_MANUAL', null, filePath)

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

// Simple delete all files endpoint
app.delete('/api/files', (req, res) => {
  const settings = loadSettings()
  const targetDir = getTargetDirectory(settings.sourceFolder)

  console.log('Deleting all files from:', targetDir)

  if (!fs.existsSync(targetDir)) {
    console.log('Files directory not found:', targetDir)
    return res.json({
      message: 'No files to delete',
      deletedCount: 0,
      errors: []
    })
  }

  try {
    const files = fs.readdirSync(targetDir)
    const result = {
      deletedCount: 0,
      errors: []
    }

    console.log(`Found ${files.length} files to delete`)

    for (const filename of files) {
      try {
        const filePath = path.join(targetDir, filename)
        const stats = fs.statSync(filePath)

        // Only delete files, not directories
        if (stats.isFile()) {
          fs.unlinkSync(filePath)
          result.deletedCount++
          console.log(`Deleted file: ${filename}`)

          // Create log entry for each deleted file
          createLogEntry(filename, 'DELETED_MANUAL', null, filePath)
        }
      } catch (error) {
        const errorMsg = `Failed to delete ${filename}: ${error.message}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    const message = `Successfully deleted ${result.deletedCount} files`
    console.log(message)

    res.json({
      message,
      deletedCount: result.deletedCount,
      errors: result.errors
    })
  } catch (error) {
    console.error('Error deleting files:', error)
    res.status(500).json({ error: 'Failed to delete files' })
  }
})

// Simple logs list endpoint
app.get('/api/logs', (req, res) => {
  console.log('Getting logs with query:', req.query)

  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const action = req.query.action
  const filename = req.query.filename

  // Filter logs
  let filteredLogs = logs

  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action === action)
  }

  if (filename) {
    filteredLogs = filteredLogs.filter(log =>
      log.filename.toLowerCase().includes(filename.toLowerCase())
    )
  }

  // Pagination
  const total = filteredLogs.length
  const totalPages = Math.ceil(total / limit)
  const skip = (page - 1) * limit
  const paginatedLogs = filteredLogs.slice(skip, skip + limit)

  console.log(`Returning ${paginatedLogs.length} logs (page ${page}/${totalPages}, total: ${total})`)

  res.json({
    logs: paginatedLogs,
    total,
    page,
    limit,
    totalPages
  })
})

// Simple logs stats endpoint
app.get('/api/logs/stats', (req, res) => {
  console.log('Getting log stats')

  const totalLogs = logs.length

  // Count actions
  const actionCounts = {
    'COPIED': 0,
    'MOVED': 0,
    'DELETED_RETENTION': 0,
    'DELETED_MANUAL': 0
  }

  logs.forEach(log => {
    if (actionCounts.hasOwnProperty(log.action)) {
      actionCounts[log.action]++
    }
  })

  // Count recent activity (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const recentActivity = logs.filter(log =>
    new Date(log.createdAt) >= yesterday
  ).length

  const stats = {
    totalLogs,
    actionCounts,
    recentActivity
  }

  console.log('Log stats:', stats)
  res.json(stats)
})

// Simple logs get by ID endpoint
app.get('/api/logs/:id', (req, res) => {
  const logId = req.params.id
  console.log('Getting log by ID:', logId)

  const log = logs.find(l => l.id === logId)

  if (!log) {
    console.log('Log not found:', logId)
    return res.status(404).json({ error: 'Log not found' })
  }

  res.json(log)
})

// User management endpoints

// List all users
app.get('/api/users', (req, res) => {
  console.log('Getting users list')
  res.json(users)
})

// Create a new user
app.post('/api/users', (req, res) => {
  console.log('Creating user:', req.body)

  const { username, password, role } = req.body

  // Validate input
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' })
  }

  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or USER' })
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' })
  }

  // Create new user
  const newUser = {
    id: `user_${userIdCounter++}_${Date.now()}`,
    username,
    password, // Store password for authentication
    role,
    createdAt: new Date().toISOString()
  }

  users.push(newUser)

  console.log('User created successfully:', newUser.username)

  // Return user without password for security
  const { password: _, ...userResponse } = newUser
  res.status(201).json(userResponse)
})

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id
  console.log('Getting user by ID:', userId)

  const user = users.find(u => u.id === userId)

  if (!user) {
    console.log('User not found:', userId)
    return res.status(404).json({ error: 'User not found' })
  }

  // Return user without password for security
  const { password: _, ...userResponse } = user
  res.json(userResponse)
})

// Update user details (PATCH /api/users/:id)
app.patch('/api/users/:id', (req, res) => {
  const userId = req.params.id
  const { username, role } = req.body

  console.log('Updating user:', userId, { username, role })

  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  const user = users[userIndex]

  // Validate username if provided
  if (username !== undefined) {
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' })
    }

    // Check if username already exists (excluding current user)
    const existingUser = users.find(u => u.username === username.trim() && u.id !== userId)
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    user.username = username.trim()
  }

  // Validate role if provided
  if (role !== undefined) {
    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or USER' })
    }

    // Prevent removing the last admin
    if (user.role === 'ADMIN' && role === 'USER') {
      const adminCount = users.filter(u => u.role === 'ADMIN').length
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin user' })
      }
    }

    user.role = role
  }

  user.updatedAt = new Date().toISOString()

  console.log('User updated successfully:', user.username)

  // Return user without password for security
  const { password: _, ...userResponse } = user
  res.json(userResponse)
})

// Change user password (PATCH /api/users/:id/password)
app.patch('/api/users/:id/password', (req, res) => {
  const userId = req.params.id
  const { password } = req.body

  console.log('Changing password for user:', userId)

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  users[userIndex].password = password
  users[userIndex].updatedAt = new Date().toISOString()

  console.log('Password changed successfully for user:', users[userIndex].username)
  res.json({ message: 'Password changed successfully' })
})



// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id
  console.log('Deleting user:', userId)

  const userIndex = users.findIndex(u => u.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  const user = users[userIndex]

  // Prevent deletion of the last admin
  if (user.role === 'ADMIN') {
    const adminCount = users.filter(u => u.role === 'ADMIN').length
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' })
    }
  }

  users.splice(userIndex, 1)

  console.log('User deleted successfully:', user.username)
  res.json({ message: 'User deleted successfully' })
})

// File assignment endpoints (Admin only)

// Assign file to user
app.patch('/api/files/:filename/assign', authenticateToken, (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const { userId } = req.body
  const user = req.user

  console.log(`Assigning file: ${filename} to user: ${userId} by: ${user.username} (${user.role})`)

  // Only admins can assign files
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can assign files' })
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  // Find the target user
  const targetUser = users.find(u => u.id === userId)
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  // For simple server, we'll just return success
  // In real implementation, this would update the file assignment in database
  console.log(`File ${filename} assigned to user ${targetUser.username}`)
  res.json({
    message: 'File assigned successfully',
    filename,
    assignedTo: targetUser.username
  })
})

// Unassign file
app.patch('/api/files/:filename/unassign', authenticateToken, (req, res) => {
  const filename = decodeURIComponent(req.params.filename)
  const user = req.user

  console.log(`Unassigning file: ${filename} by: ${user.username} (${user.role})`)

  // Only admins can unassign files
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can unassign files' })
  }

  // For simple server, we'll just return success
  console.log(`File ${filename} unassigned`)
  res.json({
    message: 'File unassigned successfully',
    filename
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path })
})

app.listen(PORT, () => {
  console.log(`✅ Simple test server running on port ${PORT}`)
  console.log(`📁 Settings file: ${SETTINGS_FILE}`)
  console.log(`📂 Current source folder: ${currentSettings.sourceFolder}`)
  console.log(`📁 Current target directory: ${getTargetDirectory(currentSettings.sourceFolder)}`)
  console.log(`🌐 Test at: http://localhost:${PORT}/api/health`)
})

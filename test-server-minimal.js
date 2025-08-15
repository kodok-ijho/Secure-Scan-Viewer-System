const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = 4000

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow localhost for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('file://')) {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

// JWT Secret
const JWT_SECRET = 'test-secret-key'

// Mock users
const users = [
  { id: '1', username: 'admin', password: 'Admin@123', role: 'ADMIN' },
  { id: '2', username: 'testuser', password: 'Test@123', role: 'USER' }
]

// Mock files directory
const FILES_DIR = path.join(__dirname, '../storage/local/TestFolder')

// Auth middleware
const authenticate = (req, res, next) => {
  try {
    // Try to get token from Authorization header first
    let token
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (req.query.token) {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({
    accessToken: token,
    user: { id: user.id, username: user.username, role: user.role }
  })
})

// List files
app.get('/api/files', authenticate, (req, res) => {
  try {
    if (!fs.existsSync(FILES_DIR)) {
      return res.json([])
    }

    const files = fs.readdirSync(FILES_DIR).map(filename => {
      const filePath = path.join(FILES_DIR, filename)
      const stats = fs.statSync(filePath)
      
      return {
        name: filename,
        size: stats.size,
        owner: 'test',
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    })

    res.json(files)
  } catch (error) {
    console.error('Error listing files:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
})

// Stream file
app.get('/api/files/:filename/stream', authenticate, (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    const filePath = path.join(FILES_DIR, filename)
    
    console.log('Streaming file:', filePath)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const stats = fs.statSync(filePath)
    const ext = path.extname(filename).toLowerCase()
    
    // Set appropriate content type
    let contentType = 'application/octet-stream'
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.txt') contentType = 'text/plain'
    else if (ext === '.csv') contentType = 'text/csv'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (error) {
    console.error('Error streaming file:', error)
    res.status(500).json({ error: 'Failed to stream file' })
  }
})

// Download file
app.get('/api/files/:filename/download', authenticate, (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    const filePath = path.join(FILES_DIR, filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path })
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`)
  console.log(`📁 Files directory: ${FILES_DIR}`)
  console.log(`🌐 CORS enabled for all origins`)
})

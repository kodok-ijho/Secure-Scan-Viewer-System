const http = require('http')

// First, let's get a valid token by logging in
const loginData = JSON.stringify({
  username: 'admin',
  password: 'Admin@123'
})

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}

console.log('Logging in...')
const loginReq = http.request(loginOptions, (res) => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data)
      const token = response.accessToken
      console.log('Login successful')
      
      // Now test the files list endpoint
      testFilesList(token)
    } else {
      console.error('Login failed:', data)
    }
  })
})

loginReq.on('error', (e) => {
  console.error(`Login error: ${e.message}`)
})

loginReq.write(loginData)
loginReq.end()

function testFilesList(token) {
  // Test files list
  const filesOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/files',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  console.log('Getting files list...')
  const filesReq = http.request(filesOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log(`Files Status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        const files = JSON.parse(data)
        console.log(`Found ${files.length} files:`)
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.size} bytes, owner: ${file.owner})`)
        })
        
        // Test stream for first PNG file found
        const pngFile = files.find(f => f.name.toLowerCase().endsWith('.png'))
        if (pngFile) {
          console.log(`\nTesting stream for: ${pngFile.name}`)
          testStreamEndpoint(token, pngFile.name)
        } else {
          console.log('\nNo PNG files found in the list')
        }
      } else {
        console.log('Files list failed:', data)
      }
    })
  })

  filesReq.on('error', (e) => {
    console.error(`Files error: ${e.message}`)
  })

  filesReq.end()
}

function testStreamEndpoint(token, filename) {
  // Test stream with token in query parameter
  const streamOptions = {
    hostname: 'localhost',
    port: 4000,
    path: `/api/files/${encodeURIComponent(filename)}/stream?token=${encodeURIComponent(token)}`,
    method: 'GET'
  }

  console.log(`Testing stream endpoint for: ${filename}`)
  const streamReq = http.request(streamOptions, (res) => {
    console.log(`Stream Status: ${res.statusCode}`)
    
    let dataLength = 0
    res.on('data', (chunk) => {
      dataLength += chunk.length
    })
    
    res.on('end', () => {
      console.log(`Stream Response Length: ${dataLength} bytes`)
      if (res.statusCode === 200) {
        console.log('✅ Stream endpoint working correctly!')
      } else {
        console.log('❌ Stream endpoint failed')
      }
    })
  })

  streamReq.on('error', (e) => {
    console.error(`Stream error: ${e.message}`)
  })

  streamReq.end()
}

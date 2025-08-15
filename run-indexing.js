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
      
      // Run indexing
      runIndexing(token)
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

function runIndexing(token) {
  const indexingData = JSON.stringify({
    mode: 'COPY'
  })

  const indexingOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/index',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(indexingData)
    }
  }

  console.log('Running indexing...')
  const indexingReq = http.request(indexingOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log(`Indexing Status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        const response = JSON.parse(data)
        console.log('Indexing started:', response)
        
        // Wait a bit then check files again
        setTimeout(() => {
          checkFilesAgain(token)
        }, 3000)
      } else {
        console.log('Indexing failed:', data)
      }
    })
  })

  indexingReq.on('error', (e) => {
    console.error(`Indexing error: ${e.message}`)
  })

  indexingReq.write(indexingData)
  indexingReq.end()
}

function checkFilesAgain(token) {
  const filesOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/files',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  console.log('\nChecking files after indexing...')
  const filesReq = http.request(filesOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const files = JSON.parse(data)
        console.log(`Found ${files.length} files:`)
        
        const newFiles = files.filter(f => f.name.includes('test_valid'))
        if (newFiles.length > 0) {
          console.log('\nNew test files found:')
          newFiles.forEach(file => {
            console.log(`  ✅ ${file.name} (${file.size} bytes)`)
          })
          
          // Test stream for new PNG file
          const newPngFile = newFiles.find(f => f.name.endsWith('.png'))
          if (newPngFile) {
            testStreamEndpoint(token, newPngFile.name)
          }
        } else {
          console.log('\n❌ New test files not found yet')
        }
      }
    })
  })

  filesReq.end()
}

function testStreamEndpoint(token, filename) {
  const streamOptions = {
    hostname: 'localhost',
    port: 4000,
    path: `/api/files/${encodeURIComponent(filename)}/stream?token=${encodeURIComponent(token)}`,
    method: 'GET'
  }

  console.log(`\nTesting stream for new file: ${filename}`)
  const streamReq = http.request(streamOptions, (res) => {
    console.log(`Stream Status: ${res.statusCode}`)
    
    let dataLength = 0
    res.on('data', (chunk) => {
      dataLength += chunk.length
    })
    
    res.on('end', () => {
      console.log(`Stream Response Length: ${dataLength} bytes`)
      if (res.statusCode === 200) {
        console.log('✅ New PNG file stream working correctly!')
      } else {
        console.log('❌ New PNG file stream failed')
      }
    })
  })

  streamReq.end()
}

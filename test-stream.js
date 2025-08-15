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
      console.log('Login successful, token:', token.substring(0, 20) + '...')
      
      // Now test the stream endpoint
      testStreamEndpoint(token)
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

function testStreamEndpoint(token) {
  // Test stream with token in query parameter
  const streamOptions = {
    hostname: 'localhost',
    port: 4000,
    path: `/api/files/test_valid.png/stream?token=${encodeURIComponent(token)}`,
    method: 'GET'
  }

  console.log('Testing stream endpoint...')
  const streamReq = http.request(streamOptions, (res) => {
    console.log(`Stream Status: ${res.statusCode}`)
    console.log(`Stream Headers:`, res.headers)
    
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

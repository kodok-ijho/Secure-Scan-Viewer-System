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
      
      // Check settings
      checkSettings(token)
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

function checkSettings(token) {
  const settingsOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/settings',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  console.log('Getting settings...')
  const settingsReq = http.request(settingsOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log(`Settings Status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        const settings = JSON.parse(data)
        console.log('Current settings:')
        console.log(`  Source Folder: ${settings.sourceFolder}`)
        console.log(`  Target Folder: ${settings.targetFolder}`)
        console.log(`  Retention Days: ${settings.retentionDays}`)
        
        if (settings.sourceFolder !== 'C:\\temp\\test-source') {
          console.log('\n⚠️  Source folder is not set to C:\\temp\\test-source')
          console.log('Updating source folder...')
          updateSettings(token)
        } else {
          console.log('\n✅ Source folder is correct')
          runIndexingAgain(token)
        }
      } else {
        console.log('Settings failed:', data)
      }
    })
  })

  settingsReq.end()
}

function updateSettings(token) {
  const settingsData = JSON.stringify({
    sourceFolder: 'C:\\temp\\test-source',
    targetFolder: 'storage\\local\\TestFolder',
    retentionDays: 30
  })

  const updateOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/settings',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(settingsData)
    }
  }

  console.log('Updating settings...')
  const updateReq = http.request(updateOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log(`Update Status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        console.log('✅ Settings updated successfully')
        runIndexingAgain(token)
      } else {
        console.log('❌ Settings update failed:', data)
      }
    })
  })

  updateReq.write(settingsData)
  updateReq.end()
}

function runIndexingAgain(token) {
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

  console.log('\nRunning indexing again...')
  const indexingReq = http.request(indexingOptions, (res) => {
    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log(`Indexing Status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        const response = JSON.parse(data)
        console.log('Indexing result:', response)
        
        setTimeout(() => {
          checkFilesAgain(token)
        }, 2000)
      } else {
        console.log('Indexing failed:', data)
      }
    })
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
        console.log(`Found ${files.length} files total`)
        
        const testValidFiles = files.filter(f => f.name.includes('test_valid'))
        if (testValidFiles.length > 0) {
          console.log('\n✅ New test_valid files found:')
          testValidFiles.forEach(file => {
            console.log(`  - ${file.name} (${file.size} bytes)`)
          })
        } else {
          console.log('\n❌ test_valid files still not found')
          console.log('All files:')
          files.forEach(file => {
            console.log(`  - ${file.name}`)
          })
        }
      }
    })
  })

  filesReq.end()
}

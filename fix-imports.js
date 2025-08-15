const fs = require('fs')
const path = require('path')

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Replace @/ imports with relative paths
    content = content.replace(/from '@\/config\//g, "from '../config/")
    content = content.replace(/from '@\/utils\//g, "from '../utils/")
    content = content.replace(/from '@\/services\//g, "from '../services/")
    content = content.replace(/from '@\/controllers\//g, "from '../controllers/")
    content = content.replace(/from '@\/middleware\//g, "from '../middleware/")
    content = content.replace(/from '@\/routes\//g, "from '../routes/")
    content = content.replace(/from '@\/jobs\//g, "from '../jobs/")
    content = content.replace(/from '@\/types\//g, "from '../types/")
    
    // For files in the same directory
    content = content.replace(/from '@\/([^\/]+)'$/gm, "from './$1'")
    
    fs.writeFileSync(filePath, content)
    console.log(`Fixed imports in: ${filePath}`)
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message)
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      walkDirectory(filePath)
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImportsInFile(filePath)
    }
  })
}

console.log('🔧 Fixing import paths...')
walkDirectory('./server/src')
console.log('✅ Import paths fixed!')

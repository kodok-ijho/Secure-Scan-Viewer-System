# Create simple test images using PowerShell
$testFolder = "C:\temp\test-source"

# Create a simple SVG file
$svgContent = @"
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#4F46E5"/>
  <text x="100" y="100" text-anchor="middle" fill="white" font-size="20" font-family="Arial">
    Test SVG
  </text>
  <text x="100" y="130" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
    admin_test.svg
  </text>
</svg>
"@

$svgContent | Out-File -FilePath "$testFolder\admin_test.svg" -Encoding UTF8

# Create another SVG for testuser
$svgContent2 = @"
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="80" fill="#10B981"/>
  <text x="100" y="100" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
    Test User
  </text>
  <text x="100" y="120" text-anchor="middle" fill="white" font-size="12" font-family="Arial">
    testuser_circle.svg
  </text>
</svg>
"@

$svgContent2 | Out-File -FilePath "$testFolder\testuser_circle.svg" -Encoding UTF8

Write-Host "Test SVG files created successfully!"
Write-Host "Files created in: $testFolder"
Write-Host "   - admin_test.svg"
Write-Host "   - testuser_circle.svg"

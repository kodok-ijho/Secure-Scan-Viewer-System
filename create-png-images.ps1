# Create test PNG image using .NET Graphics
Add-Type -AssemblyName System.Drawing

# Create PNG image
$bitmap = New-Object System.Drawing.Bitmap(400, 300)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill background
$graphics.Clear([System.Drawing.Color]::LightBlue)

# Draw rectangle
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::DarkBlue, 3)
$graphics.DrawRectangle($pen, 50, 50, 300, 200)

# Draw text
$font = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::DarkBlue)
$graphics.DrawString("Test PNG Image", $font, $brush, 80, 130)

# Save PNG
$bitmap.Save("C:\temp\test-source\test_valid.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create JPG image
$bitmap2 = New-Object System.Drawing.Bitmap(400, 300)
$graphics2 = [System.Drawing.Graphics]::FromImage($bitmap2)

# Fill background
$graphics2.Clear([System.Drawing.Color]::LightGreen)

# Draw circle
$brush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::DarkGreen)
$graphics2.FillEllipse($brush2, 100, 75, 200, 150)

# Draw text
$font2 = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$brush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics2.DrawString("Test JPG Image", $font2, $brush3, 120, 140)

# Save JPG
$bitmap2.Save("C:\temp\test-source\test_valid.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Create GIF image
$bitmap3 = New-Object System.Drawing.Bitmap(300, 200)
$graphics3 = [System.Drawing.Graphics]::FromImage($bitmap3)

# Fill background
$graphics3.Clear([System.Drawing.Color]::Yellow)

# Draw triangle
$points = @(
    [System.Drawing.Point]::new(150, 50),
    [System.Drawing.Point]::new(100, 150),
    [System.Drawing.Point]::new(200, 150)
)
$brush4 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Red)
$graphics3.FillPolygon($brush4, $points)

# Draw text
$font3 = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$brush5 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
$graphics3.DrawString("Test GIF", $font3, $brush5, 120, 170)

# Save GIF
$bitmap3.Save("C:\temp\test-source\test_valid.gif", [System.Drawing.Imaging.ImageFormat]::Gif)

# Cleanup
$graphics.Dispose()
$graphics2.Dispose()
$graphics3.Dispose()
$bitmap.Dispose()
$bitmap2.Dispose()
$bitmap3.Dispose()
$pen.Dispose()
$brush.Dispose()
$brush2.Dispose()
$brush3.Dispose()
$brush4.Dispose()
$brush5.Dispose()
$font.Dispose()
$font2.Dispose()
$font3.Dispose()

Write-Host "Test images created successfully!"
Write-Host "- test_valid.png (400x300)"
Write-Host "- test_valid.jpg (400x300)"
Write-Host "- test_valid.gif (300x200)"

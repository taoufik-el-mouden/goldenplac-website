Add-Type -AssemblyName System.Drawing

$srcPath = "c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Original dimensions: $($bmp.Width) x $($bmp.Height)"

# In 1024x686:
# The card is centered. Let's find card bounds (where pixel is dark navy ~ #0a0d15)
# Let's sample along horizontal line y = 343:
for ($x = 50; $x -lt 500; $x += 5) {
    $c = $bmp.GetPixel($x, 343)
    if ($c.R -lt 25 -and $c.G -lt 30 -and $c.B -lt 40) {
        Write-Host "Card left edge approx x=$x (RGB: $($c.R),$($c.G),$($c.B))"
        break
    }
}
for ($x = 970; $x -gt 500; $x -= 5) {
    $c = $bmp.GetPixel($x, 343)
    if ($c.R -lt 25 -and $c.G -lt 30 -and $c.B -lt 40) {
        Write-Host "Card right edge approx x=$x (RGB: $($c.R),$($c.G),$($c.B))"
        break
    }
}
$bmp.Dispose()

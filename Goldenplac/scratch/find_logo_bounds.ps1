Add-Type -AssemblyName System.Drawing

$srcPath = "c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

for ($y = 50; $y -lt 300; $y += 5) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.R -lt 25 -and $c.G -lt 30 -and $c.B -lt 40) {
        Write-Host "Card top edge approx y=$y (RGB: $($c.R),$($c.G),$($c.B))"
        break
    }
}
for ($y = 650; $y -gt 400; $y -= 5) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.R -lt 25 -and $c.G -lt 30 -and $c.B -lt 40) {
        Write-Host "Card bottom edge approx y=$y (RGB: $($c.R),$($c.G),$($c.B))"
        break
    }
}

# Now let's inspect the gold pixels in the card to find the bounding box of the logo:
$minX = 10000; $maxX = 0; $minY = 10000; $maxY = 0
for ($y = 150; $y -lt 550; $y++) {
    for ($x = 220; $x -lt 800; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Gold pixels have high R (> 80), G (> 60), and R > B + 30
        if ($c.R -gt 80 -and $c.G -gt 60 -and ($c.R - $c.B) -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo gold bounding box: X=[$minX, $maxX] (width=$($maxX - $minX)), Y=[$minY, $maxY] (height=$($maxY - $minY))"
$bmp.Dispose()

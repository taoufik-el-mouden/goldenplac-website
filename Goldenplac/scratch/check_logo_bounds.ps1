Add-Type -AssemblyName System.Drawing

$p = "c:\xampp\htdocs\Goldenplac\assets\images\logo-goldenplac.png"
$bmp = [System.Drawing.Bitmap]::FromFile($p)

$minX = $bmp.Width; $maxX = 0; $minY = $bmp.Height; $maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"
Write-Host "Visible content bounds: X=[$minX, $maxX] (w=$($maxX-$minX+1)), Y=[$minY, $maxY] (h=$($maxY-$minY+1))"

$bmp.Dispose()

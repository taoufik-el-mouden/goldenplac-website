Add-Type -AssemblyName System.Drawing
$srcPath = "c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

for ($y = 190; $y -le 510; $y += 5) {
    $goldCount = 0
    for ($x = 280; $x -le 740; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 75 -and $c.G -gt 55 -and ($c.R - $c.B) -gt 25) {
            $goldCount++
        }
    }
    if ($goldCount -gt 0) {
        Write-Host "Y=$y : $goldCount gold pixels"
    }
}
$bmp.Dispose()

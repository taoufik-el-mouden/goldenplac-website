Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg")
$cropRect = New-Object System.Drawing.Rectangle(280, 184, 464, 266)
$rawCrop = $src.Clone($cropRect, $src.PixelFormat)

$w = $rawCrop.Width
$h = $rawCrop.Height

# We will create two versions:
# 1. Seamless PNG: Alpha calculation where background (slate ~ #0c1018) is fully transparent (A=0),
#    edges are anti-aliased with gold color, and gold centers are 100% opaque.
$cleanBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background reference color
$bgR = 12.0; $bgG = 16.0; $bgB = 24.0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $rawCrop.GetPixel($x, $y)
        
        # Relative brightness compared to background
        $diffR = [Math]::Max(0.0, $c.R - $bgR)
        $diffG = [Math]::Max(0.0, $c.G - $bgG)
        $diffB = [Math]::Max(0.0, $c.B - $bgB)
        
        # Gold metric: Gold has high red and green, lower blue
        $goldIntensity = ($diffR * 0.5 + $diffG * 0.4 + $diffB * 0.1)
        
        if ($goldIntensity -le 4.0) {
            # Background
            $cleanBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($goldIntensity -ge 45.0) {
            # Pure solid gold
            $cleanBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
        } else {
            # Smooth edge anti-aliasing
            $t = ($goldIntensity - 4.0) / 41.0
            $alpha = [int]($t * 255.0)
            
            # Boost the color slightly at edges to avoid dark halo
            $r = [Math]::Min(255, [int]($c.R / [Math]::Max(0.2, $t * 0.8 + 0.2)))
            $g = [Math]::Min(255, [int]($c.G / [Math]::Max(0.2, $t * 0.8 + 0.2)))
            $b = [Math]::Min(255, [int]($c.B / [Math]::Max(0.2, $t * 0.8 + 0.2)))
            
            $cleanBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
        }
    }
}

$cleanBmp.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-clean-trans.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-clean-trans.png"

$src.Dispose()
$rawCrop.Dispose()
$cleanBmp.Dispose()

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg")

# The logo area in tarjeta-frontal-original.jpg:
# Houses + GOLDENPLAC + ESPECIALISTAS EN PLADUR Y REFORMAS
# X: 280 to 744 (width 464)
# Y: 184 to 450 (height 266)
$cropRect = New-Object System.Drawing.Rectangle(280, 184, 464, 266)
$rawCrop = $src.Clone($cropRect, $src.PixelFormat)

# 1. Create a version for the dark navbar where background smoothly blends into #02050c:
# Navbar color is R=2, G=5, B=12
$navR = 2; $navG = 5; $navB = 12
$w = $rawCrop.Width
$h = $rawCrop.Height

$headerBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background color on card is approx R=12, G=16, B=24 (luminance ~ 15)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $rawCrop.GetPixel($x, $y)
        $lum = $c.R * 0.299 + $c.G * 0.587 + $c.B * 0.114
        
        # Calculate distance to outer edge for soft edge vignette
        $edgeDistX = [Math]::Min($x, $w - 1 - $x)
        $edgeDistY = [Math]::Min($y, $h - 1 - $y)
        $edgeDist = [Math]::Min($edgeDistX, $edgeDistY)
        
        # Vignette factor (0 at border, 1 inside >= 20px)
        $vignette = [Math]::Min(1.0, $edgeDist / 18.0)
        
        # If it's the dark background of the card:
        if ($lum -lt 28) {
            # Pure navbar background
            $headerBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $navR, $navG, $navB))
        } else {
            # Gold or transition pixel:
            # Blend smoothly into nav background for dark fringe
            $blendFactor = [Math]::Min(1.0, ($lum - 20) / 30.0)
            $r = [int]($navR + ($c.R - $navR) * $blendFactor)
            $g = [int]($navG + ($c.G - $navG) * $blendFactor)
            $b = [int]($navB + ($c.B - $navB) * $blendFactor)
            $r = [Math]::Max(0, [Math]::Min(255, $r))
            $g = [Math]::Max(0, [Math]::Min(255, $g))
            $b = [Math]::Max(0, [Math]::Min(255, $b))
            $headerBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
        }
    }
}

$headerBmp.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-header-dark.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-header-dark.png"

# 2. Also create a transparent PNG with smooth alpha and dark matte:
# This allows using it on transparent navbar, sticky navbar, mobile drawer, etc.
$transBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $rawCrop.GetPixel($x, $y)
        $lum = $c.R * 0.299 + $c.G * 0.587 + $c.B * 0.114
        
        if ($lum -lt 22) {
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Smooth alpha calculation
            $alpha = [Math]::Min(255, [int](($lum - 20) * 5.0))
            if ($alpha -lt 0) { $alpha = 0 }
            if ($lum -gt 60) { $alpha = 255 }
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
    }
}
$transBmp.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-header-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-header-transparent.png"

$src.Dispose()
$rawCrop.Dispose()
$headerBmp.Dispose()
$transBmp.Dispose()

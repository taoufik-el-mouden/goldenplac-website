Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("c:\xampp\htdocs\Goldenplac\assets\images\tarjeta-frontal-original.jpg")

# 1. High-res crop of the houses emblem:
# X: 295 to 728 (width 434), Y: 190 to 345 (height 156)
$emblemRect = New-Object System.Drawing.Rectangle(290, 185, 444, 160)
$emblemBmp = $src.Clone($emblemRect, $src.PixelFormat)

# 2. High-res crop of "GOLDENPLAC":
# X: 290 to 732 (width 443), Y: 350 to 405 (height 56)
$textRect = New-Object System.Drawing.Rectangle(290, 350, 444, 58)
$textBmp = $src.Clone($textRect, $src.PixelFormat)

# 3. High-res crop of "ESPECIALISTAS EN PLADUR Y REFORMAS":
# X: 290 to 732, Y: 415 to 442 (height 28)
$subRect = New-Object System.Drawing.Rectangle(290, 415, 444, 30)
$subBmp = $src.Clone($subRect, $src.PixelFormat)

# 4. Full stacked logo:
$fullRect = New-Object System.Drawing.Rectangle(280, 180, 464, 270)
$fullBmp = $src.Clone($fullRect, $src.PixelFormat)

# Function to create clean transparent PNG from dark background:
function MakeTransparentBitmap($inputBmp, $bgR=12, $bgG=16, $bgB=24) {
    $w = $inputBmp.Width
    $h = $inputBmp.Height
    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $c = $inputBmp.GetPixel($x, $y)
            $lum = ($c.R * 0.299 + $c.G * 0.587 + $c.B * 0.114)
            $bgLum = ($bgR * 0.299 + $bgG * 0.587 + $bgB * 0.114)
            
            # Gold color detection:
            # Gold pixels have R > B and reasonable brightness
            if ($lum -le $bgLum + 8) {
                # Completely transparent background
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                # Compute smooth alpha transition
                $alphaFloat = ($lum - $bgLum) / 50.0
                if ($alphaFloat -gt 1.0) { $alphaFloat = 1.0 }
                if ($alphaFloat -lt 0.0) { $alphaFloat = 0.0 }
                
                # For very bright gold (text & roofs), alpha is 100%
                if ($lum -gt 70 -and ($c.R - $c.B) -gt 20) {
                    $alpha = 255
                    $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
                } else {
                    $alpha = [int]($alphaFloat * 255)
                    $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
                }
            }
        }
    }
    return $outBmp
}

$fullTrans = MakeTransparentBitmap $fullBmp
$fullTrans.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-goldenplac-stacked.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-goldenplac-stacked.png"

# Let's also create horizontal logo:
# Emblem on left (e.g. 150px wide x 54px tall), Text on right (e.g. 240px wide x 50px tall)
# Let's compose a horizontal canvas: width = 540, height = 110 (2x resolution)
$horizBmp = New-Object System.Drawing.Bitmap(760, 170, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($horizBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Draw emblem on left: emblem original is 444x160 (aspect 2.775)
# In 170 height, draw emblem at (10, 5, 380, 155) or similar
# Wait, let's keep emblem square/proportional:
$emblemTrans = MakeTransparentBitmap $emblemBmp
$textTrans = MakeTransparentBitmap $textBmp
$subTrans = MakeTransparentBitmap $subBmp

# Let's save them and test
$emblemTrans.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-emblem-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$textTrans.Save("c:\xampp\htdocs\Goldenplac\assets\images\logo-text-goldenplac.png", [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$emblemBmp.Dispose()
$textBmp.Dispose()
$subBmp.Dispose()
$fullBmp.Dispose()
$fullTrans.Dispose()
$horizBmp.Dispose()
$g.Dispose()

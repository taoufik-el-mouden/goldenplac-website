Add-Type -AssemblyName System.Drawing
$files = @(
    "assets\images\logo-goldenplac-card.jpg",
    "assets\images\tarjeta-frontal-gold.jpg",
    "assets\images\tarjeta-frontal-original.jpg",
    "assets\images\logo-icon-card.jpg"
)
foreach ($f in $files) {
    $full = Join-Path "c:\xampp\htdocs\Goldenplac" $f
    if (Test-Path $full) {
        $img = [System.Drawing.Image]::FromFile($full)
        Write-Host "$f : $($img.Width) x $($img.Height)"
        $img.Dispose()
    }
}

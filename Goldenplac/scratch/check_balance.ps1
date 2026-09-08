$files = @(
    "C:\xampp\htdocs\Goldenplac\js\admin.js",
    "C:\xampp\htdocs\Goldenplac\js\app.js",
    "C:\xampp\htdocs\Goldenplac\admin.html",
    "C:\xampp\htdocs\Goldenplac\index.html"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $text = Get-Content $f -Raw
        $openB = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
        $closeB = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
        $openP = ($text.ToCharArray() | Where-Object { $_ -eq '(' }).Count
        $closeP = ($text.ToCharArray() | Where-Object { $_ -eq ')' }).Count
        Write-Host "$([System.IO.Path]::GetFileName($f)) : Braces {$openB / $closeB} | Parens ($openP / $closeP)"
    }
}

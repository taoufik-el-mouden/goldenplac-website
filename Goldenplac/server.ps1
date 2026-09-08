# ==============================================================================
# Goldenplac SL - Servidor Web Local Autónomo para Windows (PowerShell)
# Permite probar la web y el panel de administración en http://localhost:3000
# Sin necesidad de instalar Node.js ni Python.
# ==============================================================================

$port = 3000
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host " Servidor Web Local Goldenplac SL Activo" -ForegroundColor Yellow
    Write-Host " Web Publica:   http://localhost:$port/index.html" -ForegroundColor Green
    Write-Host " Panel Admin:   http://localhost:$port/admin.html" -ForegroundColor Green
    Write-Host " Presione Ctrl+C en cualquier momento para detener." -ForegroundColor Gray
    Write-Host "========================================================" -ForegroundColor Cyan

    # Abrir navegador automaticamente
    Start-Process "http://localhost:$port/index.html"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }

        $localFilePath = Join-Path $root $path

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png"  { "image/png" }
                ".svg"  { "image/svg+xml" }
                ".webp" { "image/webp" }
                ".woff2"{ "font/woff2" }
                default { "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 No Encontrado: $path")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}

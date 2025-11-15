# Simple HTTP Server for Caregiver Time Tracker
$port = 8080
$url = "http://localhost:$port/"

Write-Host "Starting HTTP Server on port $port..."
Write-Host "Your local IP: 192.168.1.34"
Write-Host "Access from phone: http://192.168.1.34:$port"
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host "Server running! Access at:"
    Write-Host "  Local: http://localhost:$port"
    Write-Host "  Network: http://192.168.1.34:$port"
    Write-Host ""
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/" -or $localPath -eq "") {
            $localPath = "/index.html"
        }
        
        $filePath = Join-Path (Get-Location) ($localPath.TrimStart('/'))
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - $($request.HttpMethod) $localPath"
        
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $content = Get-Content $filePath -Raw -Encoding UTF8
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                
                # Set content type based on file extension
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                switch ($extension) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                    ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                    ".json" { $response.ContentType = "application/json; charset=utf-8" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".jpeg" { $response.ContentType = "image/jpeg" }
                    ".gif"  { $response.ContentType = "image/gif" }
                    ".ico"  { $response.ContentType = "image/x-icon" }
                    default { $response.ContentType = "text/plain; charset=utf-8" }
                }
                
                $response.StatusCode = 200
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            catch {
                Write-Host "Error serving file: $_" -ForegroundColor Red
                $response.StatusCode = 500
            }
        }
        else {
            Write-Host "File not found: $filePath" -ForegroundColor Yellow
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $localPath")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        
        $response.OutputStream.Close()
    }
}
catch {
    Write-Host "Server error: $_" -ForegroundColor Red
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
    Write-Host "Server stopped."
}
$port = 8888

# Simple HTTP server without admin requirements
Add-Type -AssemblyName System.Net.Http

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    
    Write-Host ""
    Write-Host "=== Caregiver App Server Running ==="
    Write-Host "Local Access: http://localhost:$port"
    Write-Host "Files: $(Get-Location)"
    Write-Host ""
    Write-Host "For network access from your phone:"
    Write-Host "1. Copy the simple.html file to your phone"
    Write-Host "2. Or install Python/Node.js for network server"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop"
    Write-Host "====================================="
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/simple.html' }
        
        $filePath = Join-Path (Get-Location) $path.TrimStart('/')
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') Request: $path"
        
        if (Test-Path $filePath) {
            try {
                $content = Get-Content $filePath -Raw -Encoding UTF8
                $response.ContentType = 'text/html; charset=utf-8'
                $response.Headers.Add("Cache-Control", "no-cache")
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentLength64 = $buffer.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                
                Write-Host "  ✅ Served: $([math]::Round($buffer.Length/1024,1)) KB"
            } catch {
                Write-Host "  ❌ Error: $_"
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
            $response.ContentType = 'text/plain'
            $errorText = "File not found: $path"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorText)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "  ❌ Not found: $filePath"
        }
        
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Server error: $_"
    Write-Host ""
    Write-Host "Alternative solution:"
    Write-Host "1. Email simple.html to yourself"
    Write-Host "2. Open it directly on your phone's browser"
    Write-Host "3. The app will work offline with local storage"
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host ""
    Write-Host "Server stopped."
}
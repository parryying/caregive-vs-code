$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")

Write-Host "Starting server on port $port..."
Write-Host "If you get an 'Access Denied' error, run PowerShell as Administrator"

try {
    $listener.Start()
    Write-Host ""
    Write-Host "✅ Server running!"
    Write-Host "📱 Phone access: http://192.168.1.34:$port"
    Write-Host "💻 Local access: http://localhost:$port"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop"
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/') { 
            $path = '/simple.html' 
        }
        
        $file = Join-Path (Get-Location) $path.TrimStart('/')
        
        Write-Host "Request: $path"
        
        if (Test-Path $file) {
            $content = Get-Content $file -Raw -Encoding UTF8
            $response.ContentType = 'text/html; charset=utf-8'
            $buffer = [Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "  ✅ Served"
        } else {
            $response.StatusCode = 404
            $error = "File not found: $path"
            $buffer = [Text.Encoding]::UTF8.GetBytes($error)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "  ❌ Not found"
        }
        
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error: $_"
    Write-Host ""
    Write-Host "💡 Try one of these solutions:"
    Write-Host "1. Run PowerShell as Administrator"
    Write-Host "2. Or copy simple.html to your phone directly"
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host "Server stopped"
}
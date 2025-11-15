# Simple HTTP Server - Port 3000
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")

try {
    $listener.Start()
    Write-Host "✅ Server running on port $port"
    Write-Host "📱 Phone: http://192.168.1.34:$port"
    Write-Host "💻 Local: http://localhost:$port"
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/simple.html' }
        
        $file = Join-Path (Get-Location) $path.TrimStart('/')
        
        Write-Host "Request: $path from $($request.RemoteEndPoint.Address)"
        
        if (Test-Path $file) {
            $content = Get-Content $file -Raw -Encoding UTF8
            $response.ContentType = 'text/html; charset=utf-8'
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            
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
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    Write-Host "Server stopped"
}
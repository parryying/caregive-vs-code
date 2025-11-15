# Simple HTTP Server for Caregiver App - No Admin Required
Add-Type -AssemblyName System.Net.Http

$port = 8080
$url = "http://localhost:$port/"

# Find an available port
for ($testPort = 8080; $testPort -le 8090; $testPort++) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$testPort/")
        $listener.Start()
        $port = $testPort
        $listener.Stop()
        break
    } catch {
        continue
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==================================================="
    Write-Host "✅ Caregiver App Server Started!"
    Write-Host "==================================================="
    Write-Host ""
    Write-Host "🌐 Local access:"
    Write-Host "   http://localhost:$port"
    Write-Host ""
    Write-Host "📱 Network access (for your phone):"
    Write-Host "   http://192.168.1.34:$port"
    Write-Host ""
    Write-Host "📁 Serving from: $PWD"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server"
    Write-Host "==================================================="
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq '/') { 
            $localPath = '/simple.html' 
        }
        
        $filePath = Join-Path (Get-Location) $localPath.TrimStart('/')
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Request: $localPath"
        
        if (Test-Path $filePath) {
            try {
                $content = Get-Content $filePath -Raw -Encoding UTF8
                
                # Set content type
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                switch ($extension) {
                    '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                    '.js' { $response.ContentType = 'application/javascript; charset=utf-8' }
                    '.css' { $response.ContentType = 'text/css; charset=utf-8' }
                    '.json' { $response.ContentType = 'application/json; charset=utf-8' }
                    default { $response.ContentType = 'text/plain; charset=utf-8' }
                }
                
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentLength64 = $buffer.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                
                Write-Host "   ✅ Served successfully"
            } catch {
                Write-Host "   ❌ Error serving file: $_"
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
            $notFound = "<!DOCTYPE html><html><body><h1>404 - File Not Found</h1><p>$localPath</p><p>Looking for: $filePath</p></body></html>"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "   ❌ File not found: $filePath"
        }
        
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "❌ Server error: $_"
    Write-Host "💡 Try running as Administrator for port 8080, or the server will find an available port"
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host ""
    Write-Host "🛑 Server stopped."
}
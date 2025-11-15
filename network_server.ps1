# Network-enabled HTTP Server for Caregiver App
$port = 8080

# Try to find an available port if 8080 is in use
$testPort = $port
while ($testPort -le 8090) {
    try {
        $testListener = New-Object System.Net.HttpListener
        $testListener.Prefixes.Add("http://*:$testPort/")
        $testListener.Start()
        $testListener.Stop()
        $port = $testPort
        break
    } catch {
        $testPort++
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")

try {
    $listener.Start()
    Write-Host "======================================================"
    Write-Host "🚀 Caregiver App Server Started Successfully!"
    Write-Host "======================================================"
    Write-Host ""
    Write-Host "📱 Access from your phone:"
    Write-Host "   http://192.168.1.34:$port"
    Write-Host ""
    Write-Host "💻 Access from this computer:"
    Write-Host "   http://localhost:$port"
    Write-Host ""
    Write-Host "🌐 Server is accepting network connections"
    Write-Host "📁 Serving files from: $PWD"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server"
    Write-Host "======================================================"
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/' -or $path -eq '') { 
            $path = '/simple.html' 
        }
        
        $file = Join-Path (Get-Location) $path.TrimStart('/')
        
        $clientIP = $request.RemoteEndPoint.Address
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - $clientIP requested: $path"
        
        if (Test-Path $file) {
            try {
                $content = Get-Content $file -Raw -Encoding UTF8
                
                # Set proper headers for network access
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
                
                # Set content type based on file extension
                $extension = [System.IO.Path]::GetExtension($file).ToLower()
                switch ($extension) {
                    '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                    '.js' { $response.ContentType = 'application/javascript; charset=utf-8' }
                    '.css' { $response.ContentType = 'text/css; charset=utf-8' }
                    '.json' { $response.ContentType = 'application/json; charset=utf-8' }
                    default { $response.ContentType = 'text/plain; charset=utf-8' }
                }
                
                $buffer = [Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentLength64 = $buffer.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                
                Write-Host "   ✅ Served successfully ($($buffer.Length) bytes)"
            } catch {
                Write-Host "   ❌ Error serving file: $_"
                $response.StatusCode = 500
                $errorMsg = "Internal server error"
                $buffer = [Text.Encoding]::UTF8.GetBytes($errorMsg)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } else {
            $response.StatusCode = 404
            $response.ContentType = 'text/html; charset=utf-8'
            $notFound = @"
<!DOCTYPE html>
<html>
<head><title>404 - Not Found</title></head>
<body>
<h1>404 - File Not Found</h1>
<p>The requested file <strong>$path</strong> was not found.</p>
<p>Available files:</p>
<ul>
<li><a href="/simple.html">simple.html</a> (Caregiver App)</li>
</ul>
</body>
</html>
"@
            $buffer = [Text.Encoding]::UTF8.GetBytes($notFound)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "   ❌ File not found: $file"
        }
        
        $response.OutputStream.Close()
    }
} catch [System.Net.HttpListenerException] {
    Write-Host ""
    Write-Host "❌ HTTP Listener Error: $($_.Exception.Message)"
    if ($_.Exception.Message -like "*access*denied*") {
        Write-Host ""
        Write-Host "💡 Solution: This script needs to run as Administrator"
        Write-Host "   Right-click PowerShell → Run as Administrator"
        Write-Host "   Then run this script again"
    } elseif ($_.Exception.Message -like "*port*") {
        Write-Host "💡 Port $port might be in use. Trying a different port..."
    }
} catch {
    Write-Host "❌ Unexpected error: $_"
} finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
    }
    Write-Host ""
    Write-Host "🛑 Server stopped"
}
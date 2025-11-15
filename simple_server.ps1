# Simple HTTP Server for Caregiver App
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://*:8080/')

try {
    $listener.Start()
    Write-Host "==================================================="
    Write-Host "Server Started on port 8080!"
    Write-Host "==================================================="
    Write-Host ""
    Write-Host "To access on your phone:"
    Write-Host "   http://192.168.1.34:8080"
    Write-Host ""
    Write-Host "To access on this computer:"
    Write-Host "   http://localhost:8080"
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
        
        if (Test-Path $filePath) {
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
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "Served: $localPath"
        } else {
            $response.StatusCode = 404
            $notFound = "File not found: $localPath"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "404: $localPath"
        }
        
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error: $_"
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host "Server stopped."
}
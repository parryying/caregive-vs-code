@echo off
echo Starting Caregiver Time Tracker Server...
echo.
echo Your IP Address: 192.168.1.34
echo.
echo Trying different server options...
echo.

REM Try Node.js first
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Found Node.js! Starting server...
    echo Access at: http://192.168.1.34:8080
    echo.
    npx http-server . -p 8080 -a 0.0.0.0
    goto :end
)

REM Try Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Found Python! Starting server...
    echo Access at: http://192.168.1.34:8080
    echo.
    python -m http.server 8080
    goto :end
)

REM Try PowerShell as last resort
echo No Node.js or Python found. Trying PowerShell method...
echo You may need to run as Administrator for this to work.
echo.
echo Access at: http://192.168.1.34:8080
echo.
powershell -ExecutionPolicy Bypass -Command "& { Add-Type -AssemblyName System.Web; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://*:8080/'); try { $listener.Start(); Write-Host 'Server started! Access at http://192.168.1.34:8080'; while ($true) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $localPath = $request.Url.LocalPath; if ($localPath -eq '/') { $localPath = '/index.html' }; $filePath = Join-Path (Get-Location) ($localPath.TrimStart('/')); if (Test-Path $filePath) { $content = Get-Content $filePath -Raw -Encoding UTF8; $buffer = [System.Text.Encoding]::UTF8.GetBytes($content); $response.ContentLength64 = $buffer.Length; if ($filePath.EndsWith('.html')) { $response.ContentType = 'text/html; charset=utf-8' }; $response.OutputStream.Write($buffer, 0, $buffer.Length) } else { $response.StatusCode = 404 }; $response.OutputStream.Close() } } catch { Write-Host 'Error: Run as Administrator' } }"

:end
echo.
echo Server stopped. Press any key to exit...
pause >nul
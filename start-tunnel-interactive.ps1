Write-Host "Starting SQL HTTP Proxy and Cloudflare Tunnel..." -ForegroundColor Green
Write-Host ""

# Check if SQL Proxy is running
$sqlProxyRunning = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($sqlProxyRunning) {
    Write-Host "SQL HTTP Proxy already running on port 3002" -ForegroundColor Green
} else {
    Write-Host "Starting SQL HTTP Proxy..." -ForegroundColor Yellow
    Set-Location "c:\src\Arhiv\nova_syla_loyalty TEST\backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'c:\src\Arhiv\nova_syla_loyalty TEST\backend'; node sql-http-proxy.js" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    Write-Host "SQL HTTP Proxy started" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Tunnel URL will be shown below..." -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\src\Arhiv\nova_syla_loyalty TEST\backend"
cloudflared tunnel --url http://localhost:3002

@echo off
echo Starting Nova Syla SQL HTTP Proxy and Cloudflare Tunnel...

REM Зупинити попередні процеси
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SQL HTTP Proxy" 2>nul
taskkill /F /IM cloudflared.exe 2>nul

timeout /t 2 /nobreak >nul

REM Запустити SQL HTTP Proxy
cd /d "%~dp0"
start "SQL HTTP Proxy" /MIN node sql-http-proxy.js

REM Зачекати поки proxy запуститься
timeout /t 5 /nobreak >nul

REM Запустити Cloudflare Tunnel
start "Cloudflare Tunnel" /MIN cloudflared tunnel --url http://localhost:3002

echo.
echo =====================================
echo SQL HTTP Proxy: http://localhost:3002
echo Cloudflare Tunnel: Starting...
echo =====================================
echo.
echo Натисніть будь-яку клавішу щоб зупинити обидва сервіси...
pause >nul

REM Зупинити при виході
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SQL HTTP Proxy"
taskkill /F /IM cloudflared.exe

@echo off
title Nova Syla SQL Tunnel
color 0A

echo ========================================
echo  Nova Syla SQL HTTP Proxy + Cloudflare
echo ========================================
echo.

REM Kill previous processes
echo Stopping previous processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SQL*" 2>nul
taskkill /F /IM cloudflared.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting SQL HTTP Proxy...
cd /d "%~dp0"
start "SQL HTTP Proxy" /MIN cmd /c "node sql-http-proxy.js"
timeout /t 5 /nobreak >nul

echo.
echo Starting Cloudflare Tunnel...
echo.
echo ========================================
echo  TUNNEL URL will appear below
echo  Copy it and add to Railway Variables
echo ========================================
echo.

cloudflared tunnel --url http://localhost:3002

echo.
echo Tunnel stopped. Press any key to restart or close window to exit.
pause
goto :eof

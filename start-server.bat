@echo off
title Nova Syla API Server
cd /d "%~dp0"
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         Nova Syla Loyalty API Server                     ║
echo ║         Запуск сервера...                                 ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
node dist/server.v2.js
pause

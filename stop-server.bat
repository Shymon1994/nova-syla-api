@echo off
echo Зупинка сервера...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ Сервер зупинено
) else (
    echo ℹ Сервер не запущений
)
timeout /t 2 >nul

@echo off
echo Testing Binotel Call Password API
echo.
echo Phone: +380675307452
echo.

curl -X POST http://localhost:3001/api/v2/auth/request-code ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+380675307452\"}" ^
  --verbose

echo.
pause

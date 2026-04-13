@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
echo Starting Mimose Web...
echo API dev proxy will listen at http://localhost:8787
echo Browser will open at http://localhost:8081
echo.
start "Mimose Dev Proxy" cmd /c node scripts\dev-proxy.js
npx expo start --web
pause

@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
echo Starting Mimosa Web...
echo Browser will open at http://localhost:8081
echo.
npx expo start --web
pause

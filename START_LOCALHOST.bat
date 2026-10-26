@echo off
setlocal
cd /d "%~dp0"
title D3buff - localhost
where node >nul 2>nul
if errorlevel 1 goto :noNode
start "D3buff localhost server" cmd /k "cd /d ""%~dp0"" && set ""HOST=127.0.0.1"" && node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/"
exit /b 0
:noNode
echo Node.js не найден. Установи его с https://nodejs.org/ и запусти BAT ещё раз.
pause
exit /b 1

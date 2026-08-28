@echo off
cd /d %~dp0\..
echo Starting APEXSlim Trading Engine (24/7 worker)...
:loop
node src\engine\index.js
echo Engine exited. Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop

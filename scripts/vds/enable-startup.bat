@echo off
REM Register PM2 so it comes back after Windows VDS reboot.
REM Run this ONCE as Administrator after start-pm2.bat.
cd /d "%~dp0..\.."

echo Registering PM2 Windows startup hook...
pm2-startup install
pm2 save

echo.
echo PM2 will resurrect apexslim-api and apexslim-engine on boot.
pause

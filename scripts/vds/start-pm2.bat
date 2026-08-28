@echo off
cd /d "%~dp0..\.."
if not exist logs mkdir logs

echo Starting APEXSlim API + Trading Engine via PM2...
pm2 start ecosystem.config.js
pm2 save
pm2 status
echo.
echo Logs: logs\api-out.log  logs\api-error.log  logs\engine-out.log  logs\engine-error.log
pause

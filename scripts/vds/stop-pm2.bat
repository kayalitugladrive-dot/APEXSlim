@echo off
cd /d "%~dp0..\.."
pm2 stop apexslim-api apexslim-engine
pm2 status
pause

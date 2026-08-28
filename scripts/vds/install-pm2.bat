@echo off
setlocal
cd /d "%~dp0..\.."

echo [1/4] Installing PM2 globally...
call npm install -g pm2
if errorlevel 1 goto :fail

echo [2/4] Installing pm2-windows-startup (boot persistence)...
call npm install -g pm2-windows-startup
if errorlevel 1 goto :fail

echo [3/4] Installing server dependencies...
cd server
call npm install --omit=dev
if errorlevel 1 goto :fail
cd ..

echo [4/4] Optional: build Vite UI
cd complete-template
call npm install
call npm run build
cd ..

echo.
echo Done. Next: scripts\vds\start-pm2.bat then scripts\vds\enable-startup.bat
pause
exit /b 0

:fail
echo INSTALL FAILED
pause
exit /b 1

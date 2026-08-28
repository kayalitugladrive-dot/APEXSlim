@echo off
cd /d %~dp0
start "APEXSlim API" cmd /k start-api.bat
start "APEXSlim Engine" cmd /k start-engine.bat

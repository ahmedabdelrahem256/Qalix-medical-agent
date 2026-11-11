@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Qalix Agents Manager Platform - Windows Installer (32-bit / 64-bit)
echo ============================================================================
echo   Qalix Agents Manager Platform - One-Click Windows Installer
echo   Supports Windows 32-bit and 64-bit (100%% Offline, No Admin Required)
echo ============================================================================
set "TARGET_DIR=%LOCALAPPDATA%\QalixAgentsPlatform"
echo [1/3] Installing files into: "%TARGET_DIR%" ...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if /i not "%~dp0"=="%TARGET_DIR%\" robocopy "%~dp0." "%TARGET_DIR%" /E /XD .git .local_temp exports /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP >nul
if errorlevel 8 (
  echo [ERROR] Failed to copy application files cleanly.
  pause & exit /b 1
)
echo [2/3] Creating Desktop and Start Menu shortcuts ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); foreach($d in @($desk,$prog)){ $sc=$ws.CreateShortcut((Join-Path $d 'Qalix Agents Manager Platform.lnk')); $sc.TargetPath=(Join-Path $env:LOCALAPPDATA 'QalixAgentsPlatform\START_AGENTS_MANAGER_PLATFORM.bat'); $sc.WorkingDirectory=(Join-Path $env:LOCALAPPDATA 'QalixAgentsPlatform'); $sc.Save() }"
echo [3/3] Installation completed cleanly!
echo Launching application ...
start "" "%TARGET_DIR%\START_AGENTS_MANAGER_PLATFORM.bat"
pause

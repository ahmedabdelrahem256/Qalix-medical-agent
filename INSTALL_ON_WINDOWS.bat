@echo off
chcp 65001 >nul
cd /d "%~dp0"
title كالكس لإدارة الوكلاء والموزعين - Qalix Agents ^& Distributors Management (32-bit / 64-bit)
echo ============================================================================
echo   كالكس لإدارة الوكلاء والموزعين
echo   Qalix Agents ^& Distributors Management - One-Click Windows Installer
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
echo [2/3] Creating Desktop and Start Menu shortcuts with official Qalix icon ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); $tDir = Join-Path $env:LOCALAPPDATA 'QalixAgentsPlatform'; $vbs = Join-Path $tDir 'Qalix_Desktop_App.vbs'; $ico = Join-Path $tDir 'public\\img\\qalix-agents.ico'; foreach($d in @($desk,$prog)){ $sc=$ws.CreateShortcut((Join-Path $d 'Qalix Agents & Distributors Management.lnk')); if(Test-Path $vbs){ $sc.TargetPath=(Join-Path $env:SystemRoot 'System32\wscript.exe'); $sc.Arguments=('//nologo \"' + $vbs + '\"') } else { $sc.TargetPath=(Join-Path $tDir 'START_AGENTS_MANAGER_PLATFORM.bat') }; $sc.WorkingDirectory=$tDir; if(Test-Path $ico){ $sc.IconLocation=$ico }; $sc.Save() }"
echo [3/3] Installation completed cleanly!
echo Launching Qalix Windows Application ...
if exist "%TARGET_DIR%\Qalix_Desktop_App.vbs" (
  start "" wscript.exe //nologo "%TARGET_DIR%\Qalix_Desktop_App.vbs"
) else (
  start "" "%TARGET_DIR%\START_AGENTS_MANAGER_PLATFORM.bat"
)
pause

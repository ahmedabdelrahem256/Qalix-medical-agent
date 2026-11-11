@echo off
chcp 65001 >nul
cd /d "%~dp0"
title كالكس لإدارة الوكلاء والموزعين - إزالة التثبيت (Qalix Agents ^& Distributors Management)
echo ============================================================================
echo   كالكس لإدارة الوكلاء والموزعين
echo   Uninstall Qalix Agents ^& Distributors Management (Desktop / Start Menu / LocalAppData)
echo ============================================================================
set "TARGET_DIR=%LOCALAPPDATA%\QalixAgentsPlatform"
echo [1/2] Removing Desktop and Start Menu shortcuts ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); foreach($d in @($desk,$prog)){ $lnk = Join-Path $d 'Qalix Agents & Distributors Management.lnk'; if(Test-Path $lnk){ Remove-Item -LiteralPath $lnk -Force } }"
echo [2/2] Removing installed application folder "%TARGET_DIR%" ...
if exist "%TARGET_DIR%" (
  if /i "%~dp0"=="%TARGET_DIR%\" (
    cd /d "%TEMP%"
    start "" /b cmd /c "timeout /t 2 /nobreak >nul & rmdir /s /q ""%TARGET_DIR%"""
  ) else (
    rmdir /s /q "%TARGET_DIR%"
  )
)
echo Uninstall completed cleanly.
pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Qalix Agents Platform v1.0 — لوحة مدير الوكلاء ومنظومة كالكس الطبية
echo ============================================================================
echo   ★ Qalix Agents Platform v1.0 — متوافقة مع جميع نسخ ويندوز 32-bit / 64-bit ★
echo   - مجلد التشغيل الحالي: %CD%
echo   - تعمل 100%% أوفلاين بالكامل (Air-Gapped) بدون أي تبعيات خارجية
echo ============================================================================

set "NODE_BIN="
if exist "%~dp0runtime\node.exe" set "NODE_BIN=%~dp0runtime\node.exe"
if "%NODE_BIN%"=="" if exist "%~dp0node.exe" set "NODE_BIN=%~dp0node.exe"
if "%NODE_BIN%"=="" where node >nul 2>&1 && set "NODE_BIN=node"
if "%NODE_BIN%"=="" if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
if "%NODE_BIN%"=="" if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\nodejs\node.exe"

if "%NODE_BIN%"=="" (
  echo.
  echo [خطأ] لم يتم العثور على Node.js.
  echo - لأجهزة 64-بت: ثبّت Node.js 22 LTS ^(x64^) أو أحدث.
  echo - لأجهزة 32-بت: ثبّت Node.js 22 LTS ^(win-x86 32-bit^).
  pause
  exit /b 1
)

set "SQLITE_FLAG="
"%NODE_BIN%" -e "require('node:sqlite')" >nul 2>&1
if errorlevel 1 (
  "%NODE_BIN%" --experimental-sqlite -e "require('node:sqlite')" >nul 2>&1
  if errorlevel 1 (
    echo.
    echo [خطأ] إصدار Node.js الحالي لا يدعم node:sqlite المدمج ^(يتطلب Node 22.5+^).
    pause
    exit /b 1
  )
  set "SQLITE_FLAG=--experimental-sqlite"
)

set AUTO_OPEN_BROWSER=1
"%NODE_BIN%" %SQLITE_FLAG% "server\agent_server.js"
pause

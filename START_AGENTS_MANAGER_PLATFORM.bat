@echo off
chcp 65001 >nul
cd /d "%~dp0"
title منصة كالكس لإدارة الوكلاء والموزعين — اللوحة الرئيسية لمدير الوكلاء (v1.0)
echo ============================================================================
echo   ★ منصة كالكس لإدارة الوكلاء والموزعين v1.0 — متوافقة مع Win 32-bit / 64-bit ★
echo   - مجلد التشغيل الحالي: %CD%
echo   - تعمل 100%% أوفلاين بالكامل (Air-Gapped) بدون إنترنت + بترخيص Ed25519
echo ============================================================================

set "NODE_BIN="
if exist "%~dp0runtime\node.exe" set "NODE_BIN=%~dp0runtime\node.exe"
if "%NODE_BIN%"=="" if exist "%~dp0node.exe" set "NODE_BIN=%~dp0node.exe"
if "%NODE_BIN%"=="" where node >nul 2>&1 && set "NODE_BIN=node"
if "%NODE_BIN%"=="" if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
if "%NODE_BIN%"=="" if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\nodejs\node.exe"

if "%NODE_BIN%"=="" (
  echo.
  echo [خطأ] لم يتم العثور على Node.js على هذا الجهاز.
  echo - لأجهزة ويندوز 64-بت: ثبّت Node.js 22 LTS ^(x64^) أو أحدث.
  echo - لأجهزة ويندوز 32-بت: ثبّت Node.js 22 LTS ^(win-x86 32-bit^).
  pause
  exit /b 1
)

set "SQLITE_FLAG="
"%NODE_BIN%" -e "require('node:sqlite')" >nul 2>&1
if errorlevel 1 (
  "%NODE_BIN%" --experimental-sqlite -e "require('node:sqlite')" >nul 2>&1
  if errorlevel 1 (
    echo.
    echo [خطأ] إصدار Node.js المثبت لا يدعم node:sqlite المدمج.
    echo - لويندوز 64-بت: يرجى تثبيت Node.js 22 LTS أو 24 ^(x64^).
    echo - لويندوز 32-بت: يرجى تثبيت Node.js 22.5+ LTS ^(win-x86^).
    pause
    exit /b 1
  )
  set "SQLITE_FLAG=--experimental-sqlite"
)

set AUTO_OPEN_BROWSER=1
"%NODE_BIN%" %SQLITE_FLAG% "server\agent_server.js"
if errorlevel 1 (
  echo.
  echo [تنبيه] توقف الخادم برمز خطأ %errorlevel%.
  pause
)

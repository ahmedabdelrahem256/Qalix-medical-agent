@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not "%QALIX_SILENT%"=="1" if exist "%~dp0Qalix_Desktop_App.vbs" (
  start "" wscript.exe //nologo "%~dp0Qalix_Desktop_App.vbs"
  exit /b 0
)
title Qalix Medical Agent Server v1.0 (100%% Offline Air-Gapped)
echo ============================================================================
echo   Qalix Agents ^& Distributors Management v1.0 (100%% Offline Air-Gapped)
echo   - Working Directory: %CD%
echo ============================================================================

set "NODE_BIN="
if exist "%~dp0runtime\node.exe" set "NODE_BIN=%~dp0runtime\node.exe"
if "%NODE_BIN%"=="" if exist "%~dp0node.exe" set "NODE_BIN=%~dp0node.exe"
if "%NODE_BIN%"=="" where node >nul 2>&1 && set "NODE_BIN=node"
if "%NODE_BIN%"=="" if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
if "%NODE_BIN%"=="" if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\nodejs\node.exe"

if "%NODE_BIN%"=="" (
  echo.
  echo [ERROR] Node.js was not found on this Windows PC.
  echo - Windows 64-bit: Install Node.js 22 LTS ^(x64^) or newer.
  echo - Windows 32-bit: Install Node.js 22 LTS ^(win-x86 32-bit^).
  if not "%QALIX_SILENT%"=="1" pause
  exit /b 1
)

set "SQLITE_FLAG="
"%NODE_BIN%" -e "require('node:sqlite')" >nul 2>&1
if errorlevel 1 (
  "%NODE_BIN%" --experimental-sqlite -e "require('node:sqlite')" >nul 2>&1
  if errorlevel 1 (
    echo.
    echo [ERROR] Installed Node.js does not support built-in node:sqlite ^(requires Node 22.5+^).
    if not "%QALIX_SILENT%"=="1" pause
    exit /b 1
  )
  set "SQLITE_FLAG=--experimental-sqlite"
)

set AUTO_OPEN_BROWSER=1
"%NODE_BIN%" %SQLITE_FLAG% "server\agent_server.js"
if not "%QALIX_SILENT%"=="1" pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE_BIN="
if exist "%~dp0runtime\node.exe" set "NODE_BIN=%~dp0runtime\node.exe"
if "%NODE_BIN%"=="" if exist "%~dp0node.exe" set "NODE_BIN=%~dp0node.exe"
if "%NODE_BIN%"=="" where node >nul 2>&1 && set "NODE_BIN=node"
if "%NODE_BIN%"=="" if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles%\nodejs\node.exe"
if "%NODE_BIN%"=="" if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\nodejs\node.exe"
if "%NODE_BIN%"=="" (
  echo [خطأ] لم يتم العثور على Node.js على هذا الجهاز.
  pause & exit /b 1
)
set "SQLITE_FLAG="
"%NODE_BIN%" -e "require('node:sqlite')" >nul 2>&1 || set "SQLITE_FLAG=--experimental-sqlite"
"%NODE_BIN%" %SQLITE_FLAG% "%~dp0server\create_backup.js"
pause

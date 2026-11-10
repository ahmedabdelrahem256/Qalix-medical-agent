@echo off
chcp 65001 >nul
node "%~dp0server\create_backup.js"
pause

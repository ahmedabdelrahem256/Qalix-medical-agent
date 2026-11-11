@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Qalix Agents Platform v1.0 — لوحة مدير الوكلاء ومنظومة كالكس الطبية
echo ============================================================================
echo   ★ Qalix Agents Platform v1.0 — منصة كالكس لإدارة الوكلاء والموزعين ★
echo   - مجلد التشغيل الحالي: %CD%
echo   - تعمل 100%% أوفلاين بالكامل (Air-Gapped) بدون أي تبعيات خارجية
echo ============================================================================

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [خطأ] لم يتم العثور على Node.js على هذا الجهاز.
  echo يرجى تثبيت Node.js الإصدار 22 LTS أو أحدث ثم إعادة المحاولة.
  pause
  exit /b 1
)

for /f %%i in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%i
if %NODE_MAJOR% LSS 22 (
  echo.
  echo [خطأ] إصدار Node.js الحالي ^(%NODE_MAJOR%^) أقدم من المطلوب ^(22+ لدعم SQLite المدمج^).
  pause
  exit /b 1
)

set AUTO_OPEN_BROWSER=1
node "server\agent_server.js"
pause

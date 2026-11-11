@echo off
chcp 65001 >nul
cd /d "%~dp0"
title منصة كالكس لإدارة الوكلاء والموزعين — اللوحة الرئيسية لمدير الوكلاء (v1.0)
echo ============================================================================
echo   ★ منصة كالكس لإدارة الوكلاء والموزعين v1.0 — اللوحة الرئيسية لمدير الوكلاء ★
echo   - مجلد التشغيل الحالي: %CD%
echo   - تعمل 100%% أوفلاين بالكامل (Air-Gapped) بدون إنترنت + بترخيص Ed25519
echo ============================================================================

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [خطأ] لم يتم العثور على Node.js على هذا الجهاز.
  echo يرجى تثبيت Node.js الإصدار 22 LTS أو أحدث ثم إعادة التشغيل.
  pause
  exit /b 1
)

for /f %%i in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%i
if %NODE_MAJOR% LSS 22 (
  echo.
  echo [خطأ] إصدار Node.js الحالي ^(%NODE_MAJOR%^) أقدم من المطلوب ^(22+ لدعم SQLite المدمج^).
  echo يرجى ترقية Node.js إلى الإصدار 22 LTS أو أحدث.
  pause
  exit /b 1
)

set AUTO_OPEN_BROWSER=1
node "server\agent_server.js"
if errorlevel 1 (
  echo.
  echo [تنبيه] توقف الخادم برمز خطأ %errorlevel%.
  pause
)

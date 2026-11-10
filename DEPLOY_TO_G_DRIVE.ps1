# Build & Mirror Script to deploy Qalix Medical Agent directly to G:\Qalix medical agent on Windows
$ErrorActionPreference = "Stop"
$TargetDir = "G:\Qalix medical agent"
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  تثبيت وبناء مشروع: Qalix Medical Agent في المسار:" -ForegroundColor Green
Write-Host "  $TargetDir" -ForegroundColor Yellow
Write-Host "  (مع الالتزام المطلق بعدم لمس القرص E: أو ملفات الإصدار v1.0)" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan

if (!(Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
}

Copy-Item -Path "$SourceDir\*" -Destination $TargetDir -Recurse -Force
Write-Host "✅ تم بناء ونسخ جميع ملفات المشروع بنجاح في: $TargetDir" -ForegroundColor Green
Write-Host "▶ لتشغيل لوحة الوكيل فوراً، افتح: $TargetDir\START_QALIX_MEDICAL_AGENT.bat" -ForegroundColor Green

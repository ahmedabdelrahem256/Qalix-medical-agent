/* server/installer_builder.js — بناء حزمة ومخطط المُثبِّت المستقل للويندوز (Inno Setup .iss) لـ 32-bit و 64-bit
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildCleanResellerEdition, generateWindowsOneClickInstallBat } = require('./reseller_edition');

function generateInnoSetupScript({ appNameAr, appVersion, sourceDir, outputDir, setupFilename }) {
  const srcWin = sourceDir.replace(/\//g, '\\');
  return `; Inno Setup Script — كالكس لإدارة الوكلاء والموزعين | Qalix Agents & Distributors Management ${appVersion}
; متوافق مع ويندوز 32-bit (Node 22 LTS win-x86) و 64-bit (Node 22/24 win-x64)
[Setup]
AppName=${appNameAr}
AppVersion=${appVersion}
AppPublisher=Qalix Platform
DefaultDirName={autopf}\\QalixAgentsPlatform
DefaultGroupName=${appNameAr}
DisableProgramGroupPage=yes
OutputDir=${outputDir.replace(/\//g, '\\')}
OutputBaseFilename=${setupFilename}
SetupIconFile=${srcWin}\\public\\img\\qalix-agents.ico
UninstallDisplayIcon={app}\\public\\img\\qalix-agents.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "${srcWin}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autodesktop}\\${appNameAr}"; Filename: "{app}\\START_AGENT_PANEL.bat"; WorkingDir: "{app}"; IconFilename: "{app}\\public\\img\\qalix-agents.ico"
Name: "{group}\\${appNameAr}"; Filename: "{app}\\START_AGENT_PANEL.bat"; WorkingDir: "{app}"; IconFilename: "{app}\\public\\img\\qalix-agents.ico"

[Run]
Filename: "{app}\\START_AGENT_PANEL.bat"; Description: "تشغيل المنظومة الآن"; Flags: nowait postinstall skipifsilent
`;
}

function buildWindowsInstallerKit({ rootDir, baseDataDir, edition = 'qalix11', includeMediaAssets = false }) {
  const dataRoot = baseDataDir || path.join(rootDir, 'data');
  const stageRoot = path.join(dataRoot, 'installer_stage');
  fs.mkdirSync(stageRoot, { recursive: true });
  const isQalix11 = edition === 'qalix11';

  const editionRes = buildCleanResellerEdition({
    rootDir,
    outputBaseDir: stageRoot,
    editionName: isQalix11 ? 'Qalix_11Systems_Setup_Stage' : 'Universal_Agents_Setup_Stage',
    buyerAgentTitleAr: isQalix11 ? 'مدير وكلاء منظومات كالكس الـ 11' : 'وكيل عام متعدد المنظومات',
    buyerOwnerName: 'إدارة الوكلاء',
    defaultSystemId: isQalix11 ? 'qalix_medical' : 'universal_agent',
    includeAllQalix11: isQalix11,
    includeMediaAssets,
    skipZip: true
  });

  const stageDir = editionRes.folderPath;
  const runtimeDir = path.join(stageDir, 'runtime');
  fs.mkdirSync(runtimeDir, { recursive: true });

  // إذا توافر node.exe المحلي، ننسخه اختيارياً لعمل نسخة محمولة فورية على نفس المعمارية
  let bundledNodeArch = null;
  if (process.execPath && fs.existsSync(process.execPath)) {
    fs.copyFileSync(process.execPath, path.join(runtimeDir, 'node.exe'));
    bundledNodeArch = process.arch;
  }

  const issOutDir = path.join(dataRoot, 'exports');
  fs.mkdirSync(issOutDir, { recursive: true });
  const setupBaseName = isQalix11 ? 'Qalix_11Systems_Setup_v1.0' : 'Universal_Agents_Setup_v1.0';
  const issContent = generateInnoSetupScript({
    appNameAr: isQalix11 ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    appVersion: '1.0.0',
    sourceDir: stageDir,
    outputDir: issOutDir,
    setupFilename: setupBaseName
  });
  const issPath = path.join(stageDir, 'Qalix_Agents_Setup.iss');
  fs.writeFileSync(issPath, issContent, 'utf8');

  const compileBat = [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    'echo ============================================================================',
    'echo   كالكس لإدارة الوكلاء والموزعين — Qalix Agents ^& Distributors Management',
    'echo   Windows Installer Compiler v1.0 (Inno Setup)',
    'echo ============================================================================',
    'set "ISCC_EXE="',
    'where iscc >nul 2>&1 && set "ISCC_EXE=iscc"',
    'if "%ISCC_EXE%"=="" if exist "%ProgramFiles(x86)%\\Inno Setup 6\\ISCC.exe" set "ISCC_EXE=%ProgramFiles(x86)%\\Inno Setup 6\\ISCC.exe"',
    'if "%ISCC_EXE%"=="" if exist "%ProgramFiles%\\Inno Setup 6\\ISCC.exe" set "ISCC_EXE=%ProgramFiles%\\Inno Setup 6\\ISCC.exe"',
    'if "%ISCC_EXE%"=="" (',
    '  echo [تنبيه] أداة Inno Setup 6 غير مثبتة على هذا الجهاز.',
    '  echo لتوليد ملف Setup.exe ثبّت Inno Setup 6 المجاني ثم شغّل هذا الملف مرة أخرى.',
    '  echo كما يمكنك تشغيل INSTALL_ON_WINDOWS.bat للتثبيت الفوري بأيقونة سطح المكتب.',
    '  pause & exit /b 0',
    ')',
    '"%ISCC_EXE%" "Qalix_Agents_Setup.iss"',
    'pause',
    ''
  ].join('\r\n');
  fs.writeFileSync(path.join(stageDir, 'BUILD_INSTALLER.bat'), compileBat, 'utf8');

  const oneClickInstallBat = generateWindowsOneClickInstallBat({
    appShortcutName: isQalix11 ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    installFolderName: isQalix11 ? 'QalixAgentsPlatform11' : 'UniversalAgentsPlatform',
    launchBatName: 'START_AGENT_PANEL.bat',
    iconRelPath: 'public\\img\\qalix-agents.ico'
  });
  const oneClickInstallBatPath = path.join(stageDir, 'INSTALL_ON_WINDOWS.bat');
  fs.writeFileSync(oneClickInstallBatPath, oneClickInstallBat, 'utf8');

  let compiledExePath = null;
  try {
    const candidates = [
      path.join(process.env['ProgramFiles(x86)'] || '', 'Inno Setup 6', 'ISCC.exe'),
      path.join(process.env.ProgramFiles || '', 'Inno Setup 6', 'ISCC.exe')
    ].filter(p => p && fs.existsSync(p));
    if (candidates.length) {
      execFileSync(candidates[0], [issPath], { stdio: 'pipe' });
      const maybeExe = path.join(issOutDir, `${setupBaseName}.exe`);
      if (fs.existsSync(maybeExe)) compiledExePath = maybeExe;
    }
  } catch (_) {}

  return {
    ok: true,
    edition,
    stageDir,
    issPath,
    compileBatPath: path.join(stageDir, 'BUILD_INSTALLER.bat'),
    oneClickInstallBatPath,
    bundledNodeArch,
    compiledExePath
  };
}

module.exports = {
  generateWindowsOneClickInstallBat,
  generateInnoSetupScript,
  buildWindowsInstallerKit
};

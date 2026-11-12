/* Qalix Multi-System Clean Reseller Edition Builder
 * Generates a standalone, 100% zero-data, ready-to-sell multi-system edition folder + ZIP.
 * Guarantees: 0 distributors, 0 deals, 0 lead_locks, 0 test snapshots, 0 distributor HTML kits,
 * clean_production_mode = '1', and ZERO personal owner phone leaked.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const {
  DEFAULT_MEDICAL_PRICING,
  DEFAULT_AGENT_INFO,
  QALIX_11_SUITE_IDS,
  SYSTEM_PRESETS,
  buildAgentInfoFromSystem,
  initSystemSchema,
  openManagerHubDb,
  seedSystemGenesisAudit,
  seedGenericSystemProposals,
  createIsolatedSystem
} = require('./systems_manager');
const { generateSilentDesktopVbs } = require('./windows_app_launcher');

function copyDirFiltered(src, dest, skipNames = new Set()) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipNames.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirFiltered(srcPath, destPath, skipNames);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateWindowsOneClickInstallBat({ appShortcutName = 'Universal Agents & Distributors Management', installFolderName = 'UniversalAgentsPlatform', launchBatName = 'START_AGENT_PANEL.bat', iconRelPath = 'public\\img\\agents-platform.ico', vbsFileName = 'Agents_Desktop_App.vbs', isUniversal = true } = {}) {
  const safeBannerName = String(appShortcutName).replace(/&/g, '^&');
  const brandTitleAr = isUniversal ? 'منظومة إدارة الوكلاء والموزعين الموحدة' : 'كالكس لإدارة الوكلاء والموزعين';
  const brandShortEn = isUniversal ? 'Agents Platform' : 'Qalix';
  return [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    `title ${brandTitleAr} - ${safeBannerName} (32-bit / 64-bit)`,
    'echo ============================================================================',
    `echo   ${brandTitleAr}`,
    `echo   ${safeBannerName} - One-Click Windows Installer`,
    'echo   Supports Windows 32-bit and 64-bit (100%% Offline, No Admin Required)',
    'echo ============================================================================',
    `set "TARGET_DIR=%LOCALAPPDATA%\\${installFolderName}"`,
    'echo [1/3] Installing files into: "%TARGET_DIR%" ...',
    'if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"',
    'if /i not "%~dp0"=="%TARGET_DIR%\\" robocopy "%~dp0." "%TARGET_DIR%" /E /XD .git .local_temp exports /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP >nul',
    'if errorlevel 8 (',
    '  echo [ERROR] Failed to copy application files cleanly.',
    '  pause & exit /b 1',
    ')',
    `echo [2/3] Creating Desktop and Start Menu shortcuts with official ${brandShortEn} icon ...`,
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); $tDir = Join-Path $env:LOCALAPPDATA '${installFolderName}'; $vbs = Join-Path $tDir '${vbsFileName}'; $ico = Join-Path $tDir '${iconRelPath}'; foreach($d in @($desk,$prog)){ $sc=$ws.CreateShortcut((Join-Path $d '${appShortcutName}.lnk')); if(Test-Path $vbs){ $sc.TargetPath=$vbs; $sc.Arguments='' } else { $sc.TargetPath=(Join-Path $tDir '${launchBatName}') }; $sc.WorkingDirectory=$tDir; if(Test-Path $ico){ $sc.IconLocation=$ico }; $sc.Save() }"`,
    'echo [3/3] Installation completed cleanly!',
    `echo Launching ${brandShortEn} Windows Application ...`,
    `if exist "%TARGET_DIR%\\${vbsFileName}" (`,
    `  start "" wscript.exe //nologo "%TARGET_DIR%\\${vbsFileName}"`,
    ') else (',
    `  start "" "%TARGET_DIR%\\${launchBatName}"`,
    ')',
    'pause',
    ''
  ].join('\r\n');
}

function generateWindowsUninstallBat({ appShortcutName = 'Universal Agents & Distributors Management', installFolderName = 'UniversalAgentsPlatform', isUniversal = true } = {}) {
  const safeBannerName = String(appShortcutName).replace(/&/g, '^&');
  const brandTitleAr = isUniversal ? 'منظومة إدارة الوكلاء والموزعين الموحدة' : 'كالكس لإدارة الوكلاء والموزعين';
  return [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    `title ${brandTitleAr} - إزالة التثبيت (${safeBannerName})`,
    'echo ============================================================================',
    `echo   ${brandTitleAr}`,
    `echo   Uninstall ${safeBannerName} (Desktop / Start Menu / LocalAppData)`,
    'echo ============================================================================',
    `set "TARGET_DIR=%LOCALAPPDATA%\\${installFolderName}"`,
    'echo [1/2] Removing Desktop and Start Menu shortcuts ...',
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "$desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); foreach($d in @($desk,$prog)){ $lnk = Join-Path $d '${appShortcutName}.lnk'; if(Test-Path $lnk){ Remove-Item -LiteralPath $lnk -Force } }"`,
    'echo [2/2] Removing installed application folder "%TARGET_DIR%" ...',
    'if exist "%TARGET_DIR%" (',
    '  if /i "%~dp0"=="%TARGET_DIR%\\" (',
    '    cd /d "%TEMP%"',
    '    start "" /b cmd /c "timeout /t 2 /nobreak >nul & rmdir /s /q ""%TARGET_DIR%"""',
    '  ) else (',
    '    rmdir /s /q "%TARGET_DIR%"',
    '  )',
    ')',
    'echo Uninstall completed cleanly.',
    'pause',
    ''
  ].join('\r\n');
}

function buildCleanResellerEdition(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const outputBaseDir = options.outputBaseDir || path.join(rootDir, 'data', 'exports');
  fs.mkdirSync(outputBaseDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const isQalixSuiteEdition = options.includeAllQalix11 === true;
  const fallbackBaseName = isQalixSuiteEdition
    ? `Qalix_11Systems_Agents_Edition_${stamp}`
    : `Universal_MultiSystem_Clean_Edition_${stamp}`;
  const editionName = String(options.editionName || fallbackBaseName).replace(/[^a-zA-Z0-9_-]/g, '_');
  const editionDir = path.join(outputBaseDir, editionName);
  const zipFilename = `${editionName}.zip`;
  const zipPath = path.join(outputBaseDir, zipFilename);

  if (fs.existsSync(editionDir)) fs.rmSync(editionDir, { recursive: true, force: true });
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

  fs.mkdirSync(editionDir, { recursive: true });

  // 1. Copy runtime application code (zero database/backup/kit files)
  copyDirFiltered(path.join(rootDir, 'public'), path.join(editionDir, 'public'));
  copyDirFiltered(path.join(rootDir, 'server'), path.join(editionDir, 'server'));

  const safeRootFiles = isQalixSuiteEdition
    ? ['CREATE_BACKUP.bat', 'package.json']
    : ['CREATE_BACKUP.bat'];
  for (const fname of safeRootFiles) {
    const srcFile = path.join(rootDir, fname);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(editionDir, fname));
    }
  }
  if (!isQalixSuiteEdition) {
    const universalPkg = {
      name: 'universal-agents-distributors-platform',
      version: '1.0.0',
      description: 'Universal Agents & Distributors Management Platform (100% Offline Air-Gapped Windows Edition, Zero External Dependencies)',
      main: 'server/agent_server.js',
      scripts: {
        start: 'node server/agent_server.js'
      },
      license: 'UNLICENSED'
    };
    fs.writeFileSync(path.join(editionDir, 'package.json'), JSON.stringify(universalPkg, null, 2) + '\n', 'utf8');

    const imgDestDir = path.join(editionDir, 'public', 'img');
    if (fs.existsSync(imgDestDir)) {
      const pngSrc = path.join(imgDestDir, 'qalix-agents-icon.png');
      const icoSrc = path.join(imgDestDir, 'qalix-agents.ico');
      if (fs.existsSync(pngSrc)) fs.copyFileSync(pngSrc, path.join(imgDestDir, 'agents-platform-icon.png'));
      if (fs.existsSync(icoSrc)) fs.copyFileSync(icoSrc, path.join(imgDestDir, 'agents-platform.ico'));
      for (const f of fs.readdirSync(imgDestDir)) {
        if (f.toLowerCase().startsWith('qalix-') && f.toLowerCase() !== 'qalix-sovereign-logo.svg') {
          fs.rmSync(path.join(imgDestDir, f), { force: true });
        }
      }
    }
    const edHtmlPath = path.join(editionDir, 'public', 'index.html');
    if (fs.existsSync(edHtmlPath)) {
      let edHtml = fs.readFileSync(edHtmlPath, 'utf8');
      edHtml = edHtml
        .replace(/\/public\/img\/qalix-agents-icon\.png/g, '/public/img/agents-platform-icon.png')
        .replace(/\/public\/img\/qalix-agents\.ico/g, '/public/img/agents-platform.ico');
      fs.writeFileSync(edHtmlPath, edHtml, 'utf8');
    }
  }

  // Write clean neutral Windows startup launcher (auto-handoff to silent desktop VBS + auto-port fallback)
  const editionTitleAscii = isQalixSuiteEdition
    ? 'Qalix Agents ^& Distributors Management v1.0'
    : 'Universal Multi-System Agents ^& Distributors Platform v1.0';
  const vbsFileName = isQalixSuiteEdition ? 'Qalix_Desktop_App.vbs' : 'Agents_Desktop_App.vbs';
  const startBat = [
    '@echo off',
    'setlocal EnableDelayedExpansion',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    `if not "%QALIX_SILENT%"=="1" if exist "%~dp0${vbsFileName}" (`,
    `  start "" wscript.exe //nologo "%~dp0${vbsFileName}"`,
    '  exit /b 0',
    ')',
    `title ${editionTitleAscii}`,
    'echo ============================================================================',
    `echo   ${editionTitleAscii} (100%% Offline Air-Gapped)`,
    'echo   - Working Directory: %CD%',
    'echo ============================================================================',
    'set "NODE_BIN="',
    'set "SQLITE_FLAG="',
    'for %%N in ("%~dp0runtime\\node.exe" "%~dp0runtime\\node-x86.exe" "%~dp0node.exe" "%ProgramFiles%\\nodejs\\node.exe" "%ProgramFiles(x86)%\\nodejs\\node.exe") do (',
    '  if "!NODE_BIN!"=="" if exist %%~N (',
    '    %%~N -e "require(\'node:sqlite\')" >nul 2>&1',
    '    if not errorlevel 1 set "NODE_BIN=%%~N"',
    '  )',
    ')',
    'if "%NODE_BIN%"=="" (',
    '  for /f "delims=" %%N in (\'where node 2^>nul\') do (',
    '    if "%NODE_BIN%"=="" (',
    '      "%%~N" -e "require(\'node:sqlite\')" >nul 2>&1',
    '      if not errorlevel 1 set "NODE_BIN=%%~N"',
    '    )',
    '  )',
    ')',
    'if "%NODE_BIN%"=="" (',
    '  echo [ERROR] No compatible Node.js ^(22.5+ with node:sqlite^) was found on this Windows PC.',
    '  echo - Windows 64-bit: Install Node.js 22 LTS ^(x64^) or newer.',
    '  echo - Windows 32-bit / Older Windows: Install Node.js 22 LTS ^(win-x86 32-bit^).',
    '  if not "%QALIX_SILENT%"=="1" pause',
    '  exit /b 1',
    ')',
    'set AUTO_OPEN_BROWSER=1',
    '"%NODE_BIN%" %SQLITE_FLAG% "server\\agent_server.js"',
    'if not "%QALIX_SILENT%"=="1" pause',
    ''
  ].join('\r\n');
  fs.writeFileSync(path.join(editionDir, 'START_AGENT_PANEL.bat'), startBat, 'utf8');
  fs.writeFileSync(path.join(editionDir, vbsFileName), generateSilentDesktopVbs('START_AGENT_PANEL.bat'), 'utf8');

  const installBat = generateWindowsOneClickInstallBat({
    appShortcutName: isQalixSuiteEdition ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    installFolderName: isQalixSuiteEdition ? 'QalixAgentsPlatform11' : 'UniversalAgentsPlatform',
    launchBatName: 'START_AGENT_PANEL.bat',
    iconRelPath: isQalixSuiteEdition ? 'public\\img\\qalix-agents.ico' : 'public\\img\\agents-platform.ico',
    vbsFileName,
    isUniversal: !isQalixSuiteEdition
  });
  fs.writeFileSync(path.join(editionDir, 'INSTALL_ON_WINDOWS.bat'), installBat, 'utf8');

  const uninstallBat = generateWindowsUninstallBat({
    appShortcutName: isQalixSuiteEdition ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    installFolderName: isQalixSuiteEdition ? 'QalixAgentsPlatform11' : 'UniversalAgentsPlatform',
    isUniversal: !isQalixSuiteEdition
  });
  fs.writeFileSync(path.join(editionDir, 'UNINSTALL_FROM_WINDOWS.bat'), uninstallBat, 'utf8');

  // Legal docs (included for Qalix editions or when includeMediaAssets=true; excluded from pure Universal resale edition)
  const legalSrc = path.join(rootDir, 'الوثائق_القانونية_والتسليم');
  if ((isQalixSuiteEdition || options.includeMediaAssets === true) && fs.existsSync(legalSrc)) {
    copyDirFiltered(legalSrc, path.join(editionDir, 'الوثائق_القانونية_والتسليم'));
  }

  // Presentations & media folders
  const presDest = path.join(editionDir, 'ملفات_العروض_التقديمية');
  if (options.includeMediaAssets === true) {
    copyDirFiltered(path.join(rootDir, 'ملفات_العروض_التقديمية'), presDest);
  } else {
    fs.mkdirSync(path.join(presDest, 'فيديو_تسويقي'), { recursive: true });
    fs.mkdirSync(path.join(presDest, 'صور'), { recursive: true });
  }

  const includeLiveMedicalData = options.includeLiveMedicalData === true && isQalixSuiteEdition;

  // Empty kits & data folders (or copy live qalix_medical kits when building dedicated Qalix Agents Manager edition)
  const kitsDest = path.join(editionDir, 'distributors_kits');
  fs.mkdirSync(kitsDest, { recursive: true });
  const srcKitsDir = path.join(rootDir, 'distributors_kits');
  if (includeLiveMedicalData && fs.existsSync(srcKitsDir)) {
    copyDirFiltered(srcKitsDir, kitsDest);
  } else {
    fs.writeFileSync(path.join(kitsDest, '.gitkeep'), '', 'utf8');
  }

  const dataDest = path.join(editionDir, 'data');
  fs.mkdirSync(dataDest, { recursive: true });
  fs.mkdirSync(path.join(dataDest, 'backups'), { recursive: true });

  // 2. Customize clean buyer profile (or preserve qalix_medical live data when includeLiveMedicalData === true)
  const buyerPhone = includeLiveMedicalData
    ? '01122166076'
    : (String(options.buyerAgentPhone || '01000000000').replace(/[^0-9]/g, '').slice(0, 15) || '01000000000');
  const buyerTitleAr = String(options.buyerAgentTitleAr || 'وكيل المنظومة المعتمد').trim() || 'وكيل المنظومة المعتمد';
  const buyerOwnerName = String(options.buyerOwnerName || 'صاحب المنصة / الوكيل الرئيسي').trim() || 'صاحب المنصة / الوكيل الرئيسي';

  const defaultPresetId = includeLiveMedicalData
    ? 'qalix_medical'
    : ((options.defaultSystemId && SYSTEM_PRESETS[options.defaultSystemId])
      ? options.defaultSystemId
      : (isQalixSuiteEdition ? 'qalix_platform' : 'universal_agent'));
  const defaultPreset = SYSTEM_PRESETS[defaultPresetId];

  const srcSystemsJsonPath = path.join(rootDir, 'data', 'systems.json');
  let primaryManifest = null;
  if (includeLiveMedicalData && fs.existsSync(srcSystemsJsonPath)) {
    try {
      const srcReg = JSON.parse(fs.readFileSync(srcSystemsJsonPath, 'utf8'));
      const foundMed = (srcReg.systems || []).find(s => s.id === 'qalix_medical');
      if (foundMed) primaryManifest = JSON.parse(JSON.stringify(foundMed));
    } catch (_) {}
  }

  if (!primaryManifest) {
    const buyerAgentInfo = buildAgentInfoFromSystem({
      projectName: defaultPreset.projectName || 'Universal Agent Platform',
      titleAr: buyerTitleAr,
      phone: buyerPhone,
      facebookPageUrl: String(options.facebookPageUrl || ''),
      megaTrialUrl: String(options.megaTrialUrl !== undefined ? options.megaTrialUrl : ''),
      packageSha256: ''
    }, buyerTitleAr);

    primaryManifest = {
      id: defaultPreset.id,
      nameAr: defaultPreset.nameAr,
      subtitleAr: defaultPreset.subtitleAr,
      projectName: defaultPreset.projectName || 'Universal Agent Platform',
      licensePrefix: defaultPreset.licensePrefix || 'AGT2',
      isPrimaryDefault: true,
      createdAt: new Date().toISOString(),
      agentInfo: buyerAgentInfo,
      pricing: JSON.parse(JSON.stringify(defaultPreset.pricing || DEFAULT_MEDICAL_PRICING))
    };
  }

  const systemsRegistry = {
    schemaVersion: '1.0',
    activeSystemId: primaryManifest.id,
    updatedAt: new Date().toISOString(),
    systems: [primaryManifest]
  };
  fs.writeFileSync(path.join(dataDest, 'systems.json'), JSON.stringify(systemsRegistry, null, 2), 'utf8');

  // 3. Primary SQLite DB: either live qalix_medical DB (for dedicated Qalix Agents Manager edition) or clean zero-data DB
  const dbDestPath = path.join(dataDest, 'agent.db');
  const srcAgentDbPath = path.join(rootDir, 'data', 'agent.db');
  if (includeLiveMedicalData && fs.existsSync(srcAgentDbPath)) {
    const srcConn = new DatabaseSync(srcAgentDbPath);
    try { srcConn.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {} finally { try { srcConn.close(); } catch (_) {} }
    fs.copyFileSync(srcAgentDbPath, dbDestPath);
    const liveCopyDb = new DatabaseSync(dbDestPath);
    try {
      liveCopyDb.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode = DELETE;');
    } finally { try { liveCopyDb.close(); } catch (_) {} }
  } else {
    const cleanDb = new DatabaseSync(dbDestPath);
    try {
      initSystemSchema(cleanDb);
      cleanDb.prepare("INSERT INTO agent_private_settings(key, value) VALUES('clean_production_mode', '1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
      seedGenericSystemProposals(cleanDb, primaryManifest);
      seedSystemGenesisAudit(cleanDb, 'reseller_clean_release', 'نسخة وكيل متعددة المنظومات مصفرة البيانات وجاهزة للتشغيل التجاري المباشر');
      cleanDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      cleanDb.exec('PRAGMA journal_mode = DELETE;');
    } finally {
      try { cleanDb.close(); } catch (_) {}
    }
    if (!isQalixSuiteEdition && primaryManifest.id === 'universal_agent') {
      const uniSysDir = path.join(dataDest, 'systems', 'universal_agent');
      fs.mkdirSync(uniSysDir, { recursive: true });
      fs.copyFileSync(dbDestPath, path.join(uniSysDir, 'agent.db'));
    }
  }

  // Initialize clean zeroed manager_hub.db (zero key requests, zero sessions, zero synced snapshots)
  const cleanMgrDb = openManagerHubDb(dataDest);
  try {
    cleanMgrDb.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode = DELETE;');
  } finally {
    try { cleanMgrDb.close(); } catch (_) {}
  }

  // 4. Optional additional clean system presets (zero data, separate DB folders)
  const requestedExtras = Array.isArray(options.extraSystemPresets) ? options.extraSystemPresets : [];
  const extraPresets = [...new Set([
    ...(isQalixSuiteEdition ? QALIX_11_SUITE_IDS : []),
    ...requestedExtras
  ])];
  for (const presetId of extraPresets) {
    if (presetId && presetId !== primaryManifest.id && SYSTEM_PRESETS[presetId]) {
      createIsolatedSystem(dataDest, kitsDest, {
        presetId,
        agentPhone: buyerPhone,
        agentTitleAr: `وكيل ${SYSTEM_PRESETS[presetId].nameAr}`,
        activateNow: false
      }, { cleanOwnerPhone: true });
      const extraDbPath = path.join(dataDest, 'systems', presetId, 'agent.db');
      if (fs.existsSync(extraDbPath)) {
        const edb = new DatabaseSync(extraDbPath);
        try { edb.exec('PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode = DELETE;'); } finally { try { edb.close(); } catch (_) {} }
      }
    }
  }

  // Write buyer / Agents Manager quick-start guide (100% Offline Windows v1.0)
  const readmeText = isQalixSuiteEdition
    ? [
      '====================================================================',
      '  كالكس لإدارة الوكلاء والموزعين — Qalix Agents & Distributors',
      '  النسخة التجريبية الأولى (v1.0) — تعمل أوفلاين بالكامل على ويندوز',
      '====================================================================',
      '',
      '1. التثبيت والتشغيل كبرنامج ويندوز حديث بدون نافذة أوامر أو متصفح تقليدي:',
      '   - للتثبيت وإنشاء اختصارات سطح المكتب وقائمة ابدأ بأيقونة كالكس الرسمية:',
      '     شغّل ملف INSTALL_ON_WINDOWS.bat (يثبت البرنامج في مجلد المستخدم القابل للكتابة).',
      '   - أو للتشغيل الفوري المباشر كبرنامج ويندوز مستقل:',
      '     اضغط مرتين على Qalix_Desktop_App.vbs',
      '',
      '2. دستور كالكس — 100% أوفلاين (Air-Gapped):',
      '   - هذه المنظومة والـ 11 منظومة بداخلها تعمل محلياً بالكامل بدون أي اتصال سحابي.',
      '   - جميع البيانات والصفقات والموزعين تُحفظ فوراً وبأمان داخل مجلد data\\ المحلي.',
      '',
      '3. سياسة مفاتيح التراخيص (إصدار يدوي من المنصة فقط):',
      '   - لا تصدر هذه المنظومة ولا أي منظومة من الـ 11 منظومة بداخلها مفاتيح تراخيص.',
      '   - مفاتيح التراخيص تُصدر حصراً داخل المنصة الأم بواسطة المطور، ويجلبها مدير',
      '     الوكلاء ويسلّمها يدوياً للموزع عند الطلب.',
      '',
      '4. الإزالة النظيفة من ويندوز:',
      '   - لإزالة الاختصارات والنسخة المثبتة دون المساس بالنسخة المضغوطة: UNINSTALL_FROM_WINDOWS.bat',
      '====================================================================',
      ''
    ].join('\r\n')
    : [
      '====================================================================',
      '  منظومة إدارة الوكلاء والموزعين الموحدة — Universal Agents & Distributors',
      '  الإصدار الأول (v1.0) — يعمل أوفلاين بالكامل على ويندوز (صفر بيانات)',
      '====================================================================',
      '',
      '1. التثبيت والتشغيل كبرنامج ويندوز مستقل بدون نافذة أوامر:',
      '   - للتثبيت وإنشاء اختصارات سطح المكتب وقائمة ابدأ:',
      '     شغّل ملف INSTALL_ON_WINDOWS.bat (يثبت البرنامج في مجلد المستخدم القابل للكتابة).',
      '   - أو للتشغيل الفوري المباشر كبرنامج ويندوز مستقل:',
      '     اضغط مرتين على Agents_Desktop_App.vbs',
      '',
      '2. التشغيل المحلي الكامل (100% Offline Air-Gapped):',
      '   - تعمل هذه المنظومة محلياً بالكامل بدون أي اتصال سحابي أو خوادم خارجية.',
      '   - جميع البيانات والصفقات والموزعين تُحفظ فوراً وبأمان داخل مجلد data\\ المحلي.',
      '',
      '3. سياسة مفاتيح التراخيص:',
      '   - تصدر مفاتيح التراخيص رسمياً من المنصة الأم المعتمدة ويتم تسليمها عبر مدير الوكلاء.',
      '',
      '4. الإزالة النظيفة من ويندوز:',
      '   - لإزالة الاختصارات والنسخة المثبتة: UNINSTALL_FROM_WINDOWS.bat',
      '====================================================================',
      ''
    ].join('\r\n');
  fs.writeFileSync(path.join(editionDir, 'README_RESELLER_START.txt'), readmeText, 'utf8');

  // 5. Verify zero-data & zero-leak before compressing
  const vDb = new DatabaseSync(dbDestPath);
  const verification = {
    distributors: vDb.prepare('SELECT COUNT(*) AS c FROM distributors').get().c,
    deals: vDb.prepare('SELECT COUNT(*) AS c FROM deals').get().c,
    lead_locks: vDb.prepare('SELECT COUNT(*) AS c FROM lead_locks').get().c,
    clean_production_mode: vDb.prepare("SELECT value FROM agent_private_settings WHERE key='clean_production_mode'").get()?.value || '',
    ownerPhoneValue: vDb.prepare("SELECT value FROM agent_private_settings WHERE key='platform_owner_phone'").get()?.value || '',
    kitsHtmlCount: fs.readdirSync(kitsDest).filter(f => f.endsWith('.html')).length,
    backupsCount: fs.readdirSync(path.join(dataDest, 'backups')).length
  };
  vDb.close();

  // Optional: embed local runtime/node.exe for self-contained Windows Portable ZIP (runs without pre-installed Node.js)
  let includesRuntimeNode = false;
  if (options.includeRuntime === true && process.platform === 'win32' && fs.existsSync(process.execPath)) {
    const runtimeDir = path.join(editionDir, 'runtime');
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.copyFileSync(process.execPath, path.join(runtimeDir, 'node.exe'));
    includesRuntimeNode = true;
  }

  // 6. Create .zip archive cleanly (PowerShell Compress-Archive on Win10/11 or .NET ZipFile fallback on Win7/8 32/64-bit)
  let zipSizeBytes = 0;
  if (options.skipZip !== true) {
    const psSrc = editionDir.replace(/'/g, "''");
    const psDest = zipPath.replace(/'/g, "''");
    const psScript = [
      `if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {`,
      `  Compress-Archive -Path '${psSrc}\\*' -DestinationPath '${psDest}' -Force`,
      `} else {`,
      `  Add-Type -AssemblyName System.IO.Compression.FileSystem;`,
      `  if (Test-Path '${psDest}') { Remove-Item '${psDest}' -Force };`,
      `  [System.IO.Compression.ZipFile]::CreateFromDirectory('${psSrc}', '${psDest}')`,
      `}`
    ].join(' ');
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', psScript
    ], { stdio: 'pipe' });
    if (fs.existsSync(zipPath)) {
      zipSizeBytes = fs.statSync(zipPath).size;
    }
  }

  return {
    ok: true,
    editionName,
    folderPath: editionDir,
    zipFilename: options.skipZip !== true ? zipFilename : null,
    zipPath: options.skipZip !== true ? zipPath : null,
    zipSizeBytes,
    zipSizeMB: (zipSizeBytes / (1024 * 1024)).toFixed(2),
    includesRuntimeNode,
    systemsIncluded: [primaryManifest.id, ...extraPresets.filter(p => p !== primaryManifest.id && SYSTEM_PRESETS[p])],
    verification
  };
}

module.exports = {
  buildCleanResellerEdition,
  generateWindowsOneClickInstallBat,
  generateWindowsUninstallBat
};

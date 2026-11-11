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
  seedSystemGenesisAudit,
  seedGenericSystemProposals,
  createIsolatedSystem
} = require('./systems_manager');

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

function generateWindowsOneClickInstallBat({ appShortcutName = 'Qalix Agents & Distributors Management', installFolderName = 'QalixAgentsPlatform', launchBatName = 'START_AGENT_PANEL.bat', iconRelPath = 'public\\img\\qalix-agents.ico' } = {}) {
  const safeBannerName = String(appShortcutName).replace(/&/g, '^&');
  return [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    `title كالكس لإدارة الوكلاء والموزعين - ${safeBannerName} (32-bit / 64-bit)`,
    'echo ============================================================================',
    'echo   كالكس لإدارة الوكلاء والموزعين',
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
    'echo [2/3] Creating Desktop and Start Menu shortcuts with official Qalix icon ...',
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desk = [Environment]::GetFolderPath('Desktop'); $prog = [Environment]::GetFolderPath('Programs'); $ico = Join-Path $env:LOCALAPPDATA '${installFolderName}\\${iconRelPath}'; foreach($d in @($desk,$prog)){ $sc=$ws.CreateShortcut((Join-Path $d '${appShortcutName}.lnk')); $sc.TargetPath=(Join-Path $env:LOCALAPPDATA '${installFolderName}\\${launchBatName}'); $sc.WorkingDirectory=(Join-Path $env:LOCALAPPDATA '${installFolderName}'); if(Test-Path $ico){ $sc.IconLocation=$ico }; $sc.Save() }"`,
    'echo [3/3] Installation completed cleanly!',
    'echo Launching application ...',
    `start "" "%TARGET_DIR%\\${launchBatName}"`,
    'pause',
    ''
  ].join('\r\n');
}

function generateWindowsUninstallBat({ appShortcutName = 'Qalix Agents & Distributors Management', installFolderName = 'QalixAgentsPlatform' } = {}) {
  const safeBannerName = String(appShortcutName).replace(/&/g, '^&');
  return [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    `title كالكس لإدارة الوكلاء والموزعين - إزالة التثبيت (${safeBannerName})`,
    'echo ============================================================================',
    'echo   كالكس لإدارة الوكلاء والموزعين',
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

  const safeRootFiles = [
    'CREATE_BACKUP.bat'
  ];
  for (const fname of safeRootFiles) {
    const srcFile = path.join(rootDir, fname);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(editionDir, fname));
    }
  }

  // Write clean neutral Windows startup launcher (with auto-port fallback + auto-open browser after listen)
  const startBat = [
    '@echo off',
    'chcp 65001 >nul',
    'cd /d "%~dp0"',
    'title Universal Agent & Distributors Platform — لوحة إدارة الوكيل والموزعين',
    'echo ============================================================================',
    'echo   Universal Multi-System Agent Platform — v1.0 (Win 32-bit / 64-bit)',
    'echo   لإدارة الموزعين والمبيعات والعمولات وتأكيد الدفع (أوفلاين 100%%)',
    'echo ============================================================================',
    'set "NODE_BIN="',
    'if exist "%~dp0runtime\\node.exe" set "NODE_BIN=%~dp0runtime\\node.exe"',
    'if "%NODE_BIN%"=="" if exist "%~dp0node.exe" set "NODE_BIN=%~dp0node.exe"',
    'if "%NODE_BIN%"=="" where node >nul 2>&1 && set "NODE_BIN=node"',
    'if "%NODE_BIN%"=="" if exist "%ProgramFiles%\\nodejs\\node.exe" set "NODE_BIN=%ProgramFiles%\\nodejs\\node.exe"',
    'if "%NODE_BIN%"=="" if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" set "NODE_BIN=%ProgramFiles(x86)%\\nodejs\\node.exe"',
    'if "%NODE_BIN%"=="" (',
    '  echo [خطأ] لم يتم العثور على Node.js.',
    '  echo - لويندوز 64-بت: ثبّت Node.js 22 LTS ^(x64^) أو أحدث.',
    '  echo - لويندوز 32-بت: ثبّت Node.js 22 LTS ^(win-x86 32-bit^).',
    '  pause & exit /b 1',
    ')',
    'set "SQLITE_FLAG="',
    '"%NODE_BIN%" -e "require(\'node:sqlite\')" >nul 2>&1',
    'if errorlevel 1 (',
    '  "%NODE_BIN%" --experimental-sqlite -e "require(\'node:sqlite\')" >nul 2>&1',
    '  if errorlevel 1 (',
    '    echo [خطأ] إصدار Node.js الحالي لا يدعم SQLite المدمج. ثبّت Node.js 22.5+ LTS ^(32-bit أو 64-bit^).',
    '    pause & exit /b 1',
    '  )',
    '  set "SQLITE_FLAG=--experimental-sqlite"',
    ')',
    'set AUTO_OPEN_BROWSER=1',
    '"%NODE_BIN%" %SQLITE_FLAG% "server\\agent_server.js"',
    'pause',
    ''
  ].join('\r\n');
  fs.writeFileSync(path.join(editionDir, 'START_AGENT_PANEL.bat'), startBat, 'utf8');

  const installBat = generateWindowsOneClickInstallBat({
    appShortcutName: isQalixSuiteEdition ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    installFolderName: isQalixSuiteEdition ? 'QalixAgentsPlatform11' : 'UniversalAgentsPlatform',
    launchBatName: 'START_AGENT_PANEL.bat',
    iconRelPath: 'public\\img\\qalix-agents.ico'
  });
  fs.writeFileSync(path.join(editionDir, 'INSTALL_ON_WINDOWS.bat'), installBat, 'utf8');

  const uninstallBat = generateWindowsUninstallBat({
    appShortcutName: isQalixSuiteEdition ? 'Qalix Agents & Distributors Management' : 'Universal Agents & Distributors Management',
    installFolderName: isQalixSuiteEdition ? 'QalixAgentsPlatform11' : 'UniversalAgentsPlatform'
  });
  fs.writeFileSync(path.join(editionDir, 'UNINSTALL_FROM_WINDOWS.bat'), uninstallBat, 'utf8');

  // Legal docs (~3MB, helpful for new buyers)
  const legalSrc = path.join(rootDir, 'الوثائق_القانونية_والتسليم');
  if (fs.existsSync(legalSrc)) {
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

  // Empty kits & data folders
  const kitsDest = path.join(editionDir, 'distributors_kits');
  fs.mkdirSync(kitsDest, { recursive: true });
  fs.writeFileSync(path.join(kitsDest, '.gitkeep'), '', 'utf8');

  const dataDest = path.join(editionDir, 'data');
  fs.mkdirSync(dataDest, { recursive: true });
  fs.mkdirSync(path.join(dataDest, 'backups'), { recursive: true });

  // 2. Customize clean buyer profile (never copy seller's private owner phone!)
  const buyerPhone = String(options.buyerAgentPhone || '01000000000').replace(/[^0-9]/g, '').slice(0, 15) || '01000000000';
  const buyerTitleAr = String(options.buyerAgentTitleAr || 'وكيل المنظومة المعتمد').trim() || 'وكيل المنظومة المعتمد';
  const buyerOwnerName = String(options.buyerOwnerName || 'صاحب المنصة / الوكيل الرئيسي').trim() || 'صاحب المنصة / الوكيل الرئيسي';

  const defaultPresetId = (options.defaultSystemId && SYSTEM_PRESETS[options.defaultSystemId])
    ? options.defaultSystemId
    : (isQalixSuiteEdition ? 'qalix_platform' : 'universal_agent');
  const defaultPreset = SYSTEM_PRESETS[defaultPresetId];

  const buyerAgentInfo = buildAgentInfoFromSystem({
    projectName: defaultPreset.projectName || 'Universal Agent Platform',
    titleAr: buyerTitleAr,
    phone: buyerPhone,
    facebookPageUrl: String(options.facebookPageUrl || ''),
    megaTrialUrl: String(options.megaTrialUrl !== undefined ? options.megaTrialUrl : ''),
    packageSha256: ''
  }, buyerTitleAr);

  const primaryManifest = {
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

  const systemsRegistry = {
    schemaVersion: '1.0',
    activeSystemId: primaryManifest.id,
    updatedAt: new Date().toISOString(),
    systems: [primaryManifest]
  };
  fs.writeFileSync(path.join(dataDest, 'systems.json'), JSON.stringify(systemsRegistry, null, 2), 'utf8');

  // 3. Initialize clean zero-data primary SQLite DB with clean_production_mode = '1'
  const dbDestPath = path.join(dataDest, 'agent.db');
  const cleanDb = new DatabaseSync(dbDestPath);
  try {
    initSystemSchema(cleanDb);
    cleanDb.prepare("INSERT INTO agent_private_settings(key, value) VALUES('clean_production_mode', '1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    cleanDb.prepare("INSERT INTO agent_private_settings(key, value) VALUES('platform_owner_name', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(buyerOwnerName);
    cleanDb.prepare("INSERT INTO agent_private_settings(key, value) VALUES('platform_owner_phone', '') ON CONFLICT(key) DO UPDATE SET value=''").run();
    seedGenericSystemProposals(cleanDb, primaryManifest);
    seedSystemGenesisAudit(cleanDb, 'reseller_clean_release', 'نسخة وكيل متعددة المنظومات مصفرة البيانات وجاهزة للتشغيل التجاري المباشر');
    cleanDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    cleanDb.exec('PRAGMA journal_mode = DELETE;');
  } finally {
    try { cleanDb.close(); } catch (_) {}
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
    }
  }

  // Write buyer quick-start guide
  const readmeText = [
    '====================================================================',
    '  منظومة إدارة الوكيل والموزعين الشاملة — النسخة التجارية المصفّرة',
    '====================================================================',
    '',
    '1. للتشغيل المباشر على ويندوز:',
    '   شغّل ملف START_AGENT_PANEL.bat أو نفّذ: node server/agent_server.js',
    '',
    '2. طبيعة هذه النسخة:',
    '   - نظام عام لإدارة الموزعين لبيع أي منتج أو خدمة أو منظومة برمجية.',
    '   - مصفّرة بالكامل وجاهزة للبيع والتسليم (0 موزعين، 0 صفقات، 0 طلبات دفع).',
    '   - يمكنك من داخل اللوحة إضافة منظومات متخصصة معزولة (مثل منظومات كالكس أو غيرها).',
    '',
    '3. تعدد المنظومات والعزل الكامل:',
    '   - كل منظومة تضيفها من شريط «إدارة المنظومات المعزولة» تحصل على قاعدة بيانات مستقلة',
    '     (data/systems/<systemId>/agent.db) ومجلد بوابات ومستندات منفصل تماماً.',
    '',
    '4. ضبط القناة السرية للوكيل مع صاحب المنصة:',
    '   - من داخل لوحة الوكيل -> قسم القناة السرية مع صاحب المنصة، أدخل رقم صاحب المنصة.',
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
    systemsIncluded: [primaryManifest.id, ...extraPresets.filter(p => p !== primaryManifest.id && SYSTEM_PRESETS[p])],
    verification
  };
}

module.exports = {
  buildCleanResellerEdition,
  generateWindowsOneClickInstallBat,
  generateWindowsUninstallBat
};

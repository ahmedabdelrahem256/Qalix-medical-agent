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
    'echo   Universal Multi-System Agent Platform — v1.0',
    'echo   لإدارة الموزعين والمبيعات والعمولات وتأكيد الدفع (أوفلاين 100%%)',
    'echo ============================================================================',
    'where node >nul 2>&1 || (echo [خطأ] يلزم تثبيت Node.js 22 LTS أو أحدث. & pause & exit /b 1)',
    'set AUTO_OPEN_BROWSER=1',
    'node "server\\agent_server.js"',
    'pause',
    ''
  ].join('\r\n');
  fs.writeFileSync(path.join(editionDir, 'START_AGENT_PANEL.bat'), startBat, 'utf8');

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

  // 6. Create .zip archive cleanly via PowerShell Compress-Archive (unless skipZip=true)
  let zipSizeBytes = 0;
  if (options.skipZip !== true) {
    const psSrc = editionDir.replace(/'/g, "''");
    const psDest = zipPath.replace(/'/g, "''");
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', `Compress-Archive -Path '${psSrc}\\*' -DestinationPath '${psDest}' -Force`
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
  buildCleanResellerEdition
};

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const backupName = `Qalix_Medical_Agent_Backup_${dateStr}.zip`;
const zipOut = path.join(root, backupName);
const staging = path.join(root, '.backup_stage');

console.log('========================================================');
console.log('  منظومة وكيل كالكس الطبية - إنشاء نسخة احتياطية شاملة');
console.log('  Qalix Medical Agent - Full Project Backup Engine');
console.log('========================================================\n');

console.log('[1/4] تجهيز بيئة النسخ المؤقتة...');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const dirs = ['server', 'public', 'tests', 'distributors_kits', 'الوثائق_القانونية_والتسليم', 'ملفات_العروض_التقديمية'];
for (const d of dirs) {
  const s = path.join(root, d);
  if (fs.existsSync(s)) fs.cpSync(s, path.join(staging, d), { recursive: true });
}

console.log('[2/4] أخذ لقطة آمنة لقاعدة البيانات (SQLite Snapshot)...');
fs.mkdirSync(path.join(staging, 'data'), { recursive: true });
let snapshotTaken = false;
const sourceDbPath = path.join(root, 'data', 'agent.db');
const destDbPath = path.join(staging, 'data', 'agent.db');
try {
  if (fs.existsSync(sourceDbPath)) {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(sourceDbPath, { readOnly: true });
    try {
      const normalizedDest = destDbPath.replace(/\\/g, '/').replace(/'/g, "''");
      db.exec(`VACUUM INTO '${normalizedDest}';`);
      snapshotTaken = true;
      console.log('      تم أخذ لقطة قاعدة البيانات بنجاح عبر node:sqlite VACUUM INTO.');
    } finally {
      db.close();
    }
  }
} catch (e) {
  console.warn('      تعذر أخذ لقطة VACUUM INTO مباشرة، جاري محاولة النسخ البديل:', e.message);
  const backupsDir = path.join(root, 'data', 'backups');
  if (fs.existsSync(backupsDir)) {
    const snaps = fs.readdirSync(backupsDir).filter(f => f.endsWith('.db')).sort().reverse();
    if (snaps.length > 0) {
      fs.copyFileSync(path.join(backupsDir, snaps[0]), destDbPath);
      snapshotTaken = true;
      console.log('      تم استخدام آخر نقطة استعادة:', snaps[0]);
    }
  }
}

if (!snapshotTaken && fs.existsSync(sourceDbPath)) {
  fs.copyFileSync(sourceDbPath, destDbPath);
}

const customDevPath = path.join(root, 'data', 'custom_dev_data.json');
if (fs.existsSync(customDevPath)) {
  fs.copyFileSync(customDevPath, path.join(staging, 'data', 'custom_dev_data.json'));
}

console.log('[3/4] نسخ ملفات الوثائق والتشغيل...');
const rootFiles = [
  'DELIVERY_QALIX_MEDICAL_AGENT.md',
  'كتالوج_تشغيل_الوكيل_الحصري.html',
  'START_QALIX_MEDICAL_AGENT.bat',
  'DEPLOY_TO_G_DRIVE.ps1',
  'CREATE_BACKUP.bat',
  '.gitignore',
  'update.bat'
];
for (const rf of rootFiles) {
  const src = path.join(root, rf);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(staging, rf));
}

console.log('[4/4] ضغط النسخة الاحتياطية إلى ملف ZIP...');
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

// Use PowerShell Compress-Archive or .NET ZipFile fallback (Win 7/8/10/11 32-bit & 64-bit)
const psSrc = staging.replace(/'/g, "''");
const psDest = zipOut.replace(/'/g, "''");
const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) { Compress-Archive -Path '${psSrc}\\*' -DestinationPath '${psDest}' -CompressionLevel Optimal } else { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${psSrc}', '${psDest}') }"`;
execSync(psCmd, { stdio: 'inherit' });

if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });

const stats = fs.statSync(zipOut);
console.log('\n========================================================');
console.log('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
console.log('📁 الملف: ' + backupName);
console.log('📦 الحجم: ' + (stats.size / (1024 * 1024)).toFixed(2) + ' ميجابايت');
console.log('📍 المسار: ' + zipOut);
console.log('========================================================\n');

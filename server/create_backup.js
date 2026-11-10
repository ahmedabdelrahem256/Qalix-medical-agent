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
try {
  const Database = require('better-sqlite3');
  const db = new Database(path.join(root, 'data', 'agent.db'), { readonly: true });
  db.backup(path.join(staging, 'data', 'agent.db'));
  db.close();
  snapshotTaken = true;
  console.log('      تم أخذ لقطة قاعدة البيانات بنجاح عبر SQLite Backup API.');
} catch (e) {
  const backupsDir = path.join(root, 'data', 'backups');
  if (fs.existsSync(backupsDir)) {
    const snaps = fs.readdirSync(backupsDir).filter(f => f.endsWith('.db')).sort().reverse();
    if (snaps.length > 0) {
      fs.copyFileSync(path.join(backupsDir, snaps[0]), path.join(staging, 'data', 'agent.db'));
      snapshotTaken = true;
      console.log('      تم استخدام آخر نقطة استعادة:', snaps[0]);
    }
  }
}

if (!snapshotTaken && fs.existsSync(path.join(root, 'data', 'agent.db'))) {
  fs.copyFileSync(path.join(root, 'data', 'agent.db'), path.join(staging, 'data', 'agent.db'));
}

console.log('[3/4] نسخ ملفات الوثائق والتشغيل...');
const rootFiles = [
  'DELIVERY_QALIX_MEDICAL_AGENT.md',
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

// Use PowerShell Compress-Archive
const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipOut}' -CompressionLevel Optimal"`;
execSync(psCmd, { stdio: 'inherit' });

if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });

const stats = fs.statSync(zipOut);
console.log('\n========================================================');
console.log('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
console.log('📁 الملف: ' + backupName);
console.log('📦 الحجم: ' + (stats.size / (1024 * 1024)).toFixed(2) + ' ميجابايت');
console.log('📍 المسار: ' + zipOut);
console.log('========================================================\n');

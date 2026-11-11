/* Qalix Medical Agent — Automated Database Backup & Snapshot Manager (Phase 5)
 * 100% Offline Air-Gapped · Zero External Dependencies · SQLite Snapshot & Export
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

function ensureBackupsDir(dataDir) {
  const backupsDir = path.join(dataDir, 'backups');
  fs.mkdirSync(backupsDir, { recursive: true });
  return backupsDir;
}

function createDatabaseSnapshot(db, dataDir) {
  const backupsDir = ensureBackupsDir(dataDir);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupFilename = `agent_snapshot_${timestamp}.db`;
  const backupPath = path.join(backupsDir, backupFilename);

  // First flush WAL to ensure all transactions are on disk
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (e) {
    // checkpoint fallback
  }

  // Attempt VACUUM INTO for consistent online snapshot
  let method = 'vacuum_into';
  try {
    // SQLite expects forward slashes and doubled single quotes in paths
    const normalizedPath = backupPath.replace(/\\/g, '/').replace(/'/g, "''");
    db.exec(`VACUUM INTO '${normalizedPath}';`);
  } catch (err) {
    // Fallback: Copy raw agent.db if VACUUM INTO is not supported
    method = 'file_copy';
    const mainDbPath = path.join(dataDir, 'agent.db');
    fs.copyFileSync(mainDbPath, backupPath);
  }

  // Compute SHA-256 of the created snapshot
  const fileBytes = fs.readFileSync(backupPath);
  const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');
  const sizeBytes = fileBytes.length;

  const metadata = {
    filename: backupFilename,
    path: backupPath,
    createdAt: now.toISOString(),
    sizeBytes,
    sha256,
    method
  };

  // Save companion metadata JSON
  fs.writeFileSync(`${backupPath}.meta.json`, JSON.stringify(metadata, null, 2), 'utf8');

  return metadata;
}

function listDatabaseSnapshots(dataDir) {
  const backupsDir = ensureBackupsDir(dataDir);
  const files = fs.readdirSync(backupsDir);
  const snapshots = [];

  for (const f of files) {
    if (f.endsWith('.db')) {
      const fullPath = path.join(backupsDir, f);
      const metaPath = `${fullPath}.meta.json`;
      let meta = null;
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch (e) {}
      }

      const stat = fs.statSync(fullPath);
      snapshots.push(meta || {
        filename: f,
        path: fullPath,
        createdAt: stat.birthtime.toISOString(),
        sizeBytes: stat.size,
        sha256: 'computed_on_demand',
        method: 'disk_scan'
      });
    }
  }

  // Sort newest first
  snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return snapshots;
}

function exportFullSystemJson(db) {
  const distributors = db.prepare('SELECT * FROM distributors ORDER BY created_at DESC').all();
  const deals = db.prepare('SELECT * FROM deals ORDER BY created_at DESC').all();
  const auditLogs = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all();
  const proposals = db.prepare('SELECT * FROM excellence_proposals ORDER BY created_at DESC').all();
  let leadLocks = [];
  try {
    leadLocks = db.prepare('SELECT * FROM lead_locks ORDER BY locked_at DESC').all();
  } catch (e) {
    leadLocks = [];
  }

  const exportObj = {
    exportedAt: new Date().toISOString(),
    agentPhone: '01122166076',
    systemTitle: 'Qalix Medical Agent Database Full Export',
    summary: {
      distributorsCount: distributors.length,
      dealsCount: deals.length,
      auditRecordsCount: auditLogs.length,
      proposalsCount: proposals.length,
      leadLocksCount: leadLocks.length
    },
    data: {
      distributors,
      deals,
      auditLogs,
      proposals,
      leadLocks
    }
  };

  const jsonStr = JSON.stringify(exportObj, null, 2);
  const sha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');

  return {
    jsonStr,
    sha256,
    summary: exportObj.summary
  };
}

/**
 * يتحقق من سلامة ملف نسخة احتياطية SQLite عبر PRAGMA integrity_check ووجود الجداول الأساسية.
 */
function verifySnapshotFile(backupPath) {
  if (!backupPath || !fs.existsSync(backupPath)) {
    throw new Error('ملف نقطة الاستعادة غير موجود');
  }
  const st = fs.statSync(backupPath);
  if (!st.isFile() || st.size < 1024) {
    throw new Error('ملف نقطة الاستعادة تالف أو فارغ');
  }
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(backupPath)).digest('hex');
  const chkDb = new DatabaseSync(backupPath, { readOnly: true });
  try {
    const chk = chkDb.prepare('PRAGMA integrity_check;').get();
    if (!chk || chk.integrity_check !== 'ok') {
      throw new Error(`فشل فحص سلامة قاعدة البيانات: ${chk?.integrity_check || 'corrupted'}`);
    }
    const tables = new Set(
      chkDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name)
    );
    for (const reqTable of ['distributors', 'deals', 'audit_log']) {
      if (!tables.has(reqTable)) {
        throw new Error(`الملف لا يحتوي على الجدول الأساسي المطلوب: ${reqTable}`);
      }
    }
    return {
      ok: true,
      integrity: 'ok',
      sha256,
      sizeBytes: st.size,
      counts: {
        distributors: chkDb.prepare('SELECT COUNT(*) AS c FROM distributors').get().c,
        deals: chkDb.prepare('SELECT COUNT(*) AS c FROM deals').get().c,
        auditLogs: chkDb.prepare('SELECT COUNT(*) AS c FROM audit_log').get().c
      }
    };
  } finally {
    try { chkDb.close(); } catch (_) {}
  }
}

/**
 * استعادة آمنة لقاعدة بيانات الوكيل مع التحقق المسبق وأخذ نقطة أمان لحظية قبل الاستبدال.
 */
function restoreDatabaseSnapshot(currentDb, dataDir, filename, targetDbPath, hooks = {}) {
  const safeName = path.basename(String(filename || '').trim());
  if (!safeName || !safeName.endsWith('.db') || safeName !== String(filename || '').trim()) {
    throw new Error('اسم ملف النسخة الاحتياطية غير صالح');
  }
  const backupsDir = ensureBackupsDir(dataDir);
  const backupPath = path.join(backupsDir, safeName);
  const verification = verifySnapshotFile(backupPath);
  const preRestoreSnapshot = createDatabaseSnapshot(currentDb, dataDir);

  if (typeof hooks.closeActiveDb === 'function') {
    hooks.closeActiveDb();
  }
  try {
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = targetDbPath + suffix;
      if (fs.existsSync(sidecar)) {
        try { fs.unlinkSync(sidecar); } catch (_) {}
      }
    }
    fs.copyFileSync(backupPath, targetDbPath);
  } finally {
    if (typeof hooks.reopenActiveDb === 'function') {
      hooks.reopenActiveDb();
    }
  }

  return {
    ok: true,
    restoredFilename: safeName,
    verification,
    preRestoreSnapshot
  };
}

module.exports = {
  createDatabaseSnapshot,
  listDatabaseSnapshots,
  exportFullSystemJson,
  verifySnapshotFile,
  restoreDatabaseSnapshot
};

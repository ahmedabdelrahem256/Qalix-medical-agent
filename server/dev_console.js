/* Qalix Medical Agent - Developer Console & System Administration Engine
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createDatabaseSnapshot } = require('./backup_manager');
const { MARKETING_MATERIALS } = require('./marketing_kit');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
const CUSTOM_DATA_FILE = path.join(DATA_DIR, 'custom_dev_data.json');

const PRESENTATIONS_DIR = process.env.DATA_DIR ? path.join(DATA_DIR, 'presentations') : path.join(ROOT_DIR, 'ملفات_العروض_التقديمية');
const VIDEOS_DIR = path.join(PRESENTATIONS_DIR, 'فيديو_تسويقي');
const IMAGES_DIR = path.join(PRESENTATIONS_DIR, 'صور');

// Ensure target directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

function getCustomDataFile(dataDir) {
  const dir = dataDir || DATA_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'custom_dev_data.json');
}

function loadCustomData(dataDir) {
  const filePath = getCustomDataFile(dataDir);
  if (!fs.existsSync(filePath)) {
    const initial = {
      customWhatsAppTemplates: [],
      customVideos: [],
      customPricing: null,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (_) {
    return { customWhatsAppTemplates: [], customVideos: [] };
  }
}

function saveCustomData(data, dataDir) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(getCustomDataFile(dataDir), JSON.stringify(data, null, 2), 'utf8');
}

// Hydrate MARKETING_MATERIALS with saved custom data on load
function syncCustomMaterials() {
  const custom = loadCustomData();
  if (Array.isArray(custom.customWhatsAppTemplates)) {
    for (const t of custom.customWhatsAppTemplates) {
      if (!MARKETING_MATERIALS.whatsAppTemplates.some(x => x.id === t.id)) {
        MARKETING_MATERIALS.whatsAppTemplates.push(t);
      }
    }
  }
  if (Array.isArray(custom.customVideos)) {
    for (const v of custom.customVideos) {
      if (!MARKETING_MATERIALS.marketingVideos.some(x => x.id === v.id)) {
        MARKETING_MATERIALS.marketingVideos.push(v);
      }
    }
  }
  if (Array.isArray(custom.customImages)) {
    for (const img of custom.customImages) {
      if (!MARKETING_MATERIALS.clinicalGallery.some(x => x.id === img.id)) {
        MARKETING_MATERIALS.clinicalGallery.unshift(img);
      }
    }
  }
}

// Run initial sync
syncCustomMaterials();

/* ---------------- 1. Safe Data Reset Operations ---------------- */

function resetDealsOnly(db, dataDir) {
  // Always create a safety snapshot before resetting
  const targetDir = dataDir || DATA_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const backup = createDatabaseSnapshot(db, targetDir);

  db.prepare('DELETE FROM deals').run();
  try { db.prepare('DELETE FROM payment_requests').run(); } catch (_) {}
  try { db.prepare('DELETE FROM unified_workflow_cases').run(); } catch (_) {}
  try { db.prepare("DELETE FROM audit_log WHERE action IN ('create_deal', 'settle_deal', 'payment_request_approved')").run(); } catch (_) {}
  try { db.prepare("DELETE FROM audit_logs WHERE action IN ('create_deal', 'settle_deal', 'payment_request_approved')").run(); } catch (_) {}

  return {
    ok: true,
    message: 'تم تصفير وحذف كافة الصفقات بنجاح بعد أخذ نسخة احتياطية آمنة.',
    safetyBackup: backup.filename
  };
}

function resetAllDataFactory(db, seedDistributorsFn, dataDir) {
  // Always create a safety snapshot before resetting
  const targetDir = dataDir || DATA_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const backup = createDatabaseSnapshot(db, targetDir);

  db.prepare('DELETE FROM deals').run();
  try { db.prepare('DELETE FROM payment_requests').run(); } catch (_) {}
  try { db.prepare('DELETE FROM trial_stage_reports').run(); } catch (_) {}
  try { db.prepare('DELETE FROM unified_workflow_cases').run(); } catch (_) {}
  try { db.prepare('DELETE FROM distributor_field_team').run(); } catch (_) {}
  try { db.prepare('DELETE FROM lead_locks').run(); } catch (_) {}
  db.prepare('DELETE FROM distributors').run();
  try { db.prepare('DELETE FROM audit_log').run(); } catch (_) {}
  try { db.prepare('DELETE FROM audit_logs').run(); } catch (_) {}

  // Re-seed distributors if function provided
  if (typeof seedDistributorsFn === 'function') {
    seedDistributorsFn();
  }

  return {
    ok: true,
    message: 'تمت إعادة ضبط المصنع وتصفير كامل البيانات بعد أخذ نسخة احتياطية آمنة.',
    safetyBackup: backup.filename
  };
}

function clearAuditLogsOnly(db, dataDir) {
  const targetDir = dataDir || DATA_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const backup = createDatabaseSnapshot(db, targetDir);
  try { db.prepare('DELETE FROM audit_log').run(); } catch (_) {}
  try { db.prepare('DELETE FROM audit_logs').run(); } catch (_) {}
  return {
    ok: true,
    message: 'تم تصفير سجل التدقيق الجنائي بنجاح بعد أرشفته في نسخة احتياطية.',
    safetyBackup: backup.filename
  };
}

/* ---------------- 2. Custom Marketing & WhatsApp Scripts ---------------- */

function addCustomWhatsAppTemplate(template, dataDir) {
  if (!template.title || !template.text) {
    throw new Error('يرجى إدخال عنوان الرسالة ونصها.');
  }

  const id = 'custom_wa_' + Date.now();
  const entry = {
    id,
    title: template.title.trim(),
    category: template.category ? template.category.trim() : 'رسالة مخصصة',
    target: template.target ? template.target.trim() : 'أطباء مستهدفون',
    text: template.text.trim()
  };

  const custom = loadCustomData(dataDir);
  custom.customWhatsAppTemplates = custom.customWhatsAppTemplates || [];
  custom.customWhatsAppTemplates.push(entry);
  saveCustomData(custom, dataDir);

  MARKETING_MATERIALS.whatsAppTemplates.push(entry);
  return { ok: true, template: entry };
}

/* ---------------- 3. Media Upload & Management ---------------- */

function uploadMediaFileStream(req, filename, category) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filename).toLowerCase();
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const safeName = `${safeBase}_${Date.now()}${ext}`;

    let destDir = PRESENTATIONS_DIR;
    let urlPrefix = '/presentations/';

    if (category === 'video' || ext === '.mp4' || ext === '.webm') {
      destDir = VIDEOS_DIR;
      urlPrefix = '/presentations/فيديو_تسويقي/';
    } else if (category === 'screenshot' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
      destDir = IMAGES_DIR;
      urlPrefix = '/presentations/صور/';
    }

    const targetPath = path.join(destDir, safeName);
    const writeStream = fs.createWriteStream(targetPath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stats = fs.statSync(targetPath);
      const fileUrl = urlPrefix + encodeURIComponent(safeName);

      // If it's a video, automatically register it in marketing videos list
      if (category === 'video' || ext === '.mp4' || ext === '.webm') {
        const videoEntry = {
          id: 'video_custom_' + Date.now(),
          title: safeBase.replace(/_/g, ' '),
          description: `فيديو تسويقي مخصص تم رفعه بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
          url: fileUrl
        };
        const custom = loadCustomData();
        custom.customVideos = custom.customVideos || [];
        custom.customVideos.push(videoEntry);
        saveCustomData(custom);
        MARKETING_MATERIALS.marketingVideos.unshift(videoEntry);
      } else if (category === 'screenshot' || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
        const imgEntry = {
          id: 'img_custom_' + Date.now(),
          title: safeBase.replace(/_/g, ' '),
          subtitle: `صورة مخصصة تم رفعها بتاريخ ${new Date().toLocaleDateString('ar-EG')}`,
          image: fileUrl,
          tags: ['مرفوعة من لوحة المطور', 'تسويق']
        };
        const custom = loadCustomData();
        custom.customImages = custom.customImages || [];
        custom.customImages.push(imgEntry);
        saveCustomData(custom);
        MARKETING_MATERIALS.clinicalGallery.unshift(imgEntry);
      }

      resolve({
        ok: true,
        filename: safeName,
        path: targetPath,
        sizeBytes: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        url: fileUrl,
        category: category || (ext === '.mp4' ? 'video' : 'image')
      });
    });

    writeStream.on('error', err => reject(err));
  });
}

function listAllMedia() {
  const result = {
    videos: [],
    images: []
  };

  if (fs.existsSync(VIDEOS_DIR)) {
    const vFiles = fs.readdirSync(VIDEOS_DIR);
    for (const vf of vFiles) {
      const p = path.join(VIDEOS_DIR, vf);
      const st = fs.statSync(p);
      result.videos.push({
        name: vf,
        sizeMB: (st.size / (1024 * 1024)).toFixed(2),
        updatedAt: st.mtime,
        url: '/presentations/فيديو_تسويقي/' + encodeURIComponent(vf)
      });
    }
  }

  if (fs.existsSync(IMAGES_DIR)) {
    const iFiles = fs.readdirSync(IMAGES_DIR);
    for (const ifile of iFiles) {
      const p = path.join(IMAGES_DIR, ifile);
      const st = fs.statSync(p);
      result.images.push({
        name: ifile,
        sizeKB: (st.size / 1024).toFixed(1),
        updatedAt: st.mtime,
        url: '/presentations/صور/' + encodeURIComponent(ifile)
      });
    }
  }

  return result;
}

module.exports = {
  resetDealsOnly,
  resetAllDataFactory,
  clearAuditLogsOnly,
  addCustomWhatsAppTemplate,
  uploadMediaFileStream,
  listAllMedia,
  loadCustomData
};

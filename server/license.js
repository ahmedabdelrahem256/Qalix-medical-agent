/* server/license.js — محقق تراخيص منظومة كالكس لإدارة الوكلاء والموزعين (Ed25519، أوفلاين 100%)
 * -----------------------------------------------------------------------------------------
 * متوافق كلياً مع محرك تراخيص منصة كالكس الموحد (QLX2.<payload>.<signature>) ومع معايير
 * منظومة كالكس ميديكال الطبية:
 *  - فترة تجريبية تلقائية 14 يوماً من أول تشغيل مع منع التلاعب بتأريخ الساعة للخلف.
 *  - تخزين ملفات الساعة والترخيص داخل مجلد بيانات المشروع فقط (دون الاقتراب من قرص C:).
 *  - بصمة جهاز SHA-256 مطابقة تماماً لمنظومة كالكس الطبية ومحرك الإصدار.
 *  - 3 باقات تسعير رسمية موحدة: الأساسية (4,500 ج.م) · المتقدمة (8,500 ج.م) · المؤسسية (18,500 ج.م).
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const SYSTEM_ID = 'qalix-platform';
const ACCEPTED_SYSTEM_IDS = new Set([
  'qalix-platform',
  'qalix_platform',
  'qalix-agents',
  'qalix_agents',
  'universal-agents',
  'universal_agent'
]);
const TRIAL_DAYS = 14;

// المفتاح العام لمنصة كالكس الموحدة (يتحقق فقط ولا يمكنه أبداً توقيع أو إصدار مفاتيح)
const QALIX_PUBLIC_KEY_HEX = '342a869366524be5b2c2dfffc8d032fce89c9bd6326e19c3366e7e1a4807b434';

const EDITIONS = {
  basic: {
    key: 'basic',
    nameAr: 'الباقة الأساسية لإدارة الوكلاء (Agent Basic v1.0)',
    universalNameAr: 'الباقة الأساسية لإدارة الوكلاء والموزعين (Basic v1.0)',
    nameEn: 'Qalix Agents Basic',
    badge: 'Basic (4,500 ج.م)',
    price: 4500,
    maxDistributors: 10,
    maxSystems: 1,
    multiSystem: false,
    ownerOversight: false,
    isTrial: false
  },
  professional: {
    key: 'professional',
    nameAr: 'الباقة المتقدمة للوكلاء (Agent Multi-System Pro v1.0)',
    universalNameAr: 'الباقة المتقدمة متعددة المنظومات (Pro v1.0)',
    nameEn: 'Qalix Agents Pro',
    badge: 'Pro Multi-System (8,500 ج.م)',
    price: 8500,
    maxDistributors: 50,
    maxSystems: 5,
    multiSystem: true,
    ownerOversight: true,
    isTrial: false
  },
  enterprise: {
    key: 'enterprise',
    nameAr: 'الباقة المؤسسية الشاملة بلا حدود (Enterprise v1.0)',
    universalNameAr: 'الباقة المؤسسية الشاملة بلا حدود (Enterprise v1.0)',
    nameEn: 'Qalix Agents Enterprise',
    badge: 'Enterprise Suite (18,500 ج.م)',
    price: 18500,
    maxDistributors: 9999,
    maxSystems: 9999,
    multiSystem: true,
    ownerOversight: true,
    isTrial: false
  },
  trial: {
    key: 'trial',
    nameAr: 'نسخة المعاينة والتجربة المجانية — منظومة الوكلاء (14 يوماً)',
    universalNameAr: 'فترة المعاينة والتجربة المجانية الكاملة (14 يوماً)',
    nameEn: 'Free Trial (14 Days)',
    badge: 'تجربة مجانية 14 يوماً',
    price: 0,
    maxDistributors: 50,
    maxSystems: 15,
    multiSystem: true,
    ownerOversight: true,
    isTrial: true
  }
};

const EDITION_ALIASES = {
  solo: 'basic',
  starter: 'basic',
  basic: 'basic',
  specialty: 'professional',
  pro: 'professional',
  professional: 'professional',
  enterprise: 'enterprise',
  trial: 'trial'
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayIso = () => new Date().toISOString().slice(0, 10);
const b64d = s => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const minDay = (...d) => d.filter(x => DAY_RE.test(x || '')).sort()[0] || null;
const maxDay = (...d) => d.filter(x => DAY_RE.test(x || '')).sort().pop() || null;

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonSafe(filePath, obj) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    /* تجاهل تعذر الكتابة في إحدى النسختين طالما الأخرى متاحة */
  }
}

/**
 * بصمة الجهاز الموحدة (SHA-256 أول 24 خانة) — مطابقة لـ E:\Qalix\license_engine.py ومنظومة كالكس الطبية.
 */
let cachedHwid = null;
function getHardwareId() {
  if (cachedHwid) return cachedHwid;
  const parts = [];
  if (process.platform === 'win32') {
    const queries = process.env.PROCESSOR_ARCHITEW6432
      ? ['reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid /reg:64', 'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid']
      : ['reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid'];
    for (const qCmd of queries) {
      try {
        const out = execSync(qCmd, {
          encoding: 'utf8',
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const m = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
        if (m) {
          parts.push(m[1].trim());
          break;
        }
      } catch {
        /* تجاهل والمحاولة بالمسار القياسي المتوافق مع ويندوز 32/64 بت */
      }
    }
  }
  parts.push(process.env.COMPUTERNAME || os.hostname() || 'QALIX-DEFAULT-NODE');
  parts.push(process.env.PROCESSOR_IDENTIFIER || os.arch() || 'CPU-GENERIC');
  cachedHwid = crypto.createHash('sha256').update(parts.join('::'), 'utf8').digest('hex').slice(0, 24).toUpperCase();
  return cachedHwid;
}

function resolvePublicKeyHex() {
  if (process.env.NODE_ENV === 'test' && process.env.QALIX_LICENSE_TEST_PUBKEY) {
    return String(process.env.QALIX_LICENSE_TEST_PUBKEY).trim();
  }
  return QALIX_PUBLIC_KEY_HEX;
}

let cachedPubKeyHex = null;
let cachedPubKeyObj = null;
function getPublicKeyObject() {
  const hex = resolvePublicKeyHex();
  if (cachedPubKeyObj && cachedPubKeyHex === hex) return cachedPubKeyObj;
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('المفتاح العام للمنصة غير مضبوط بصيغة Ed25519 صحيحة');
  }
  cachedPubKeyObj = crypto.createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(hex, 'hex')]),
    format: 'der',
    type: 'spki'
  });
  cachedPubKeyHex = hex;
  return cachedPubKeyObj;
}

/**
 * يتحقق من توقيع مفتاح التفعيل Ed25519 (صيغة QLX2.<payload>.<signature>) ويعيد الحمولات بعد التحقق.
 */
function verifyToken(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'QLX2') {
    throw new Error('صيغة مفتاح التفعيل غير صحيحة (يجب أن يبدأ بـ QLX2.)');
  }
  const body = b64d(parts[1]);
  const sig = b64d(parts[2]);
  if (sig.length !== 64 || !crypto.verify(null, body, getPublicKeyObject(), sig)) {
    throw new Error('مفتاح التفعيل غير صالح أو تم التلاعب بتوقيعه الرقمي');
  }
  const p = JSON.parse(body.toString('utf8'));
  if (!ACCEPTED_SYSTEM_IDS.has(String(p.sys || '').trim())) {
    throw new Error('هذا المفتاح صادر لمنظومة أخرى وليس لمنظومة إدارة الوكلاء والموزعين');
  }
  const canonicalEd = EDITION_ALIASES[String(p.ed || '').toLowerCase()];
  if (!canonicalEd || !EDITIONS[canonicalEd]) {
    throw new Error('باقة التفعيل في المفتاح غير معروفة');
  }
  if (p.hw && String(p.hw).trim().toUpperCase() !== getHardwareId()) {
    throw new Error('هذا المفتاح مقفل على بصمة جهاز آخر ولا يعمل على هذا الجهاز');
  }
  return { ...p, canonicalEd };
}

function getLicenseFiles(baseDataDir) {
  const dir = baseDataDir || process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  return {
    dir,
    licenseFile: path.join(dir, 'license.json'),
    installFile: path.join(dir, 'install.json'),
    clockMirrorFile: path.join(dir, '.trial_clock.json'),
    revocationsFile: path.join(dir, 'revocations.json')
  };
}

/**
 * يعيد الحالة الموثوقة للتاريخ لمنع تدوير ساعة الجهاز للخلف لتمديد الفترة التجريبية.
 * كل الملفات تُحفظ حصراً داخل مجلد بيانات المشروع (بدون الاقتراب من قرص C:).
 */
function syncClockState(files, markTrialUsed = false) {
  const a = readJsonSafe(files.installFile) || {};
  const b = readJsonSafe(files.clockMirrorFile) || {};
  const today = todayIso();
  const firstRun = minDay(a.firstRun, b.firstRun) || today;
  let lastSeen = maxDay(a.lastSeen, b.lastSeen, firstRun, today);
  if (today > lastSeen) lastSeen = today;
  const payload = {
    firstRun,
    lastSeen,
    trialDays: TRIAL_DAYS,
    updatedAt: new Date().toISOString()
  };
  writeJsonSafe(files.installFile, payload);
  if (markTrialUsed || a.firstRun || b.firstRun) {
    writeJsonSafe(files.clockMirrorFile, payload);
  }
  return {
    firstRun,
    lastSeen,
    trustedToday: lastSeen > today ? lastSeen : today
  };
}

const UPDATE_CONTEXT = Buffer.from('QALIX-UPDATE-v1\n');
function verifyUpdateSignature(manifestBytes, sigB64u) {
  try {
    const sig = b64d(sigB64u);
    return sig.length === 64 && crypto.verify(null, Buffer.concat([UPDATE_CONTEXT, Buffer.from(manifestBytes)]), getPublicKeyObject(), sig);
  } catch {
    return false;
  }
}

function parseRevokedSet(rawRev) {
  try {
    const r = JSON.parse(rawRev);
    if (!verifyUpdateSignature(Buffer.from(r.manifest, 'utf8'), r.sig)) return new Set();
    const m = JSON.parse(r.manifest);
    return ACCEPTED_SYSTEM_IDS.has(m.system) && Array.isArray(m.revoked) ? new Set(m.revoked) : new Set();
  } catch {
    return new Set();
  }
}

function buildEditionView(edMeta, isUniversalClean, extra) {
  return {
    ...edMeta,
    displayNameAr: isUniversalClean ? edMeta.universalNameAr : edMeta.nameAr,
    ...extra,
    hardwareId: getHardwareId(),
    trialDaysTotal: TRIAL_DAYS
  };
}

function buildTrialState(files, isUniversalClean, reason) {
  const clk = syncClockState(files, true);
  const exp = new Date(new Date(clk.firstRun).getTime() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10);
  const daysRemaining = Math.max(0, Math.ceil((new Date(exp) - new Date(clk.trustedToday)) / 86400000));
  const isExpired = clk.trustedToday > exp;
  return buildEditionView(EDITIONS.trial, isUniversalClean, {
    edition: 'trial',
    clientName: 'نسخة تجريبية مجانية (14 يوماً)',
    organization: isUniversalClean ? 'منظومة إدارة الوكلاء والموزعين' : 'منظومة كالكس لإدارة الوكلاء والموزعين',
    phone: '',
    city: '',
    issuedAt: clk.firstRun,
    expiresAt: exp,
    isTrial: true,
    isExpired,
    isLocked: isExpired,
    revoked: false,
    daysRemaining,
    licenseKey: null,
    licenseId: null,
    isVerified: false,
    licenseError: reason || null
  });
}

function getEditionsCatalog(isUniversalClean = false) {
  return ['basic', 'professional', 'enterprise'].map(key => {
    const ed = EDITIONS[key];
    return {
      key: ed.key,
      nameAr: isUniversalClean ? ed.universalNameAr : ed.nameAr,
      nameEn: ed.nameEn,
      price: ed.price,
      maxDistributors: ed.maxDistributors,
      maxSystems: ed.maxSystems,
      multiSystem: ed.multiSystem,
      ownerOversight: ed.ownerOversight
    };
  });
}

/**
 * قراءة حالة الترخيص والفترة التجريبية للمنظومة الحالية.
 */
function readLicense(options = {}) {
  const files = getLicenseFiles(options.dataDir);
  const isUniversalClean = Boolean(options.isUniversalClean);
  const clk = syncClockState(files, false);
  let raw = null;
  let revRaw = '';
  try { raw = fs.readFileSync(files.licenseFile, 'utf8'); } catch { /* بدون ترخيص بعد */ }
  try { revRaw = fs.readFileSync(files.revocationsFile, 'utf8'); } catch { /* بدون قائمة إلغاء */ }

  let value;
  if (!raw) {
    value = buildTrialState(files, isUniversalClean, null);
  } else {
    try {
      const parsed = JSON.parse(raw);
      const token = String(parsed.token || '').trim();
      const p = verifyToken(token);
      const edMeta = EDITIONS[p.canonicalEd];
      const isExpired = p.exp !== 'PERPETUAL' && clk.trustedToday > p.exp;
      const isTrial = p.canonicalEd === 'trial';
      const daysRemaining = p.exp === 'PERPETUAL'
        ? null
        : Math.max(0, Math.ceil((new Date(p.exp) - new Date(clk.trustedToday)) / 86400000));

      value = buildEditionView(edMeta, isUniversalClean, {
        edition: p.canonicalEd,
        clientName: p.cn || 'وكيل معتمد',
        organization: p.org || p.cn || '',
        phone: p.ph || '',
        city: p.city || '',
        issuedAt: p.iat,
        expiresAt: p.exp,
        isTrial,
        isExpired,
        isLocked: isExpired,
        revoked: false,
        daysRemaining,
        licenseKey: token,
        licenseId: p.lid,
        isVerified: true,
        licenseError: null
      });
      if (isExpired && !isTrial) value.isTrial = true;
      if (revRaw && parseRevokedSet(revRaw).has(p.lid)) {
        Object.assign(value, {
          isTrial: true,
          isExpired: true,
          isLocked: true,
          revoked: true,
          licenseError: 'تم إيقاف هذا الترخيص من المطور. البيانات محفوظة كما هي للقراءة فقط.'
        });
      }
    } catch (err) {
      value = buildTrialState(files, isUniversalClean, err.message);
    }
  }

  return {
    ...value,
    systemId: SYSTEM_ID,
    editionsCatalog: getEditionsCatalog(isUniversalClean)
  };
}

/**
 * تفعيل المنظومة بمفتاح QLX2 موقّع بالخوارزمية Ed25519 (أوفلاين 100%).
 */
function activateLicense(token, options = {}) {
  const files = getLicenseFiles(options.dataDir);
  const clk = syncClockState(files, false);
  const p = verifyToken(token);
  if (p.exp !== 'PERPETUAL' && clk.trustedToday > p.exp) {
    throw new Error(`هذا المفتاح منتهي الصلاحية بتاريخ ${p.exp}`);
  }
  let revRaw = '';
  try { revRaw = fs.readFileSync(files.revocationsFile, 'utf8'); } catch { /* ignore */ }
  if (revRaw && parseRevokedSet(revRaw).has(p.lid)) {
    throw new Error('تم إيقاف هذا المفتاح من المطور ولا يمكن إعادة تفعيله');
  }
  fs.mkdirSync(files.dir, { recursive: true });
  fs.writeFileSync(
    files.licenseFile,
    JSON.stringify({ token: String(token).trim(), activatedAt: new Date().toISOString() }, null, 2),
    'utf8'
  );
  return readLicense(options);
}

module.exports = {
  SYSTEM_ID,
  ACCEPTED_SYSTEM_IDS,
  TRIAL_DAYS,
  QALIX_PUBLIC_KEY_HEX,
  EDITIONS,
  EDITION_ALIASES,
  getHardwareId,
  verifyToken,
  getEditionsCatalog,
  readLicense,
  activateLicense
};

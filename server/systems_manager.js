/* Qalix Multi-System Manager
 * Guarantees 100% physical isolation per system (separate SQLite DB, kits dir, backups, and custom templates).
 * Default primary system (`qalix_medical`) stays mapped to root data/agent.db and distributors_kits/ for full backwards compatibility.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { initializeTerritoryTables } = require('./territory_protection');

const DEFAULT_MEDICAL_PRICING = {
  basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (عيادة طبيب فردي)',         price: 4500,  maxDoctors: 2,  maxUsers: 4 },
  professional: { id: 'professional', nameAr: 'الباقة التخصصية (العيادات النشطة)',         price: 8500,  maxDoctors: 5,  maxUsers: 12 },
  enterprise:   { id: 'enterprise',   nameAr: 'باقة المراكز الكبرى والفروع (Enterprise)', price: 18500, maxDoctors: 99, maxUsers: 99 }
};

const DEFAULT_AGENT_INFO = {
  projectName: 'Qalix Medical Agent',
  titleAr: 'وكيل منظومة كالكس ميديكال الطبية',
  phone: '01122166076',
  intlPhone: '+201122166076',
  salesHotline: '01122166076',
  supportHotline: '01122166076',
  facebookPageUrl: 'https://www.facebook.com/profile.php?id=61596117518854',
  whatsappUrl: 'https://wa.me/201122166076',
  whatsappSalesUrl: 'https://wa.me/201122166076',
  megaTrialUrl: 'https://mega.nz/file/T6hxgRaK#j7_5EtTGN3TJcgxoOHd_eP-JENFmXHgaxXNlrKO6qGI',
  packageSha256: '0f7ff4448eb11ee1385332edf4233f0b6cc9964f490782800de78efc2b8499f7'
};

const SYSTEM_PRESETS = {
  qalix_platform: {
    id: 'qalix_platform',
    nameAr: 'منصة كالكس الشاملة (متعددة المنظومات)',
    subtitleAr: 'إدارة الموزعين المستقلين والمبيعات بنظام السعر الموحد والعمل 100% أوفلاين',
    projectName: 'Qalix Multi-System Platform',
    licensePrefix: 'QLX2',
    pricing: {
      basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (نشاط / فرع فردي)',            price: 4500,  maxDoctors: 2,  maxUsers: 4 },
      professional: { id: 'professional', nameAr: 'الباقة المتقدمة (الأنشطة والأفرع النشطة)',     price: 8500,  maxDoctors: 5,  maxUsers: 12 },
      enterprise:   { id: 'enterprise',   nameAr: 'باقة المؤسسات والفروع الكبرى (Enterprise)',     price: 18500, maxDoctors: 99, maxUsers: 99 }
    }
  },
  qalix_medical: {
    id: 'qalix_medical',
    nameAr: 'منظومة كالكس ميديكال الطبية',
    subtitleAr: 'العيادات والمراكز الطبية المتخصصة',
    projectName: 'Qalix Medical Agent',
    licensePrefix: 'QLX2',
    pricing: DEFAULT_MEDICAL_PRICING
  },
  qalix_pharmacy: {
    id: 'qalix_pharmacy',
    nameAr: 'منظومة كالكس فارما للصيدليات',
    subtitleAr: 'إدارة الصيدليات، المخزون، النواقص، ونقاط البيع بالباركود',
    projectName: 'Qalix Pharma Agent',
    licensePrefix: 'QPH2',
    pricing: {
      basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (صيدلية فردية)',            price: 3500,  maxDoctors: 1,  maxUsers: 4 },
      professional: { id: 'professional', nameAr: 'الباقة التخصصية (صيدلية مزدحمة + جرد)',     price: 6800,  maxDoctors: 2,  maxUsers: 10 },
      enterprise:   { id: 'enterprise',   nameAr: 'باقة سلاسل الصيدليات والمخازن (Enterprise)', price: 15000, maxDoctors: 99, maxUsers: 99 }
    }
  },
  qalix_pos: {
    id: 'qalix_pos',
    nameAr: 'منظومة كالكس كاشير ونقاط البيع (POS)',
    subtitleAr: 'المحلات التجارية، السوبر ماركت، المطاعم والمخازن أوفلاين',
    projectName: 'Qalix POS Agent',
    licensePrefix: 'QPS2',
    pricing: {
      basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (نقطة بيع واحدة)',       price: 3000,  maxDoctors: 1,  maxUsers: 3 },
      professional: { id: 'professional', nameAr: 'الباقة المتقدمة (كاشير + مخازن + ورديات)', price: 6000,  maxDoctors: 3,  maxUsers: 8 },
      enterprise:   { id: 'enterprise',   nameAr: 'باقة الفروع والمخازن الكبرى (Enterprise)', price: 13500, maxDoctors: 99, maxUsers: 99 }
    }
  },
  qalix_erp: {
    id: 'qalix_erp',
    nameAr: 'منظومة كالكس ERP للمؤسسات',
    subtitleAr: 'المحاسبة المتكاملة، شؤون العاملين، المستودعات وخطوط الإنتاج',
    projectName: 'Qalix ERP Agent',
    licensePrefix: 'QER2',
    pricing: {
      basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (شركة ناشئة)',              price: 6500,  maxDoctors: 5,  maxUsers: 8 },
      professional: { id: 'professional', nameAr: 'الباقة الاحترافية (محاسبة + مخازن + رواتب)', price: 14000, maxDoctors: 15, maxUsers: 25 },
      enterprise:   { id: 'enterprise',   nameAr: 'باقة الشركات والمجموعات القابضة',           price: 28000, maxDoctors: 99, maxUsers: 99 }
    }
  },
  qalix_realestate: {
    id: 'qalix_realestate',
    nameAr: 'منظومة كالكس برو العقارية',
    subtitleAr: 'شركات التطوير والتسويق العقاري وإدارة الأقساط والوحدات',
    projectName: 'Qalix RealEstate Agent',
    licensePrefix: 'QRE2',
    pricing: {
      basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (مكتب تسويق عقاري)',      price: 4000,  maxDoctors: 2,  maxUsers: 5 },
      professional: { id: 'professional', nameAr: 'الباقة المتقدمة (أقساط + عمولات + عقود)',  price: 8500,  maxDoctors: 5,  maxUsers: 15 },
      enterprise:   { id: 'enterprise',   nameAr: 'باقة شركات التطوير والأبراج السكنية',     price: 17500, maxDoctors: 99, maxUsers: 99 }
    }
  }
};

function sanitizeSystemId(raw) {
  const clean = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  if (!clean) return 'sys_' + crypto.randomBytes(3).toString('hex');
  return clean;
}

function buildAgentInfoFromSystem(inputAgent = {}, fallbackTitleAr = 'وكيل منظومة كالكس') {
  const rawPhone = String(inputAgent.phone || DEFAULT_AGENT_INFO.phone).replace(/[^0-9]/g, '').slice(0, 15) || DEFAULT_AGENT_INFO.phone;
  const intlPhone = rawPhone.startsWith('20') ? `+${rawPhone}` : `+2${rawPhone.replace(/^0/, '0')}`;
  const waNum = intlPhone.replace(/^\+/, '');
  return {
    projectName: String(inputAgent.projectName || 'Qalix Agent').trim() || 'Qalix Agent',
    titleAr: String(inputAgent.titleAr || fallbackTitleAr).trim() || fallbackTitleAr,
    phone: rawPhone,
    intlPhone,
    salesHotline: rawPhone,
    supportHotline: rawPhone,
    facebookPageUrl: String(inputAgent.facebookPageUrl || DEFAULT_AGENT_INFO.facebookPageUrl).trim(),
    whatsappUrl: `https://wa.me/${waNum}`,
    whatsappSalesUrl: `https://wa.me/${waNum}`,
    megaTrialUrl: String(inputAgent.megaTrialUrl || '').trim(),
    packageSha256: String(inputAgent.packageSha256 || '').trim()
  };
}

function normalizePricing(pricingInput = {}, fallback = DEFAULT_MEDICAL_PRICING) {
  const out = {};
  for (const key of ['basic', 'professional', 'enterprise']) {
    const base = fallback[key];
    const src = pricingInput[key] || {};
    const price = Number(src.price);
    const maxDoctors = Number(src.maxDoctors);
    const maxUsers = Number(src.maxUsers);
    out[key] = {
      id: key,
      nameAr: String(src.nameAr || base.nameAr).trim() || base.nameAr,
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : base.price,
      maxDoctors: Number.isFinite(maxDoctors) && maxDoctors > 0 ? Math.round(maxDoctors) : base.maxDoctors,
      maxUsers: Number.isFinite(maxUsers) && maxUsers > 0 ? Math.round(maxUsers) : base.maxUsers
    };
  }
  return out;
}

function initSystemSchema(targetDb) {
  targetDb.exec('PRAGMA journal_mode = WAL;');
  targetDb.exec('PRAGMA synchronous = NORMAL;');
  targetDb.exec('PRAGMA foreign_keys = ON;');

  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS distributors (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      governorate TEXT NOT NULL,
      commission_rate REAL NOT NULL DEFAULT 27,
      status TEXT NOT NULL DEFAULT 'active',
      access_pin TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      deal_no TEXT UNIQUE NOT NULL,
      distributor_id TEXT NOT NULL,
      clinic_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      clinic_phone TEXT NOT NULL,
      city TEXT NOT NULL,
      is_assiut INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL,
      fixed_price REAL NOT NULL,
      commission_rate REAL NOT NULL,
      distributor_commission REAL NOT NULL,
      agent_net_amount REAL NOT NULL,
      hardware_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      license_key_ref TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      settled_at TEXT DEFAULT '',
      FOREIGN KEY (distributor_id) REFERENCES distributors(id)
    );

    CREATE TABLE IF NOT EXISTS excellence_proposals (
      id TEXT PRIMARY KEY,
      pillar TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      impact TEXT NOT NULL DEFAULT 'مرتفع جداً',
      priority TEXT NOT NULL DEFAULT 'أولوية قصوى',
      status TEXT NOT NULL DEFAULT 'معتمد للتنفيذ',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      prev_hash TEXT NOT NULL,
      curr_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_private_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  initializeTerritoryTables(targetDb);
}

function seedSystemGenesisAudit(targetDb, action = 'system_clean_init', details = 'تأسيس قاعدة بيانات معزولة بنظام السعر الثابت وحوكمة الموزعين') {
  const count = targetDb.prepare('SELECT COUNT(*) AS c FROM audit_log').get().c;
  if (count > 0) return;
  const at = new Date().toISOString();
  const prevHash = '0'.repeat(64);
  const currHash = crypto.createHash('sha256').update(`${prevHash}|${at}|${action}|${details}`).digest('hex');
  targetDb.prepare('INSERT INTO audit_log(at, action, details, prev_hash, curr_hash) VALUES(?, ?, ?, ?, ?)')
    .run(at, action, details, prevHash, currHash);
}

function seedGenericSystemProposals(targetDb, sysMeta) {
  const propCount = targetDb.prepare('SELECT COUNT(*) AS n FROM excellence_proposals').get().n;
  if (propCount > 0) return;
  const now = new Date().toISOString();
  const ins = targetDb.prepare('INSERT INTO excellence_proposals(id, pillar, title, description, impact, priority, status, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
  const phone = sysMeta?.agentInfo?.phone || DEFAULT_AGENT_INFO.phone;
  const prefix = sysMeta?.licensePrefix || 'QLX2';
  const sysName = sysMeta?.nameAr || 'منظومة كالكس';
  const genericProps = [
    { id: 'gen_01', pillar: 'presentation', title: `سيناريو العرض الميداني في 5 دقائق لـ ${sysName}`, description: `عرض مزايا العمل 100% أوفلاين بدون إنترنت، سرعة البحث والفواتير، والتشفير الكامل على جهاز العميل مقارنة بالأنظمة السحابية ذات الاشتراك الشهري.`, impact: 'يرفع نسبة الإغلاق فوق 75%', priority: 'أولوية قصوى', status: 'معتمد للتنفيذ' },
    { id: 'gen_02', pillar: 'sales', title: 'استراتيجية التجربة الميدانية ببيانات العميل الفعلية لمدة 14 يوماً', description: 'تهيئة النسخة التجريبية ببيانات العميل الأساسية خلال 5 دقائق لتبدأ المنشأة بالعمل الفعلي من اليوم الأول.', impact: 'تحويل سريع للتعاقد الدائم', priority: 'أولوية قصوى', status: 'معتمد ومطبق' },
    { id: 'gen_03', pillar: 'management', title: `القاعدة الحديدية: إصدار مفتاح التفعيل ${prefix} مقابل صافي التوريد`, description: `لا يصدر مفتاح التفعيل الدائم (${prefix}) إلا بعد استلام الوكيل (${phone}) لبصمة الجهاز HWID وصافي المبلغ المستحق وتوثيقه في سلسلة التدقيق الجنائي.`, impact: 'صفر مديونيات أو تسريب', priority: 'أولوية قصوى', status: 'مفعل برمجياً' }
  ];
  for (const p of genericProps) {
    ins.run(p.id, p.pillar, p.title, p.description, p.impact, p.priority, p.status, now);
  }
}

function getSystemPaths(baseDataDir, baseKitsDir, systemId) {
  const id = sanitizeSystemId(systemId || 'qalix_medical');
  if (id === 'qalix_medical') {
    return {
      systemId: 'qalix_medical',
      dataDir: baseDataDir,
      dbPath: path.join(baseDataDir, 'agent.db'),
      kitsDir: baseKitsDir,
      backupsDir: path.join(baseDataDir, 'backups'),
      customDataFile: path.join(baseDataDir, 'custom_dev_data.json')
    };
  }
  const sysDir = path.join(baseDataDir, 'systems', id);
  return {
    systemId: id,
    dataDir: sysDir,
    dbPath: path.join(sysDir, 'agent.db'),
    kitsDir: path.join(sysDir, 'kits'),
    backupsDir: path.join(sysDir, 'backups'),
    customDataFile: path.join(sysDir, 'custom_dev_data.json')
  };
}

function getRegistryPath(baseDataDir) {
  return path.join(baseDataDir, 'systems.json');
}

function createDefaultMedicalManifest(customAgentInfo = null) {
  return {
    id: 'qalix_medical',
    nameAr: SYSTEM_PRESETS.qalix_medical.nameAr,
    subtitleAr: SYSTEM_PRESETS.qalix_medical.subtitleAr,
    projectName: SYSTEM_PRESETS.qalix_medical.projectName,
    licensePrefix: SYSTEM_PRESETS.qalix_medical.licensePrefix,
    isPrimaryDefault: true,
    createdAt: new Date().toISOString(),
    agentInfo: customAgentInfo ? { ...DEFAULT_AGENT_INFO, ...customAgentInfo } : { ...DEFAULT_AGENT_INFO },
    pricing: JSON.parse(JSON.stringify(DEFAULT_MEDICAL_PRICING))
  };
}

function loadSystemsRegistry(baseDataDir, baseKitsDir, options = {}) {
  fs.mkdirSync(baseDataDir, { recursive: true });
  const regPath = getRegistryPath(baseDataDir);
  let registry = null;
  if (fs.existsSync(regPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      if (parsed && Array.isArray(parsed.systems) && parsed.systems.length > 0) {
        registry = parsed;
      }
    } catch (_) {}
  }

  if (!registry) {
    const primary = createDefaultMedicalManifest(options.defaultAgentInfo || null);
    registry = {
      schemaVersion: '1.0',
      activeSystemId: 'qalix_medical',
      updatedAt: new Date().toISOString(),
      systems: [primary]
    };
    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf8');
  }

  // Ensure activeSystemId points to an existing entry
  if (!registry.systems.some(s => s.id === registry.activeSystemId)) {
    registry.activeSystemId = registry.systems[0].id;
    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf8');
  }

  // Ensure active system directories exist
  const activeSys = registry.systems.find(s => s.id === registry.activeSystemId);
  const paths = getSystemPaths(baseDataDir, baseKitsDir, activeSys.id);
  fs.mkdirSync(paths.dataDir, { recursive: true });
  fs.mkdirSync(paths.kitsDir, { recursive: true });
  fs.mkdirSync(paths.backupsDir, { recursive: true });

  return registry;
}

function saveSystemsRegistry(baseDataDir, registry) {
  registry.updatedAt = new Date().toISOString();
  fs.writeFileSync(getRegistryPath(baseDataDir), JSON.stringify(registry, null, 2), 'utf8');
  return registry;
}

function createIsolatedSystem(baseDataDir, baseKitsDir, input = {}, options = {}) {
  const registry = loadSystemsRegistry(baseDataDir, baseKitsDir);
  const preset = input.presetId && SYSTEM_PRESETS[input.presetId] ? SYSTEM_PRESETS[input.presetId] : null;
  const rawId = input.id || (preset ? preset.id : null) || `sys_${Date.now().toString(36)}`;
  let sysId = sanitizeSystemId(rawId);

  if (registry.systems.some(s => s.id === sysId)) {
    throw new Error(`المنظومة (${sysId}) مسجلة بالفعل ولا يمكن تكرار المعرف.`);
  }

  const nameAr = String(input.nameAr || (preset && preset.nameAr) || '').trim();
  if (!nameAr) throw new Error('يرجى إدخال اسم المنظومة بالعربية.');

  const subtitleAr = String(input.subtitleAr || (preset && preset.subtitleAr) || 'منظومة تجارية مستقلة تعمل أوفلاين بدون اشتراك شهري').trim();
  const projectName = String(input.projectName || (preset && preset.projectName) || `Qalix ${sysId.toUpperCase()} Agent`).trim();
  const licensePrefix = String(input.licensePrefix || (preset && preset.licensePrefix) || sysId.slice(0, 3).toUpperCase() + '2')
    .trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'QLX2';

  const pricing = normalizePricing(input.pricing || {}, (preset && preset.pricing) || DEFAULT_MEDICAL_PRICING);
  const activeSys = registry.systems.find(s => s.id === registry.activeSystemId) || registry.systems[0];
  const fallbackAgent = activeSys ? activeSys.agentInfo : DEFAULT_AGENT_INFO;
  const agentInfo = buildAgentInfoFromSystem({
    projectName,
    titleAr: input.agentTitleAr || `وكيل ${nameAr}`,
    phone: input.agentPhone || fallbackAgent.phone,
    facebookPageUrl: input.facebookPageUrl || fallbackAgent.facebookPageUrl,
    megaTrialUrl: input.megaTrialUrl || ''
  }, `وكيل ${nameAr}`);

  const newSystem = {
    id: sysId,
    nameAr,
    subtitleAr,
    projectName,
    licensePrefix,
    isPrimaryDefault: false,
    createdAt: new Date().toISOString(),
    agentInfo,
    pricing
  };

  // Physically create isolated folder structure & blank SQLite WAL DB
  const paths = getSystemPaths(baseDataDir, baseKitsDir, sysId);
  fs.mkdirSync(paths.dataDir, { recursive: true });
  fs.mkdirSync(paths.kitsDir, { recursive: true });
  fs.mkdirSync(paths.backupsDir, { recursive: true });

  const newDb = new DatabaseSync(paths.dbPath);
  try {
    initSystemSchema(newDb);
    newDb.prepare("INSERT INTO agent_private_settings(key, value) VALUES('clean_production_mode', '1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    if (options.cleanOwnerPhone !== true) {
      newDb.prepare("INSERT OR IGNORE INTO agent_private_settings(key, value) VALUES('platform_owner_name', ?)").run('صاحب منصة كالكس');
      newDb.prepare("INSERT OR IGNORE INTO agent_private_settings(key, value) VALUES('platform_owner_phone', '')").run();
    }
    seedGenericSystemProposals(newDb, newSystem);
    seedSystemGenesisAudit(newDb, 'system_isolated_init', `تأسيس قاعدة بيانات معزولة بالكامل لمنظومة: ${nameAr} (${sysId})`);
    newDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  } finally {
    try { newDb.close(); } catch (_) {}
  }

  registry.systems.push(newSystem);
  if (input.activateNow !== false) {
    registry.activeSystemId = sysId;
  }
  saveSystemsRegistry(baseDataDir, registry);

  return { system: newSystem, paths, registry };
}

function selectActiveSystemInRegistry(baseDataDir, baseKitsDir, systemId) {
  const registry = loadSystemsRegistry(baseDataDir, baseKitsDir);
  const found = registry.systems.find(s => s.id === systemId);
  if (!found) throw new Error('المنظومة المطلوبة غير موجودة في السجل.');
  registry.activeSystemId = found.id;
  saveSystemsRegistry(baseDataDir, registry);
  const paths = getSystemPaths(baseDataDir, baseKitsDir, found.id);
  fs.mkdirSync(paths.dataDir, { recursive: true });
  fs.mkdirSync(paths.kitsDir, { recursive: true });
  fs.mkdirSync(paths.backupsDir, { recursive: true });
  return { system: found, paths, registry };
}

function summarizeSystemStats(baseDataDir, baseKitsDir, sys) {
  const paths = getSystemPaths(baseDataDir, baseKitsDir, sys.id);
  const result = {
    id: sys.id,
    nameAr: sys.nameAr,
    subtitleAr: sys.subtitleAr,
    licensePrefix: sys.licensePrefix,
    isPrimaryDefault: Boolean(sys.isPrimaryDefault),
    pricing: sys.pricing,
    agentInfo: sys.agentInfo,
    dbFileRel: path.relative(path.dirname(baseDataDir), paths.dbPath).replace(/\\/g, '/'),
    kitsDirRel: path.relative(path.dirname(baseDataDir), paths.kitsDir).replace(/\\/g, '/'),
    distributorsCount: 0,
    dealsCount: 0,
    locksCount: 0,
    dbInitialized: fs.existsSync(paths.dbPath)
  };
  if (fs.existsSync(paths.dbPath)) {
    let tmpDb;
    try {
      tmpDb = new DatabaseSync(paths.dbPath);
      result.distributorsCount = tmpDb.prepare('SELECT COUNT(*) AS c FROM distributors').get().c;
      result.dealsCount = tmpDb.prepare('SELECT COUNT(*) AS c FROM deals').get().c;
      try { result.locksCount = tmpDb.prepare('SELECT COUNT(*) AS c FROM lead_locks').get().c; } catch (_) {}
    } catch (_) {
    } finally {
      if (tmpDb) try { tmpDb.close(); } catch (_) {}
    }
  }
  return result;
}

module.exports = {
  DEFAULT_MEDICAL_PRICING,
  DEFAULT_AGENT_INFO,
  SYSTEM_PRESETS,
  sanitizeSystemId,
  buildAgentInfoFromSystem,
  normalizePricing,
  initSystemSchema,
  seedSystemGenesisAudit,
  seedGenericSystemProposals,
  getSystemPaths,
  loadSystemsRegistry,
  saveSystemsRegistry,
  createIsolatedSystem,
  selectActiveSystemInRegistry,
  summarizeSystemStats
};

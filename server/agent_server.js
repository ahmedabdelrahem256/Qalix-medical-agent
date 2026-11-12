/* Qalix Medical Agent — Official Agent & Independent Distributors Management Server
 * 100% Offline Air-Gapped · Zero External Dependencies · Node.js Built-in HTTP + SQLite
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { escapeHtml } = require('./html_escape');
const { SPECIALTY_PACKS, getAllPacks, getPackById } = require('./specialty_packs');
const { processMigration } = require('./data_migrator');
const { MARKETING_MATERIALS, renderWhatsAppCatalogA4, renderWowDemoA4, renderBattleCardA4 } = require('./marketing_kit');
const { getLocalNetworkInfo } = require('./network_diagnostics');
const { generateDistributorContractHtml, generateClinicHandoverHtml } = require('./contract_generator');
const { generateDistributorStatementHtml } = require('./financial_ledger');
const { generateQuotationData, generateQuotationHtml } = require('./quotation_engine');
const { getAllObjections, getObjectionById, renderObjectionsPlaybookA4 } = require('./objection_playbook');
const { calculateDealTimeline, RETENTION_MILESTONES } = require('./after_sales_tracker');
const { createDatabaseSnapshot, listDatabaseSnapshots, exportFullSystemJson, verifySnapshotFile, restoreDatabaseSnapshot } = require('./backup_manager');
const { getAnalyticsPayload } = require('./visual_analytics');
const { TRAINING_MODULES, EXAM_QUESTIONS, evaluateExam, generateAccreditationCertificateHtml } = require('./distributor_training_simulator');
const { AUDIT_CHECKPOINTS, evaluateClinicChecklist, generateClinicAuditReportHtml } = require('./clinic_audit_checklist');
const { getAllCampaigns, composeCampaignMessage } = require('./broadcast_composer');
const { COMMISSION_TIERS, calculateDistributorTier, getDistributorHierarchyProfile, generateTierPromotionLetterHtml } = require('./commission_hierarchy');
const { SCENARIOS, calculate12MonthForecast } = require('./financial_forecast');
const { PROTECTED_TERRITORIES, initializeTerritoryTables, lockClinicLead, getLeadLocks } = require('./territory_protection');
const { PAYMENT_CHANNELS, generateReceiptHtml } = require('./payment_receipt_engine');
const { calculateCommercialAlerts, generateExecutiveWeeklyDigestHtml } = require('./executive_digest');
const { generateProposalsDocumentHtml } = require('./rd_proposals_exporter');
const { renderDistributorRecruitmentCardHtml, renderDistributorOnboardingCardHtml } = require('./distributor_recruitment');
const {
  resetDealsOnly,
  resetAllDataFactory,
  clearAuditLogsOnly,
  addCustomWhatsAppTemplate,
  uploadMediaFileStream,
  listAllMedia,
  loadCustomData
} = require('./dev_console');
const {
  QALIX_11_SUITE_IDS,
  SYSTEM_PRESETS,
  initSystemSchema,
  seedGenericSystemProposals,
  getSystemPaths,
  loadSystemsRegistry,
  createIsolatedSystem,
  selectActiveSystemInRegistry,
  ensureQalix11SuiteInRegistry,
  updateSystemAgentProfile,
  openManagerHubDb,
  summarizeSystemStats
} = require('./systems_manager');
const { buildCleanResellerEdition } = require('./reseller_edition');
const appLicense = require('./license');
const {
  validateKeyRequestInput,
  collectSlaAlerts,
  getManagerAuthStatus,
  isManagerAuthorized,
  configureManagerPin,
  loginWithManagerPin,
  buildManagerExecutiveAnalytics,
  generateManagerExecutiveReportHtml
} = require('./manager_security');
const { buildAgentSyncPacket, importSyncPacket } = require('./sync_engine');
const { buildWindowsInstallerKit } = require('./installer_builder');
const { openWindowsDesktopApp } = require('./windows_app_launcher');

const PORT = Number(process.env.PORT) || 4000;
let activePort = PORT;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PRESENTATIONS_DIR = path.join(ROOT, 'ملفات_العروض_التقديمية');
const LEGAL_DOCS_DIR = path.join(ROOT, 'الوثائق_القانونية_والتسليم');
const BASE_DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const BASE_KITS_DIR = process.env.DATA_DIR ? path.join(BASE_DATA_DIR, 'kits') : path.join(ROOT, 'distributors_kits');

fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
fs.mkdirSync(BASE_KITS_DIR, { recursive: true });

function sanitizeTextForUniversalMode(str) {
  if (typeof str !== 'string') return str;
  const sysName = (typeof ACTIVE_SYSTEM !== 'undefined' && ACTIVE_SYSTEM?.nameAr) ? ACTIVE_SYSTEM.nameAr : 'منظومة إدارة الوكلاء والموزعين الموحدة';
  const projName = (typeof ACTIVE_SYSTEM !== 'undefined' && ACTIVE_SYSTEM?.projectName) ? ACTIVE_SYSTEM.projectName : 'Universal Agents & Distributors Platform';
  const agPhone = (typeof ACTIVE_SYSTEM !== 'undefined' && ACTIVE_SYSTEM?.agentInfo?.phone) ? ACTIVE_SYSTEM.agentInfo.phone : '01000000000';
  const waPhone = '2' + agPhone.replace(/^0+/, '0').replace(/[^0-9]/g, '');
  return str
    .replace(/\+201122166076/g, '+2' + agPhone.replace(/^\+?2?/, ''))
    .replace(/201122166076/g, waPhone)
    .replace(/01122166076/g, agPhone)
    .replace(/Qalix Medical Agent/g, projName)
    .replace(/منظومة كالكس الطبية/g, sysName)
    .replace(/كالكس ميديكال/g, sysName)
    .replace(/كالكس الطبية/g, sysName)
    .replace(/للعيادات والمراكز الطبية/g, 'للشركات والمؤسسات والعملاء')
    .replace(/عيادات الصعيد والمحافظات/g, 'العملاء والشركات في جميع المحافظات')
    .replace(/الباقة الأساسية \(عيادة طبيب فردي\)/g, 'الباقة الأساسية (الفئة الأولى)')
    .replace(/عيادة طبيب فردي/g, 'الفئة الأولى')
    .replace(/طبيب فردي/g, 'الفئة الأولى')
    .replace(/الباقة التخصصية \(العيادات النشطة\)/g, 'الباقة المتقدمة (الفئة المتوسطة)')
    .replace(/الباقة التخصصية/g, 'الباقة المتقدمة')
    .replace(/باقة المراكز الكبرى والفروع/g, 'الباقة المؤسسية الشاملة')
    .replace(/مكتب النور للأنظمة الطبية/g, 'مكتب النور للتوزيع والتجارة')
    .replace(/مركز الشفاء الطبي/g, 'شركة النور للتجارة')
    .replace(/طابعة الروشتات/g, 'طابعة الفواتير والتقارير')
    .replace(/بصمة جهاز العيادة/g, 'بصمة جهاز العميل')
    .replace(/العيادات والمراكز/g, 'العملاء والمنشآت')
    .replace(/العيادات/g, 'العملاء')
    .replace(/العيادة/g, 'المنشأة')
    .replace(/عيادة/g, 'منشأة')
    .replace(/الأطباء/g, 'العملاء')
    .replace(/الطبيب/g, 'العميل')
    .replace(/المرضى/g, 'العملاء');
}

function sanitizeValueForUniversalMode(val, depth = 0) {
  if (depth > 8 || val == null) return val;
  if (typeof val === 'string') return sanitizeTextForUniversalMode(val);
  if (Array.isArray(val)) return val.map(v => sanitizeValueForUniversalMode(v, depth + 1));
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = sanitizeValueForUniversalMode(v, depth + 1);
    return out;
  }
  return val;
}

function sendHtmlWithOptionalDownload(res, html, downloadFilename, forceDownload) {
  const safeHtml = (typeof isUniversalCleanMode === 'function' && isUniversalCleanMode())
    ? sanitizeTextForUniversalMode(html)
    : html;
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };
  if (forceDownload && downloadFilename) {
    headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`;
  }
  res.writeHead(200, headers);
  return res.end(safeHtml);
}

/* ---------------- Multi-System Runtime Pool & Active Context ---------------- */
const dbPool = new Map();

function openSystemDb(systemId, targetDbPath) {
  if (dbPool.has(systemId)) {
    return dbPool.get(systemId);
  }
  fs.mkdirSync(path.dirname(targetDbPath), { recursive: true });
  const conn = new DatabaseSync(targetDbPath);
  initSystemSchema(conn);
  dbPool.set(systemId, conn);
  return conn;
}

let systemsRegistry = ensureQalix11SuiteInRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
const managerHubDb = openManagerHubDb(BASE_DATA_DIR);
managerHubDb.exec(`
  CREATE TABLE IF NOT EXISTS role_profiles (
    role_key TEXT PRIMARY KEY,
    full_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    title TEXT DEFAULT '',
    region TEXT DEFAULT '',
    email TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_data_url TEXT DEFAULT '',
    updated_at TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS account_requests (
    id TEXT PRIMARY KEY,
    role_key TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    region TEXT DEFAULT '',
    parent_role TEXT DEFAULT '',
    requested_by_role TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    approved_by_role TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invitation_cards (
    id TEXT PRIMARY KEY,
    inviter_role TEXT NOT NULL,
    inviter_name TEXT DEFAULT '',
    target_role TEXT NOT NULL,
    invitee_name TEXT NOT NULL,
    invitee_phone TEXT DEFAULT '',
    region TEXT DEFAULT '',
    invite_code TEXT NOT NULL,
    rules_snapshot TEXT DEFAULT '',
    status TEXT DEFAULT 'issued',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS owner_catalog_items (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    basic_price INTEGER DEFAULT 4500,
    pro_price INTEGER DEFAULT 8500,
    ent_price INTEGER DEFAULT 18500,
    agent_commission_pct REAL DEFAULT 15,
    dist_commission_pct REAL DEFAULT 27,
    marketing_pitch TEXT DEFAULT '',
    presentation_url TEXT DEFAULT '',
    updated_at TEXT NOT NULL
  );
`);

const USER_ROLE_DEFINITIONS = [
  { key: 'owner', level: 1, icon: '👑', nameAr: 'صاحب العمل', color: '#f59e0b', desc: 'مالك المنظومات بالكامل — يجلب مفاتيح التفعيل من الخارج ويعتمدها' },
  { key: 'agents_manager', level: 2, icon: '🏛️', nameAr: 'مدير الوكلاء', color: '#38bdf8', desc: 'يستلم مفاتيح التفعيل من صاحب العمل ويدير الوكلاء والمنظومات' },
  { key: 'agent', level: 3, icon: '🤝', nameAr: 'الوكيل', color: '#10b981', desc: 'إدارة شبكة الموزعين واعتماد التحصيل والتوريد' },
  { key: 'distributor', level: 4, icon: '🚚', nameAr: 'الموزع', color: '#a855f7', desc: 'المبيعات الميدانية وحجز النطاق وإدارة المندوب والفني' },
  { key: 'rep', level: 5, icon: '🧭', nameAr: 'المندوب', color: '#0ea5e9', desc: 'الزيارات الميدانية والعرض والتعاقد وتسجيل العملاء' },
  { key: 'technician', level: 6, icon: '🛠️', nameAr: 'الفني', color: '#14b8a6', desc: 'التركيب والتشغيل والتدريب الميداني والدعم الفني' }
];

function getRoleProfilesState() {
  const rows = managerHubDb.prepare('SELECT * FROM role_profiles').all();
  const map = {};
  for (const r of rows) map[r.role_key] = r;
  const activeRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'active_user_role'").get();
  const activeRole = USER_ROLE_DEFINITIONS.some(d => d.key === activeRow?.value) ? activeRow.value : 'owner';
  const profiles = {};
  for (const def of USER_ROLE_DEFINITIONS) {
    const row = map[def.key] || {};
    profiles[def.key] = {
      roleKey: def.key,
      fullName: row.full_name || '',
      phone: row.phone || '',
      title: row.title || def.nameAr,
      region: row.region || '',
      email: row.email || '',
      bio: row.bio || '',
      avatarDataUrl: row.avatar_data_url || '',
      updatedAt: row.updated_at || ''
    };
  }
  return { activeRole, roles: USER_ROLE_DEFINITIONS, profiles };
}
let ACTIVE_SYSTEM = systemsRegistry.systems.find(s => s.id === systemsRegistry.activeSystemId) || systemsRegistry.systems[0];
let ACTIVE_PATHS = getSystemPaths(BASE_DATA_DIR, BASE_KITS_DIR, ACTIVE_SYSTEM.id);
let DATA_DIR = ACTIVE_PATHS.dataDir;
let KITS_DIR = ACTIVE_PATHS.kitsDir;
let OFFICIAL_PRICING = ACTIVE_SYSTEM.pricing;
let AGENT_INFO = ACTIVE_SYSTEM.agentInfo;
let dbPath = ACTIVE_PATHS.dbPath;
let db = openSystemDb(ACTIVE_SYSTEM.id, dbPath);

function getManagerHubProfile() {
  const rows = managerHubDb.prepare('SELECT key, value FROM manager_settings').all();
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    managerName: map.manager_name || 'مدير الوكلاء العام',
    managerPhone: map.manager_phone || '',
    ownerName: map.platform_owner_name || 'صاحب المنصة (سري - خاص بمدير الوكلاء فقط)',
    ownerPhone: map.platform_owner_phone || ''
  };
}

function getAgentVisibleManagerContact() {
  const p = getManagerHubProfile();
  return {
    managerName: p.managerName,
    managerPhone: p.managerPhone
  };
}

function getPendingKeyRequestsCount(sysId = null) {
  try {
    if (sysId) {
      return managerHubDb.prepare("SELECT COUNT(*) AS c FROM agent_key_requests WHERE system_id = ? AND status = 'pending_owner_fetch'").get(sysId).c;
    }
    return managerHubDb.prepare("SELECT COUNT(*) AS c FROM agent_key_requests WHERE status = 'pending_owner_fetch'").get().c;
  } catch (_) {
    return 0;
  }
}

function isUniversalCleanMode() {
  try {
    const sysList = Array.isArray(systemsRegistry?.systems) ? systemsRegistry.systems : [];
    const hasNoQalixSystems = sysList.length > 0 && !sysList.some(s => String(s.id || '').startsWith('qalix'));
    if (hasNoQalixSystems && !String(ACTIVE_SYSTEM.id || '').startsWith('qalix')) return true;
    const row = db.prepare("SELECT value FROM agent_private_settings WHERE key = 'clean_production_mode'").get();
    return Boolean(row && row.value === '1' && ACTIVE_SYSTEM.id === 'universal_agent');
  } catch (_) {
    return false;
  }
}

function getAppLicenseState() {
  return appLicense.readLicense({
    dataDir: BASE_DATA_DIR,
    isUniversalClean: isUniversalCleanMode()
  });
}

function activateRuntimeSystem(systemId) {
  systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
  const found = systemsRegistry.systems.find(s => s.id === systemId) || systemsRegistry.systems[0];
  ACTIVE_SYSTEM = found;
  ACTIVE_PATHS = getSystemPaths(BASE_DATA_DIR, BASE_KITS_DIR, found.id);
  fs.mkdirSync(ACTIVE_PATHS.dataDir, { recursive: true });
  fs.mkdirSync(ACTIVE_PATHS.kitsDir, { recursive: true });
  fs.mkdirSync(ACTIVE_PATHS.backupsDir, { recursive: true });
  DATA_DIR = ACTIVE_PATHS.dataDir;
  KITS_DIR = ACTIVE_PATHS.kitsDir;
  OFFICIAL_PRICING = found.pricing;
  AGENT_INFO = found.agentInfo;
  dbPath = ACTIVE_PATHS.dbPath;
  db = openSystemDb(found.id, dbPath);
  try {
    const allDists = db.prepare('SELECT * FROM distributors').all();
    for (const d of allDists) writeDistributorKitFile(d);
  } catch (_) {}
  return ACTIVE_SYSTEM;
}

function logAudit(action, details) {
  const at = new Date().toISOString();
  const last = db.prepare('SELECT curr_hash FROM audit_log ORDER BY id DESC LIMIT 1').get();
  const prevHash = last ? last.curr_hash : '0'.repeat(64);
  const currHash = crypto.createHash('sha256').update(`${prevHash}|${at}|${action}|${details}`).digest('hex');
  db.prepare('INSERT INTO audit_log(at, action, details, prev_hash, curr_hash) VALUES(?, ?, ?, ?, ?)')
    .run(at, action, details, prevHash, currHash);
}

function seedInitialData(targetDb) {
  const dbase = targetDb || db;
  const now = new Date().toISOString();
  const seedDists = [
    { id: 'dist_assiut_01', code: 'QMA-DIST-01', name: 'مكتب النخبة للحلول الطبية (قطاع أسيوط)', phone: '01098765431', gov: 'أسيوط', rate: 27, pin: '1001', notes: 'موزع معتمد لنطاق عيادات ومراكز محافظة أسيوط' },
    { id: 'dist_cairo_02',  code: 'QMA-DIST-02', name: 'شركة ميديكال تك للتوريدات (القاهرة والجيزة)', phone: '01234567892', gov: 'القاهرة الكبرى', rate: 32, pin: '1002', notes: 'موزع مستقل لعيادات مدينة نصر والمعادي والدقي' },
    { id: 'dist_delta_03',  code: 'QMA-DIST-03', name: 'مجموعة الدلتا للأنظمة الطبية (المنصورة وطنطا)', phone: '01145678903', gov: 'الدلتا والإسكندرية', rate: 27, pin: '1003', notes: 'موزع مستقل لقطاع الدلتا' }
  ];
  const insDist = dbase.prepare('INSERT INTO distributors(id, code, name, phone, governorate, commission_rate, status, access_pin, notes, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const d of seedDists) {
    insDist.run(d.id, d.code, d.name, d.phone, d.gov, d.rate, 'active', d.pin, d.notes, now);
  }

  const insDeal = dbase.prepare(`INSERT INTO deals(
    id, deal_no, distributor_id, clinic_name, doctor_name, clinic_phone, city, is_assiut,
    tier, fixed_price, commission_rate, distributor_commission, agent_net_amount,
    hardware_id, status, license_key_ref, notes, created_at, settled_at
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  insDeal.run(
    'deal_01', 'DEAL-2026-101', 'dist_assiut_01', 'عيادة النور التخصصية للباطنة والقلب', 'د. عمرو عبد العليم', '01011223344', 'أسيوط', 0,
    'professional', 8500, 27, 2295, 6205, '7F8A9C12B4E09911A2B3C4D5', 'completed', 'QLX2-ISSUED-ASSIUT-101', 'تم التفعيل وتوريد صافي الوكيل', now, now
  );
  insDeal.run(
    'deal_02', 'DEAL-2026-102', 'dist_cairo_02', 'مركز الصفوة لطب وجراحة الأسنان', 'د. كريم المنشاوي', '01022334455', 'القاهرة', 0,
    'professional', 8500, 32, 2720, 5780, '9A1B2C3D4E5F60718293A4B5', 'completed', 'QLX2-ISSUED-CAIRO-102', 'تم التفعيل وتحصيل صافي الوكيل', now, now
  );
  insDeal.run(
    'deal_03', 'DEAL-2026-103', 'dist_cairo_02', 'مجمع الشفاء الطبي المتكامل (3 فروع)', 'د. هاني محمود', '01288990011', 'الجيزة', 0,
    'enterprise', 18500, 32, 5920, 12580, '3C4D5E6F7A8B9C0D1E2F3A4B', 'pending', '', 'بانتظار مراجعة الوكيل وإصدار مفتاح التفعيل', now, ''
  );
  logAudit('system_init', 'تأسيس قاعدة بيانات مشروع Qalix Medical Agent بنظام السعر الثابت ونسب الموزعين');
}

/* Seed initial sample distributors only for medical demo mode (when clean production mode is not set) */
const cleanProdRow = db.prepare("SELECT value FROM agent_private_settings WHERE key = 'clean_production_mode'").get();
const distCount = db.prepare('SELECT COUNT(*) AS n FROM distributors').get().n;
if (ACTIVE_SYSTEM.id === 'qalix_medical' && distCount === 0 && (!cleanProdRow || cleanProdRow.value !== '1')) {
  seedInitialData(db);
}

/* Seed Excellence Proposals according to active system identity */
const propCount = db.prepare('SELECT COUNT(*) AS n FROM excellence_proposals').get().n;
if (ACTIVE_SYSTEM.id === 'qalix_medical') {
  if (propCount === 0) {
    const now = new Date().toISOString();
    const seedProps = [
      // Pillar 1: الارتقاء بالمنظومة والمنتج (بدون المساس بالإصدار الحالي v1.0)
      { id: 'prop_01', pillar: 'product', title: 'أداة خارجية لتحويل شيتات Excel القديمة للعيادات إلى ملف استيراد جاهز', description: 'بما أن الإصدار الحالي v1.0 ثابت وموقع رقمياً ولا يُلمس، يوفر الوكيل أداة مستقلة تحول ملفات المرضى والأدوية القديمة من Excel إلى صيغة استيراد المنظومة في ثوانٍ لكسر حاجز خوف الطبيب من نقل بياناته.', impact: 'يضاعف سرعة إغلاق الصفقات 3x', priority: 'أولوية قصوى', status: 'جاهز للتنفيذ في حزمة الوكيل' },
      { id: 'prop_02', pillar: 'product', title: 'مكتبة قوالب تخصصية جاهزة للاستيراد (أسنان، أطفال، نساء، باطنة، عيون)', description: 'ملفات إعدادات وأدوية وخدمات جاهزة لكل تخصص طبي يستوردها الموزع للطبيب عند التثبيت، فيجد الطبيب 200 دواء شائع في تخصصه وقائمة خدماته جاهزة من أول دقيقة بدون إدخال يدوي.', impact: 'إبهار فوري للطبيب', priority: 'أولوية قصوى', status: 'معتمد للتنفيذ' },
      { id: 'prop_03', pillar: 'product', title: 'حزمة الهاردوير المتكاملة للعيادة (Qalix Turnkey Clinic Box)', description: 'طرح خيار توريد راوتر واي فاي محلي مجهز مسبقاً باسم العيادة + فلاشة نسخ احتياطي مشفرة 64GB + قارئ باركود للصيدلية الداخلية كحزمة إضافية اختيارية يربح منها الوكيل والموزع.', impact: 'رفع متوسط الربح +1,500 ج.م', priority: 'أولوية عالية', status: 'مقترح استراتيجي' },

      // Pillar 2: تحسين العرض التقديمي والإبهار الميداني (Presentation & Live Demo)
      { id: 'prop_04', pillar: 'presentation', title: 'سيناريو العرض الميداني في 5 دقائق (The 5-Minute WOW Demo)', description: 'تدريب كل موزع على عرض 4 نقاط فقط بالترتيب: (1) مسح QR بالموبايل لسماع نداء «هدى» الصوتي، (2) كتابة وارفارين + أسبرين لرؤية تحذير النزيف اللحظي، (3) إرسال رسالة صوتية مشفرة للاستقبال، (4) فصل الإنترنت لإثبات أن العيادة تعمل 100% بلا توقف.', impact: 'نسبة اقتناع تتجاوز 80%', priority: 'أولوية قصوى', status: 'معتمد ومطبق' },
      { id: 'prop_05', pillar: 'presentation', title: 'بطاقة المقارنة المالية البصرية أمام الطبيب (ورقة A4 مغلفة مع كل موزع)', description: 'بطاقة مطبوعة يضعها الموزع على مكتب الطبيب تقارن تكلفة 3 سنوات في الأنظمة السحابية (50,000+ ج.م إيجار ينتهي بقفل الحساب) مقابل دفعة واحدة مدى الحياة في كالكس ميديكال تعادل كشفين في الأسبوع.', impact: 'يقضي على اعتراض السعر فوراً', priority: 'أولوية قصوى', status: 'معتمد للتنفيذ' },

      // Pillar 3: تحسين طرق البيع وإغلاق الصفقات (Sales & Closing)
      { id: 'prop_06', pillar: 'sales', title: 'استراتيجية «التجربة الميدانية ببيانات جاهزة» لمدة 14 يوماً', description: 'بدلاً من ترك الطبيب يحمّل البرنامج فارغاً، يقوم الموزع بتثبيت النسخة التجريبية لمكتب الاستقبال وضبط اسم العيادة والطبيب في 5 دقائق، لتبدأ السكرتيرة بالحجز الفعلي من نفس اليوم.', impact: 'يرفع التحويل من تجربة لشراء إلى 70%', priority: 'أولوية قصوى', status: 'معتمد ومطبق' },
      { id: 'prop_07', pillar: 'sales', title: 'برنامج «ترشيح الزملاء للأطباء» (Doctor-to-Doctor Referral)', description: 'منح الطبيب المتعاقد هدية (سنة دعم إضافية مجاناً أو ترقية للباقة الأعلى بخصم خاص) عند ترشيح طبيبين زميلين في نفس البرج الطبي أو المستشفى.', impact: 'انتشار فيروسي بدون تكلفة إعلانات', priority: 'أولوية عالية', status: 'معتمد للتنفيذ' },
      { id: 'prop_08', pillar: 'sales', title: 'حملات الأبراج الطبية والمراكز المتجاورة (Medical Tower Blitz)', description: 'توجيه كل موزع للتركيز على برج طبي واحد أسبوعياً؛ بمجرد تركيب شاشة الانتظار والنداء الصوتي في عيادة واحدة بالبرج، تصبح مرجعاً حياً لكل الأطباء في نفس البرج.', impact: 'مبيعات جماعية سريعة', priority: 'أولوية عالية', status: 'معتمد للتنفيذ' },

      // Pillar 4: تحسين المتابعة وخدمة ما بعد البيع (Follow-up & Retention)
      { id: 'prop_09', pillar: 'followup', title: 'جدول المتابعة الذهبي لـ 14 يوم تجربة (اليوم 1، 3، 7، 12، 14)', description: 'نظام متابعة منضبط عبر واتساب (01122166076 والموزعين): اليوم 1 (تأكيد التثبيت)، اليوم 3 (تفعيل شاشة الانتظار والنداء)، اليوم 7 (مراجعة تقارير الإيراد)، اليوم 12 (عرض التعاقد المبكر مع نقل البيانات مجاناً)، اليوم 14 (إصدار مفتاح التفعيل الدائم).', impact: 'منع تسرب العملاء المحتملين', priority: 'أولوية قصوى', status: 'معتمد ومطبق' },
      { id: 'prop_10', pillar: 'followup', title: 'فحص الاطمئنان الدوري بعد البيع (اليوم 30 واليوم 90)', description: 'رسالة واتساب تلقائية من الوكيل بعد شهر من الشراء للتأكد من انتظام النسخ الاحتياطي المشفر على الفلاشة الخارجية، مما يبني ثقة مطلقة وسمعة ذهبية للمنظومة في السوق الطبي.', impact: 'سمعة رقم #1 في السوق الطبي', priority: 'أولوية عالية', status: 'معتمد للتنفيذ' },

      // Pillar 5: تحسين الإدارة والحوكمة لشبكة الموزعين (Management & Governance)
      { id: 'prop_11', pillar: 'management', title: 'نظام شرائح حوافز الموزعين التصاعدي (Bronze / Silver / Gold / Platinum)', description: 'الموزع يبدأ بنسبة 27% من السعر الثابت، وترتفع نسبته تلقائياً إلى 29% (فضية) ثم 32% (ذهبية عند 10 مبيعات) وصولاً إلى 35% (بلاتينية عند 20+ صفقة)، مع حماية النطاق الجغرافي لكل موزع نشط.', impact: 'تحفيز الموزعين على مضاعفة المبيعات', priority: 'أولوية قصوى', status: 'معتمد في لوحة الوكيل' },
      { id: 'prop_12', pillar: 'management', title: 'القاعدة الحديدية: التفعيل مقابل صافي التوريد وبصمة العتاد (HWID)', description: 'حوكمة مالية صارمة 100%: لا يصدر مفتاح التفعيل `QLX2` إلا بعد استلام الوكيل (01122166076) لبصمة جهاز العيادة وصافي المبلغ، وتُسجل كل عملية في سلسلة التدقيق الجنائي المشفرة.', impact: 'صفر مديونيات أو تسريب للتراخيص', priority: 'أولوية قصوى', status: 'مفعل برمجياً' }
    ];
    const insProp = db.prepare('INSERT INTO excellence_proposals(id, pillar, title, description, impact, priority, status, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
    for (const p of seedProps) {
      insProp.run(p.id, p.pillar, p.title, p.description, p.impact, p.priority, p.status, now);
    }
  }

  // Always ensure post-launch R&D follow-up proposals exist for primary medical workspace
  const nowProp = new Date().toISOString();
  const insFollowupProp = db.prepare('INSERT OR IGNORE INTO excellence_proposals(id, pillar, title, description, impact, priority, status, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)');
  insFollowupProp.run(
    'prop_13',
    'presentation',
    'تحديث ومونتاج ملفات الفيديو التسويقية وفق التسعيرة الموحدة وعزل الوكيل',
    'إعادة مونتاج وتحديث التعليق الصوتي والنصوص الظاهرة في الفيديوهات التسويقية الأربعة (مقاس 4:5 والعمودي 9:16 بصوت سلمى داخل مجلد ملفات_العروض_التقديمية/فيديو_تسويقي) لإزالة أي إشارة قديمة لعرض أسيوط 40% والاعتماد على السعر الرسمي الموحد (4,500 / 8,500 / 18,500 ج.م) والتواصل عبر الموزع المعتمد فقط.',
    'توحيد الرسالة التسويقية الميدانية 100%',
    'أولوية عالية',
    'مقترح للتنفيذ في المونتاج',
    nowProp
  );
  insFollowupProp.run(
    'prop_14',
    'management',
    'تجديد الأرشيف الشامل وعزل النسخ الاحتياطية وخصوصية المستودع',
    'إنشاء نسخة أرشيف مضغوطة محدثة بدلاً من الأرشيف التاريخي القديم (Qalix_Medical_Agent_Backup_20261110.zip) لتكون نظيفة بالكامل من عرض أسيوط 40% ومن الرقم القديم، مع ضبط مستودع الكود كـ Private وفصل قاعدة البيانات الحية وملفات الموزعين عن تتبع Git العام.',
    'حماية خصوصية البيانات والنسخ الاحتياطية',
    'أولوية عالية',
    'معتمد للتنفيذ',
    nowProp
  );
} else if (propCount === 0) {
  seedGenericSystemProposals(db, ACTIVE_SYSTEM);
}

/* ---------------- Competitors & Market Comparison Catalog (Egypt 2026) ---------------- */
const COMPETITORS_CATALOG = [
  {
    id: 'tabbaba',
    nameAr: 'طَبَّبَ (Tabbaba)',
    category: 'نظام سحابي أونلاين (Cloud SaaS)',
    pricingModel: '2,500 ج.م تأسيس + اشتراك شهري (799 ج.م أساسي / 1,599 ج.م عيادة / 3,299 ج.م برو)',
    cost3YearsEgp: 50470,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 41970,
    pros: [
      'واجهة ويب سحابية حديثة يمكن فتحها من المتصفح في حال توفر إنترنت مستقر',
      'إرسال إشعارات وتذكيرات مواعيد عبر الإنترنت',
      'تقارير مالية أساسية للعيادة'
    ],
    cons: [
      'تكلفة باهظة جداً على المدى المتوسط (50,470 ج.م خلال 3 سنوات لباقة العيادة)',
      'توقف العيادة بالكامل عن العمل عند انقطاع الإنترنت أو بطء الشبكة',
      'بيانات المرضى وأسرار دخل العيادة مخزنة على خوادم خارجية وليست ملكاً خالصاً للطبيب',
      'الباقة الاقتصادية محدودة بـ 100 مريض فقط شهرياً وتفرض رسوماً إضافية للتوسع',
      'لا يوجد شات داخلي صوتي/نصي أوفلاين ولا إدارة أسرة وغرف متكاملة'
    ],
    qalixWinEdge: 'كالكس ميديكال يوفر على الطبيب أكثر من 41,970 ج.م في 3 سنوات، ويعمل 100% أوفلاين بلا إنترنت وبعدد غير محدود من المرضى، مع تشفير كامل للبيانات على جهاز العيادة حصراً.',
    salesPitchAr: 'يا دكتور، ليه تدفع 2,500 جنيه تأسيس وبعدها 1,600 جنيه كل شهر مدى الحياة (يعني أكثر من 50 ألف جنيه في 3 سنين) في نظام لو النت قطع العيادة تقف؟ كالكس ميديكال دفعة واحدة بس مدى الحياة (8,500 ج.م) وبياناتك مشفرة على جهازك ومش مربوط بعدد مرضى شهري!'
  },
  {
    id: 'tabeeb_plus',
    nameAr: 'طبيب بلس (Tabeeb+)',
    category: 'نظام سحابي بالاشتراك الشهري (مع نسخ مكتبية منفصلة)',
    pricingModel: 'اشتراك شهري متكرر: 500 ج.م (فردي) / 1,000 ج.م (عيادة) / 1,500 ج.م (مراكز)',
    cost3YearsEgp: 36000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 27500,
    pros: [
      'بداية اشتراك شهري تبدو منخفضة ظاهرياً (500 - 1,000 ج.م شهرياً)',
      'يغطي أساسيات الحجز والملف الطبي والفواتير',
      'معروف في بعض العيادات التقليدية'
    ],
    cons: [
      'استنزاف مالي مستمر (36,000 ج.م في 3 سنوات للعيادة النشطة) ويتوقف الحساب عند تأخر السداد',
      'نظام الصيدلية ونظام المختبر يباعان كبرامج منفصلة باشتراكات مستقلة وليسا مدمجين مجاناً',
      'لا يضم نظام محادثات داخلية صوتية/نصية مشفرة بين الطبيب والاستقبال',
      'لا يضم نداءً صوتياً عربياً ذكياً بـ QR للموبايل على الشبكة المحلية بدون إنترنت',
      'لا يملك تشفيراً جنائياً للقاعدة (AES-256-GCM) يمنع سرقة ملف قاعدة البيانات'
    ],
    qalixWinEdge: 'في كالكس ميديكال، الصيدلية بالباركود + المختبر والأشعة + الغرف والأسرة + الشات الصوتي والنداء الصوتي كلها مدمجة في حزمة واحدة مدى الحياة بدون أي اشتراك شهري.',
    salesPitchAr: 'في طبيب بلس هتدفع 12,000 جنيه كل سنة للعيادة، ولو محتاج صيدلية داخلية بتشتري برنامج تاني منفصل! في كالكس ميديكال الصيدلية والمختبر والأشعة والنداء الصوتي والشات الداخلي كلها داخل نفس النسخة وبسعر أقل من اشتراك 8 شهور فقط!'
  },
  {
    id: 'orcaa_amedra',
    nameAr: 'أوركا (ORCAA) / أميدرا (Amedra)',
    category: 'أنظمة سحابية للمراكز والعيادات (Cloud ERP)',
    pricingModel: 'اشتراك شهري ~1,500 ج.م شهرياً (أو باقات سنوية متجددة بالدولار/الجنيه)',
    cost3YearsEgp: 54000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 45500,
    pros: [
      'تنظيم جيد للمواعيد ولوحات التقارير السحابية',
      'مناسبة لمن يشترط الإدارة عن بُعد عبر الإنترنت دائماً'
    ],
    cons: [
      'تكلفة 3 سنوات تصل إلى 54,000 ج.م مع ارتباط كامل بالإنترنت والخوادم السحابية',
      'تخزين الكشوف المالية وأرباح الطبيب على سيرفرات خارجية مما يثير قلق الأطباء مالياً وضريبياً',
      'غياب خاصية النداء الصوتي المحلي وشاشات الانتظار بدون إنترنت',
      'تعقيد في الاستخدام يحتاج تدريب طويل لموظفي الاستقبال'
    ],
    qalixWinEdge: 'سرية مالية وطبية مطلقة 100% أوفلاين (صفر خوادم خارجية)، مع واجهة عربية فائقة السرعة تتعلمها السكرتيرة في 10 دقائق فقط.',
    salesPitchAr: 'أغلب الأطباء بيرفضوا الأنظمة السحابية لأن إيرادات العيادة اليومية وأسماء المرضى بتكون مرفوعة على سيرفر شركة خارجية. كالكس ميديكال بيضمن لك سيادة تامة: إيرادك ومرضاك جوه جهازك أنت بس ومشفرين بمفتاح استرجاع في إيدك وحدك.'
  },
  {
    id: 'tebora_vezeeta',
    nameAr: 'تيبورا (Tebora) / منصات الحجز السحابية (دكتورك / فيزيتا كلينك)',
    category: 'منصات حجز وإدارة سحابية مرتبطة بتطبيقات الحجز',
    pricingModel: 'اشتراك شهري/سنوي متغير + عمولات أو رسوم تسويق إضافية',
    cost3YearsEgp: 32000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 23500,
    pros: [
      'ربط مع تطبيقات الحجز أونلاين للمرضى',
      'تطبيق موبايل للطبيب متصل بالسحابة'
    ],
    cons: [
      'تركز على الحجز أكثر من الإدارة الطبية العميقة (ضعيفة في التداخلات الدوائية، الصيدلية، تقفيل الورديات Z-Report)',
      'تشارك بيانات المرضى مع المنصة السحابية وقد تعرض للمريض أطباء منافسين في نفس التخصص',
      'لا تعمل نهائياً بدون اتصال إنترنت'
    ],
    qalixWinEdge: 'كالكس ميديكال يمنح العيادة بوابة انتظار ذكية خاصة بالعيادة وحدها عبر QR محلي دون مشاركة بيانات مرضاك مع أي منصة إعلانية تعرض منافسيك.',
    salesPitchAr: 'منصات الحجز السحابية بتاخد بيانات مرضاك وممكن ترشحلهم دكتور تاني في نفس التخصص! كالكس ميديكال بيعمل لعيادتك شبكة محلية خاصة بيك، المريض يمسح الـ QR من موبايله في الاستقبال ويتابع دوره بدون ما بياناته تطلع بره عيادتك.'
  },
  {
    id: 'legacy_desktop',
    nameAr: 'البرامج المكتبية التقليدية القديمة (Access / SQL Desktop)',
    category: 'برامج كمبيوتر تقليدية قديمة (Legacy Desktop)',
    pricingModel: '3,000 إلى 7,000 ج.م للجهاز الواحد + رسوم سنوية للصيانة أو إعادة التثبيت بعد الفورمات',
    cost3YearsEgp: 12000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 3500,
    pros: [
      'تعمل بدون إنترنت على جهاز الكمبيوتر'
    ],
    cons: [
      'قواعد بيانات غير مشفرة إطلاقاً (أي شخص ينسخ ملف القاعدة على فلاشة يقرأ كل المرضى والإيرادات)',
      'واجهة قديمة جداً ومعقدة ولا تدعم الموبايل أو التابلت داخل العيادة',
      'لا يوجد فحص تداخلات دوائية أو حساسية، ولا نداء صوتي آلي، ولا شات داخلي، ولا ختم نزاهة رقمي ضد التلاعب',
      'تحتاج لتثبيت معقد (SQL Server / .NET) وتفقد التفعيل أو البيانات عند سقوط الويندوز'
    ],
    qalixWinEdge: 'كالكس ميديكال يجمع قوة الأوفلاين مع حداثة الويب: يفتح على أي موبايل أو تابلت في العيادة عبر الواي فاي المحلي، مشفر بـ AES-256-GCM، ويضم نداءً صوتياً وتداخلات دوائية ومحادثات داخلية.',
    salesPitchAr: 'البرامج المكتبية القديمة لو حد سحب ملف الداتابيز على فلاشة يقدر يفتح كل حساباتك ومرضاك، ومبتفتحش على موبايلك ولا تابلت الكشف! كالكس ميديكال بيشتغل أوفلاين بس بتقنية حديثة جداً يفتح على موبايلك في غرفة الكشف وشاشة الانتظار وقاعدته مشفرة عسكرياً.'
  },
  {
    id: 'codeiks',
    nameAr: 'كوديكس / سلامتك (Codeiks)',
    category: 'سحابي بالإعلانات (Cloud SaaS)',
    pricingModel: 'اشتراك سنوي متكرر (~2,400 إلى 6,000+ ج.م/سنة حسب الفروع)',
    cost3YearsEgp: 18000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 9500,
    pros: [
      'حساب الاستشارات المجانية ونسب الأطباء سحابياً',
      'إدارة طابور الانتظار والفروع عبر الإنترنت'
    ],
    cons: [
      'يتوقف تماماً عند انقطاع الإنترنت أو بطء الشبكة',
      'تجديد سنوي مستمر دون تملك، ولا يضم نداءً صوتياً عربياً أو تشفيراً محلياً AES-256'
    ],
    qalixWinEdge: 'دفع مرة واحدة مدى الحياة + عمل 100% أوفلاين + نداء صوتي وشات داخلي وتشفير AES-256-GCM داخل العيادة.',
    salesPitchAr: 'يا دكتور، في سلامتك بتدفع اشتراك سنوي متجدد ولو النت فصل العيادة تقف. في كالكس بتدفع مرة واحدة مدى الحياة، والنظام شغال أوفلاين 100% بشاشة نداء صوتي وربط موبايل QR محلي وبلا تجديد سنوي!'
  },
  {
    id: 'medicolize',
    nameAr: 'ميديكولايز (Medicolize)',
    category: 'سحابي للتجميل والعيادات (Cloud SaaS)',
    pricingModel: 'اشتراك شهري/سنوي مخصص (~900–1,200 ج.م شهرياً للباقات المتكاملة)',
    cost3YearsEgp: 36000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 27500,
    pros: [
      'إدارة الجلسات والباقات لعيادات الجلدية والتجميل',
      'تذكيرات ومواعيد أونلاين سحابية'
    ],
    cons: [
      'تسعيرة متغيرة واشتراك متكرر (+36,000 ج.م في 3 سنوات) يُقفل عند التأخر',
      'اعتماد كامل على السحابة والإنترنت دون خصوصية محلية كاملة أو نداء صوتي داخلي'
    ],
    qalixWinEdge: 'سعر رسمي ثابت وشفاف مرة واحدة في العمر، توفير 27,500+ ج.م، وصيدلية ومختبر مدمجان أوفلاين.',
    salesPitchAr: 'ميزتك في كالكس الشفافية والأمان: سعر ثابت تدفعه مرة واحدة في العمر، بيانات مرضاك مشفرة على جهازك انت مش على سحابة، وبنديك صيدلية ومختبر ونداء صوتي في نفس الباقة!'
  },
  {
    id: 'basohla',
    nameAr: 'بسهولة (Basohla)',
    category: 'سحابي مبسط للعيادات (Cloud Lite)',
    pricingModel: 'اشتراك شهري/سنوي متجدد (~450–700 ج.م/شهر)',
    cost3YearsEgp: 21600,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 13100,
    pros: [
      'واجهة خفيفة وسريعة للاستقبال والحجوزات',
      'سهولة بدء الاستخدام عبر المتصفح'
    ],
    cons: [
      'إمكانات محدودة في الصيدلية والمخزن وفحص التداخلات الدوائية وتقفيل Z-Report',
      'اشتراك متكرر بلا تملك وتوقف فوري عند انقطاع الإنترنت'
    ],
    qalixWinEdge: 'نفس البساطة للسكرتيرة في 10 دقائق مع قوة طبية ومحاسبية شاملة وتداخلات دوائية أوفلاين 100%.',
    salesPitchAr: 'البساطة في كالكس معززة بقوة طبية كاملة: السكرتيرة تتعلمه في 10 دقائق، ويديك روشتة في 15 ثانية بفحص التداخلات الدوائية وبدون انقطاع نت أو اشتراك شهري!'
  },
  {
    id: 'bluesoft_hmis',
    nameAr: 'بلوسوفت (Bluesoft HMIS)',
    category: 'برنامج موديولات وباقات (STD / Pro)',
    pricingModel: 'تراخيص موديولات منفصلة + دعم وتأسيس (~8,000 إلى 24,000+ ج.م / 3 سنوات)',
    cost3YearsEgp: 18000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 9500,
    pros: [
      'متوفر بباقات متعددة (STD / Pro) للمراكز المتوسطة',
      'تنظيم ملفات الاستقبال والحسابات الأساسية'
    ],
    cons: [
      'تجزئة المميزات على باقات وموديولات منفصلة ورسوم إضافية (SMS / إضافات)',
      'واجهة تقليدية تفتقد الربط الفوري بـ QR لموبايل الطبيب والنداء الصوتي الذكي'
    ],
    qalixWinEdge: 'حزمة واحدة شاملة بلا رسوم موديولات إضافية، مع واجهة عصرية تدعم التابلت والموبايل بـ QR محلي.',
    salesPitchAr: 'بدل ما تدفع في باقات متعددة وموديولات منفصلة وواجهات معقدة، كالكس بيجمع لك إدارة العيادة والموبايل والنداء الصوتي والروشتة في نسخة واحدة سريعة وأقل تكلفة!'
  },
  {
    id: 'clinido',
    nameAr: 'كلينيدو (CliniDo)',
    category: 'منصة حجز وتسويق سحابية (Marketplace)',
    pricingModel: 'باقات اشتراك شهرية/سنوية ورسوم تسويق (~500–900 ج.م/شهر)',
    cost3YearsEgp: 24000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 15500,
    pros: [
      'منصة تسويق معروفة لجلب مرضى وحجوزات أونلاين',
      'تنظيم تقويم مواعيد الحجز المبدئي عبر الإنترنت'
    ],
    cons: [
      'منصة حجز وتسويق وليست نظام تشغيل داخلي (لا صيدلية ولا مخازن ولا Z-Report ولا تداخلات دوائية)',
      'بيانات المرضى على المنصة السحابية وقد يرى المريض أطباء منافسين مع توقفها بلا نت'
    ],
    qalixWinEdge: 'نظام تشغيل داخلي سيادي متكامل يملك فيه الطبيب بياناته 100% أوفلاين ويعمل بجانب أي منصة حجز.',
    salesPitchAr: 'كلينيدو أداة تسويق وجلب حجوزات مش برنامج إدارة عيادة من الداخل! كالكس بيدير عيادتك بالكامل (حسابات، روشتات، مخزن، Z-Report، ونداء صوتي) بدون نت وبدون مشاركة بيانات مرضاك بره العيادة!'
  },
  {
    id: 'tabeebhub',
    nameAr: 'طبيب هب (TabeebHub)',
    category: 'سحابي (فيسبوك · أندرويد · آيفون)',
    pricingModel: 'باقة مجانية محدودة الزيارات + باقات مدفوعة شهرية/سنوية (~700–1,200 ج.م/شهر)',
    cost3YearsEgp: 25200,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 16700,
    pros: [
      'يعمل عبر الويب وتطبيقات الهاتف مع واجهة عربية/إنجليزية',
      'باقة مجانية محدودة لتجربة الأساسيات قبل الترقية المدفوعة'
    ],
    cons: [
      'الباقة المجانية مقيدة بحد أقصى شهري للمرضى وتفرض الترقية لاشتراك متكرر مع نشاط العيادة',
      'اعتماد كلي على الإنترنت والسحابة ولا يضم نداءً صوتياً محلياً أو تشفيراً عسكرياً AES-256 على جهازك'
    ],
    qalixWinEdge: 'عدد مرضى غير محدود مدى الحياة من أول يوم، عمل 100% أوفلاين مع صيدلية ومختبر ونداء صوتي مدمج.',
    salesPitchAr: 'الباقة المجانية في طبيب هب بتتوقف عند عدد مرضى محدد شهرياً وبتضطر بعدها تدفع اشتراك سحابي متكرر، والنظام كله بيقف لو النت قطع. كالكس بتدفع ثمنه مرة واحدة بمرضى غير محدودين وأوفلاين 100%!'
  },
  {
    id: 'smart_clinic',
    nameAr: 'سمارت كلينيك (Smart Clinic)',
    category: 'سحابي وموبايل (فيسبوك · متاجر التطبيقات)',
    pricingModel: 'اشتراك شهري/سنوي متكرر (~500–1,000 ج.م/شهر حسب التخصص والمستخدمين)',
    cost3YearsEgp: 28800,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 20300,
    pros: [
      'تطبيق موبايل للحجز ومتابعة قائمة الانتظار والربط السحابي',
      'واجهة بسيطة لتسجيل المواعيد وإشعارات واتساب عبر الإنترنت'
    ],
    cons: [
      'اشتراك متكرر يرفع التكلفة لـ +28,800 ج.م في 3 سنوات ويتوقف بانتهاء الاشتراك أو انقطاع النت',
      'تخزين البيانات على خوادم خارجية مع افتقاره لنظام الصيدلية المدمج وشاشة التلفزيون الأوفلاين'
    ],
    qalixWinEdge: 'توفير +20,300 ج.م في 3 سنوات + ربط لا سلكي بالموبايل عبر QR محلي أوفلاين دون باقة إنترنت.',
    salesPitchAr: 'في كالكس بتفتح العيادة على موبايلك وموبايل السكرتيرة وشاشة التلفزيون عبر QR الواي فاي المحلي بدون ما تدفع اشتراك شهري أو تحتاج إنترنت، وبملكية كاملة لبيانات عيادتك!'
  },
  {
    id: 'easy_clinic',
    nameAr: 'إيزي كلينيك (Easy Clinic / Pioneers)',
    category: 'شركات برمجيات (فيسبوك · يوتيوب)',
    pricingModel: 'رسوم تأسيس وتراخيص موديولات + صيانة ودعم سنوي (~12,000–25,000 ج.م / 3 سنوات)',
    cost3YearsEgp: 21000,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 12500,
    pros: [
      'نظام مؤسسي لحسابات العيادة والتعاقدات وتنظيم الاستقبال',
      'توفر نسخ مكتبية وسحابية للمراكز والشركات'
    ],
    cons: [
      'تعدد الموديولات المدفوعة ورسوم الصيانة/التجديد السنوي ترفع التكلفة الإجمالية على الطبيب الفردي',
      'تركيب وصيانة معقدة مقارنة بواجهة كالكس الفورية والنداء الصوتي والربط اللاسلكي عبر QR'
    ],
    qalixWinEdge: 'حزمة واحدة جاهزة بدون رسوم تأسيس أو تجديد سنوي، سريعة التنصيب في 5 دقائق مع حماية SHA-256 وAES-256.',
    salesPitchAr: 'بدل فواتير التأسيس والصيانة السنوية والموديولات المنفصلة، كالكس بيديك المنظومة كاملة جاهزة بالتخصصات المصرية، نداء صوتي، شات داخلي، وربط QR في 5 دقائق وبسعر نهائي موحد!'
  },
  {
    id: 'clinit_yolo',
    nameAr: 'كلينت / يولو (Clinit / Yolo Clinic)',
    category: 'تطبيقات سحابية (إنستجرام · تيك توك · آيفون)',
    pricingModel: 'باقات SaaS شهرية/سنوية (~700–1,400 ج.م/شهر حسب المستخدمين والرسائل)',
    cost3YearsEgp: 32400,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 23900,
    pros: [
      'تصميم عصري حديث يجذب أطباء الشباب عبر فيديوهات تيك توك وإنستجرام',
      'يدعم جلسات التجميل وتنبيهات المواعيد عبر السحابة'
    ],
    cons: [
      'إيجار سحابي مرتفع (~32,400 ج.م / 3 سنوات) يُغلق عند عدم التجديد ويشترط إنترنت دائم',
      'البيانات المالية والطبية خارج جهاز الطبيب دون سيادة أوفلاين أو نداء صوتي للشاشات'
    ],
    qalixWinEdge: 'نفس العصرية البصرية على جهازك المحلي، مع توفير +23,900 ج.م وأمان تشفير AES-256 وتشغيل لا يتأثر بانقطاع النت.',
    salesPitchAr: 'الشكل العصري موجود في كالكس وأقوى كمان على شاشة تلفزيون العيادة وموبايلك، بس الفرق إنك بتدفع مرة واحدة وتحتفظ بكل بيانات مرضاك ودخلك داخل جهازك بدون إيجار شهري مدى الحياة!'
  },
  {
    id: 'nilex_iclinics',
    nameAr: 'نيلكس / آي كلينيكس / كلينيكس أدمن',
    category: 'أنظمة تخصصية سحابية (إعلانات ميتا)',
    pricingModel: 'اشتراك شهري/سنوي متغير حسب الباقة والتخصص (~600–1,100 ج.م/شهر)',
    cost3YearsEgp: 25200,
    qalixCost3YearsEgp: 8500,
    savings3YearsEgp: 16700,
    pros: [
      'دعم قوالب متعددة التخصصات (أسنان، جلدية، أطفال)',
      'واجهات منفصلة للطبيب والاستقبال وإحصائيات الحجز'
    ],
    cons: [
      'تسعير اشتراك شهري مستمر يلتهم أرباح العيادة على المدى المتوسط ويتوقف بلا إنترنت',
      'يتطلب اشتراكات أعلى لإضافة الصيدلية أو نقل البيانات أو تشغيل شاشات النداء الصوتي'
    ],
    qalixWinEdge: 'حزم تخصصات جاهزة للاستيراد (أسنان، أطفال، باطنة/قلب، نساء، عيون) + محول Excel أوفلاين مدمج مجاناً مدى الحياة.',
    salesPitchAr: 'كالكس فيه حزم تخصصات مصرية جاهزة بأدويتها وتحاليلها ومحول نقل بيانات من الإكسيل في دقيقة مجاناً، وبتدفع مرة واحدة بس في العمر بدل إيجار شهري مفتوح!'
  }
];

/* ---------------- Helper Functions ---------------- */
function calculateDealFinancials(tierId, _isAssiut, commissionRate) {
  const tier = OFFICIAL_PRICING[tierId];
  if (!tier) throw new Error('باقة غير صالحة');
  const rate = Math.max(0, Math.min(50, Number(commissionRate) || 0));
  const fixedPrice = tier.price;
  const distributorCommission = Math.round(fixedPrice * (rate / 100));
  const agentNetAmount = fixedPrice - distributorCommission;
  return {
    tierId: tier.id,
    tierNameAr: tier.nameAr,
    fixedPrice,
    commissionRate: rate,
    distributorCommission,
    agentNetAmount
  };
}

function getAgentPaymentAccounts(targetDb, agentInfo) {
  const fallback = {
    instapay: agentInfo?.phone || '',
    instapayName: agentInfo?.titleAr || 'حساب الوكيل الرسمي',
    vodafoneCash: agentInfo?.phone || '',
    bankName: '',
    bankAccount: '',
    cashNote: 'توريد نقدي مباشر أو عبر المندوب المعتمد'
  };
  try {
    const row = (targetDb || db).prepare("SELECT value FROM agent_private_settings WHERE key = 'payment_accounts'").get();
    if (row && row.value) {
      return { ...fallback, ...JSON.parse(row.value) };
    }
  } catch (_) {}
  return fallback;
}

const { generateStandaloneDistributorPortalHtml: genPortal } = require('./portal_template');
function generateStandaloneDistributorPortalHtml(dist) {
  const netInfo = getLocalNetworkInfo(activePort || PORT);
  return genPortal(dist, AGENT_INFO, {
    activeSystem: ACTIVE_SYSTEM,
    pricing: OFFICIAL_PRICING,
    paymentAccounts: getAgentPaymentAccounts(db, AGENT_INFO),
    serverUrl: `http://${HOST}:${activePort || PORT}`,
    lanUrl: netInfo?.primaryMobileUrl || ''
  });
}

function writeDistributorKitFile(dist) {
  if (!dist || !dist.code || !dist.name) return null;
  if (!fs.existsSync(KITS_DIR)) fs.mkdirSync(KITS_DIR, { recursive: true });
  const kitHtml = generateStandaloneDistributorPortalHtml(dist);
  const safeName = String(dist.name).replace(/[<>:"/\\|?*\s]+/g, '_');
  const kitFile = path.join(KITS_DIR, `${dist.code}-${safeName}.html`);
  fs.writeFileSync(kitFile, kitHtml, 'utf8');
  return kitFile;
}

/* ---------------- REST API Handler ---------------- */
function sendJson(res, status, data) {
  const payload = (typeof isUniversalCleanMode === 'function' && isUniversalCleanMode())
    ? sanitizeValueForUniversalMode(data)
    : data;
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 1e6) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > maxBytes) {
        const err = new Error('Payload too large');
        err.statusCode = 413;
        req.destroy();
        reject(err);
      }
      else chunks.push(c);
    });
    req.on('end', () => {
      if (!size) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch {
        const err = new Error('Invalid JSON');
        err.statusCode = 400;
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function getSummaryResponse() {
  const distributors = db.prepare('SELECT * FROM distributors ORDER BY created_at DESC').all();
  const deals = db.prepare(`
    SELECT d.*, dist.name AS distributor_name, dist.code AS distributor_code, dist.governorate AS distributor_gov
    FROM deals d
    JOIN distributors dist ON dist.id = d.distributor_id
    ORDER BY d.created_at DESC
  `).all();
  const proposals = db.prepare('SELECT * FROM excellence_proposals ORDER BY created_at DESC').all();

  const statsPerDist = {};
  for (const dist of distributors) {
    statsPerDist[dist.id] = {
      totalDeals: 0,
      completedDeals: 0,
      pendingDeals: 0,
      grossSales: 0,
      totalDistributorCommission: 0,
      totalAgentNet: 0
    };
  }

  let totalGrossSales = 0;
  let totalDistributorCommissions = 0;
  let totalAgentNetRevenue = 0;
  let pendingAgentNetRevenue = 0;
  let completedDealsCount = 0;
  let pendingDealsCount = 0;

  for (const dl of deals) {
    const st = statsPerDist[dl.distributor_id];
    if (st) st.totalDeals++;
    if (dl.status === 'completed') {
      completedDealsCount++;
      totalGrossSales += dl.fixed_price;
      totalDistributorCommissions += dl.distributor_commission;
      totalAgentNetRevenue += dl.agent_net_amount;
      if (st) {
        st.completedDeals++;
        st.grossSales += dl.fixed_price;
        st.totalDistributorCommission += dl.distributor_commission;
        st.totalAgentNet += dl.agent_net_amount;
      }
    } else if (dl.status === 'pending') {
      pendingDealsCount++;
      pendingAgentNetRevenue += dl.agent_net_amount;
      if (st) st.pendingDeals++;
    }
  }

  const enrichedDistributors = distributors.map(d => ({
    ...d,
    metrics: statsPerDist[d.id]
  }));

  const audits = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 50').all();
  let pendingPaymentRequestsCount = 0;
  try {
    pendingPaymentRequestsCount = db.prepare("SELECT COUNT(*) AS c FROM payment_requests WHERE status = 'pending'").get().c;
  } catch (_) {}

  return {
    agent: AGENT_INFO,
    appLicense: getAppLicenseState(),
    isUniversalClean: isUniversalCleanMode(),
    agentsManagerContact: getAgentVisibleManagerContact(),
    pendingKeyRequestsCount: getPendingKeyRequestsCount(),
    pendingSystemKeyRequestsCount: getPendingKeyRequestsCount(ACTIVE_SYSTEM.id),
    paymentAccounts: getAgentPaymentAccounts(db, AGENT_INFO),
    pendingPaymentRequestsCount,
    activeSystem: {
      id: ACTIVE_SYSTEM.id,
      nameAr: ACTIVE_SYSTEM.nameAr,
      subtitleAr: ACTIVE_SYSTEM.subtitleAr,
      projectName: isUniversalCleanMode()
        ? 'Universal Agents & Distributors Platform'
        : (ACTIVE_SYSTEM.projectName || AGENT_INFO.projectName || 'Qalix Agent'),
      licensePrefix: ACTIVE_SYSTEM.licensePrefix || (isUniversalCleanMode() ? 'AGT2' : 'QLX2'),
      dbFileRel: path.relative(path.dirname(BASE_DATA_DIR), dbPath).replace(/\\/g, '/'),
      kitsDirRel: path.relative(path.dirname(BASE_DATA_DIR), KITS_DIR).replace(/\\/g, '/')
    },
    systemsCount: systemsRegistry.systems.length,
    pricing: OFFICIAL_PRICING,
    competitors: COMPETITORS_CATALOG,
    specialtyPacks: getAllPacks(),
    marketing: MARKETING_MATERIALS,
    network: getLocalNetworkInfo(PORT),
    kpis: {
      activeDistributors: distributors.filter(d => d.status === 'active').length,
      totalDistributors: distributors.length,
      completedDealsCount,
      pendingDealsCount,
      totalGrossSales,
      totalDistributorCommissions,
      totalAgentNetRevenue,
      pendingAgentNetRevenue,
      proposalsCount: proposals.length,
      competitorsCount: COMPETITORS_CATALOG.length,
      specialtyPacksCount: Object.keys(SPECIALTY_PACKS).length
    },
    distributors: enrichedDistributors,
    deals,
    proposals,
    audits
  };
}

function upsertUnifiedCase(targetDb, patch = {}) {
  try {
    const distId = String(patch.distributorId || '').trim();
    const customerName = String(patch.customerName || '').trim().slice(0, 140);
    if (!distId || !customerName) return null;

    const now = new Date().toISOString();
    const caseCodeIn = String(patch.caseCode || patch.trialCode || '').trim().toUpperCase().slice(0, 32);
    const payCodeIn = String(patch.paymentReqCode || '').trim().toUpperCase().slice(0, 32);

    let row = null;
    if (caseCodeIn) {
      row = targetDb.prepare('SELECT * FROM unified_workflow_cases WHERE UPPER(case_code) = ? OR UPPER(trial_code) = ?').get(caseCodeIn, caseCodeIn);
    }
    if (!row && payCodeIn) {
      row = targetDb.prepare('SELECT * FROM unified_workflow_cases WHERE UPPER(payment_req_code) = ?').get(payCodeIn);
    }
    if (!row) {
      row = targetDb.prepare('SELECT * FROM unified_workflow_cases WHERE distributor_id = ? AND customer_name = ? ORDER BY updated_at DESC LIMIT 1').get(distId, customerName);
    }

    let timeline = [];
    if (row && row.timeline_json) {
      try { timeline = JSON.parse(row.timeline_json); } catch (_) { timeline = []; }
    }
    if (patch.timelineEvent) {
      timeline.push({
        at: now,
        actorRole: String(patch.timelineEvent.actorRole || 'distributor'),
        actorName: String(patch.timelineEvent.actorName || ''),
        stage: String(patch.timelineEvent.stage || patch.stage || (row ? row.stage : 'rep_pending')),
        actionText: String(patch.timelineEvent.actionText || '').slice(0, 300)
      });
      if (timeline.length > 40) timeline = timeline.slice(-40);
    }

    const distRow = targetDb.prepare('SELECT governorate FROM distributors WHERE id = ?').get(distId);
    const gov = String(patch.governorate || (row && row.governorate) || (distRow && distRow.governorate) || '').slice(0, 80);
    const effRepAction = String(patch.repAction || ((row && row.rep_action) ? '' : (patch.repActionFallback || '')) || '').trim().slice(0, 260);
    const effTechAction = String(patch.techAction || ((row && row.tech_action) ? '' : (patch.techActionFallback || '')) || '').trim().slice(0, 260);

    if (row) {
      const nextRepAt = effRepAction ? (patch.repAt || now) : (row.rep_at || '');
      const nextTechAt = effTechAction ? (patch.techAt || now) : (row.tech_at || '');
      targetDb.prepare(`
        UPDATE unified_workflow_cases SET
          contact_info = CASE WHEN ? <> '' THEN ? ELSE contact_info END,
          governorate = ?,
          system_name = CASE WHEN ? <> '' THEN ? ELSE system_name END,
          rep_name = CASE WHEN ? <> '' THEN ? ELSE rep_name END,
          rep_action = CASE WHEN ? <> '' THEN ? ELSE rep_action END,
          rep_at = ?,
          tech_name = CASE WHEN ? <> '' THEN ? ELSE tech_name END,
          tech_action = CASE WHEN ? <> '' THEN ? ELSE tech_action END,
          tech_at = ?,
          trial_code = CASE WHEN ? <> '' THEN ? ELSE trial_code END,
          trial_device = CASE WHEN ? <> '' THEN ? ELSE trial_device END,
          trial_start_date = CASE WHEN ? <> '' THEN ? ELSE trial_start_date END,
          trial_end_date = CASE WHEN ? <> '' THEN ? ELSE trial_end_date END,
          payment_req_code = CASE WHEN ? <> '' THEN ? ELSE payment_req_code END,
          payment_status = CASE WHEN ? <> '' THEN ? ELSE payment_status END,
          activation_key = CASE WHEN ? <> '' THEN ? ELSE activation_key END,
          deal_no = CASE WHEN ? <> '' THEN ? ELSE deal_no END,
          stage = CASE WHEN ? <> '' THEN ? ELSE stage END,
          outcome = CASE WHEN ? <> '' THEN ? ELSE outcome END,
          timeline_json = ?,
          notified_agent = 1,
          updated_at = ?
        WHERE id = ?
      `).run(
        String(patch.contactInfo || ''), String(patch.contactInfo || ''),
        gov,
        String(patch.systemName || ''), String(patch.systemName || ''),
        String(patch.repName || ''), String(patch.repName || ''),
        effRepAction, effRepAction,
        nextRepAt,
        String(patch.techName || ''), String(patch.techName || ''),
        effTechAction, effTechAction,
        nextTechAt,
        String(patch.trialCode || ''), String(patch.trialCode || ''),
        String(patch.trialDevice || ''), String(patch.trialDevice || ''),
        String(patch.trialStartDate || ''), String(patch.trialStartDate || ''),
        String(patch.trialEndDate || ''), String(patch.trialEndDate || ''),
        payCodeIn, payCodeIn,
        String(patch.paymentStatus || ''), String(patch.paymentStatus || ''),
        String(patch.activationKey || ''), String(patch.activationKey || ''),
        String(patch.dealNo || ''), String(patch.dealNo || ''),
        String(patch.stage || ''), String(patch.stage || ''),
        String(patch.outcome || ''), String(patch.outcome || ''),
        JSON.stringify(timeline),
        now,
        row.id
      );
      return targetDb.prepare('SELECT * FROM unified_workflow_cases WHERE id = ?').get(row.id);
    }

    const id = 'case_' + crypto.randomBytes(6).toString('hex');
    const finalCaseCode = caseCodeIn || ('CASE-' + crypto.randomBytes(3).toString('hex').toUpperCase());
    targetDb.prepare(`
      INSERT INTO unified_workflow_cases(
        id, case_code, distributor_id, customer_name, contact_info, governorate, system_name,
        rep_name, rep_action, rep_at, tech_name, tech_action, tech_at,
        trial_code, trial_device, trial_start_date, trial_end_date,
        payment_req_code, payment_status, activation_key, deal_no,
        stage, outcome, timeline_json, notified_agent, created_at, updated_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id, finalCaseCode, distId, customerName,
      String(patch.contactInfo || '').slice(0, 160), gov, String(patch.systemName || ACTIVE_SYSTEM.nameAr || '').slice(0, 140),
      String(patch.repName || '').slice(0, 100), effRepAction, effRepAction ? now : '',
      String(patch.techName || '').slice(0, 100), effTechAction, effTechAction ? now : '',
      String(patch.trialCode || '').slice(0, 32), String(patch.trialDevice || '').slice(0, 100),
      String(patch.trialStartDate || '').slice(0, 20), String(patch.trialEndDate || '').slice(0, 20),
      payCodeIn, String(patch.paymentStatus || '').slice(0, 30),
      String(patch.activationKey || '').slice(0, 80), String(patch.dealNo || '').slice(0, 40),
      String(patch.stage || 'rep_pending').slice(0, 40), String(patch.outcome || '').slice(0, 260),
      JSON.stringify(timeline), now, now
    );
    return targetDb.prepare('SELECT * FROM unified_workflow_cases WHERE id = ?').get(id);
  } catch (_) {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Qalix-Manager-Token',
        'Access-Control-Max-Age': '86400'
      });
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      pathname = url.pathname;
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'qalix-agents-distributors-management',
        offlineMode: '100% Air-Gapped',
        activeSystemId: ACTIVE_SYSTEM.id,
        port: activePort,
        host: HOST,
        uptimeSec: Math.round(process.uptime())
      });
    }

    if (req.method === 'GET' && pathname === '/api/system/storage-health') {
      let writable = false;
      let writeError = null;
      const probePath = path.join(BASE_DATA_DIR, `.write_probe_${process.pid}.tmp`);
      try {
        fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
        fs.writeFileSync(probePath, 'ok', 'utf8');
        fs.unlinkSync(probePath);
        writable = true;
      } catch (err) {
        writeError = err.message;
      }
      const dbOk = db.prepare('PRAGMA quick_check').get().quick_check === 'ok';
      const mgrOk = managerHubDb.prepare('PRAGMA quick_check').get().quick_check === 'ok';
      return sendJson(res, 200, {
        ok: writable && dbOk && mgrOk,
        writable,
        writeError,
        dbIntegrityOk: dbOk,
        managerDbIntegrityOk: mgrOk,
        dataDir: BASE_DATA_DIR,
        safeBackupDir: getSafeExternalBackupDir(),
        activeDbPath: dbPath,
        managerHubDbPath: path.join(BASE_DATA_DIR, 'manager_hub.db'),
        manualKeysOnlyPolicy: true
      });
    }

    if (req.method === 'POST' && pathname === '/api/system/session-backup') {
      const result = runAutoSessionBackup('session_end');
      return sendJson(res, 200, { ok: true, ...result });
    }

    if (req.method === 'POST' && pathname === '/api/system/flush-storage') {
      try { db.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}
      try { managerHubDb.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}
      return sendJson(res, 200, { ok: true, flushedAt: new Date().toISOString(), dataDir: BASE_DATA_DIR });
    }

    if (req.method === 'GET' && pathname === '/api/license') {
      return sendJson(res, 200, { ok: true, license: getAppLicenseState() });
    }

    if (req.method === 'POST' && pathname === '/api/license') {
      const body = await readJsonBody(req);
      const token = String(body.licenseKey || body.token || '').trim();
      if (!token) return sendJson(res, 400, { error: 'يرجى إدخال مفتاح التفعيل الموقّع أولاً' });
      try {
        const updatedLic = appLicense.activateLicense(token, {
          dataDir: BASE_DATA_DIR,
          isUniversalClean: isUniversalCleanMode()
        });
        logAudit('app_license_activated', `تفعيل ترخيص المنظومة: ${updatedLic.displayNameAr} (${updatedLic.licenseId || ''})`);
        return sendJson(res, 200, { ok: true, license: updatedLic, summary: getSummaryResponse() });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    /* قفل وضع القراءة فقط عند انتهاء الـ 14 يوماً التجريبية أو إيقاف الترخيص (البيانات محفوظة بالكامل) */
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const activeAppLic = getAppLicenseState();
      if (activeAppLic.isLocked) {
        const allowReadOnlyWrite =
          pathname === '/api/license' ||
          pathname.startsWith('/api/backups/') ||
          pathname === '/api/systems/select';
        if (!allowReadOnlyWrite) {
          const lockMsg = activeAppLic.revoked
            ? (activeAppLic.licenseError || 'تم إيقاف ترخيص هذه النسخة — المنظومة تعمل للقراءة فقط وبياناتك محفوظة كما هي.')
            : `انتهت فترة المعاينة والتجربة المجانية (${appLicense.TRIAL_DAYS} يوماً)، والمنظومة تعمل الآن للقراءة فقط: يمكنك عرض كافة بياناتك وتنزيل نسخة احتياطية منها. لإضافة أو تعديل بيانات يرجى تفعيل مفتاح التفعيل (QLX2).`;
          return sendJson(res, 403, { error: lockMsg, licenseLocked: true, license: activeAppLic });
        }
      }
    }

    if (req.method === 'GET' && (pathname === '/api/bootstrap' || pathname === '/api/summary')) {
      return sendJson(res, 200, getSummaryResponse());
    }

    if (req.method === 'GET' && pathname === '/api/competitors') {
      return sendJson(res, 200, { ok: true, competitors: COMPETITORS_CATALOG, pricing: OFFICIAL_PRICING });
    }

    if (req.method === 'POST' && pathname === '/api/distributors') {
      const activeAppLic = getAppLicenseState();
      const existingCodes = db.prepare('SELECT code FROM distributors').all();
      if (!activeAppLic.isTrial && activeAppLic.maxDistributors < 9999 && existingCodes.length >= activeAppLic.maxDistributors) {
        return sendJson(res, 403, {
          error: `باقة "${activeAppLic.displayNameAr}" تتيح حتى ${activeAppLic.maxDistributors} موزعين كحد أقصى. يرجى الترقية لإضافة موزعين إضافيين.`,
          licenseUpgradeRequired: true
        });
      }
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const governorate = String(body.governorate || 'مصر').trim();
      const commissionRate = Math.max(5, Math.min(45, Number(body.commissionRate) || 27));
      const notes = String(body.notes || '').trim();
      if (!name || !phone) return sendJson(res, 400, { error: 'اسم الموزع ورقم الهاتف مطلوبان' });

      let maxSeq = 0;
      for (const row of existingCodes) {
        const m = String(row.code || '').match(/QMA-DIST-(\d+)/i);
        if (m) maxSeq = Math.max(maxSeq, Number(m[1]) || 0);
      }
      const nextSeq = Math.max(maxSeq + 1, existingCodes.length + 1);
      const id = 'dist_' + crypto.randomBytes(6).toString('hex');
      const code = `QMA-DIST-${String(nextSeq).padStart(2, '0')}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      const now = new Date().toISOString();

      db.prepare('INSERT INTO distributors(id, code, name, phone, governorate, commission_rate, status, access_pin, notes, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, code, name, phone, governorate, commissionRate, 'active', pin, notes, now);

      const distObj = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      const kitFile = writeDistributorKitFile(distObj);

      logAudit('create_distributor', `اعتماد موزع مستقل جديد: ${name} (${code}) بنسبة ${commissionRate}%`);
      return sendJson(res, 200, { ok: true, distributor: distObj, kitFile, summary: getSummaryResponse() });
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/distributors/')) {
      const id = pathname.split('/')[3];
      const body = await readJsonBody(req);
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });

      const status = body.status || dist.status;
      const rate = body.commissionRate !== undefined ? Math.max(5, Math.min(45, Number(body.commissionRate))) : dist.commission_rate;
      db.prepare('UPDATE distributors SET status = ?, commission_rate = ? WHERE id = ?').run(status, rate, id);
      const updatedDist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      writeDistributorKitFile(updatedDist);
      logAudit('update_distributor', `تحديث بيانات الموزع ${dist.code}: الحالة=${status}, النسبة=${rate}%`);
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/distributors/') && pathname.endsWith('/kit')) {
      const id = pathname.split('/')[3];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      const html = generateStandaloneDistributorPortalHtml(dist);
      const isPreview = url.searchParams.get('preview') === '1';
      return sendHtmlWithOptionalDownload(res, html, `${dist.code}-Standalone-Kit.html`, !isPreview);
    }

    if (req.method === 'POST' && pathname === '/api/deals') {
      const body = await readJsonBody(req);
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(String(body.distributorId || ''));
      if (!dist) return sendJson(res, 400, { error: 'يرجى اختيار موزع معتمد' });
      if (dist.status !== 'active') return sendJson(res, 400, { error: 'هذا الموزع موقوف حالياً' });

      const clinicName = String(body.clinicName || '').trim();
      const doctorName = String(body.doctorName || '').trim();
      const clinicPhone = String(body.clinicPhone || '').trim();
      const city = String(body.city || dist.governorate).trim();
      const isAssiut = 0;
      const tier = String(body.tier || 'professional');
      const hardwareId = String(body.hardwareId || '').trim().toUpperCase();
      const status = body.status === 'completed' ? 'completed' : 'pending';

      if (!clinicName || !doctorName) return sendJson(res, 400, { error: 'اسم العيادة واسم الطبيب مطلوبان' });

      const calc = calculateDealFinancials(tier, isAssiut, dist.commission_rate);
      const id = 'deal_' + crypto.randomBytes(6).toString('hex');
      const count = db.prepare('SELECT COUNT(*) AS n FROM deals').get().n + 101;
      const dealNo = `DEAL-2026-${count}`;
      const now = new Date().toISOString();
      const sysPrefix = ACTIVE_SYSTEM.licensePrefix || 'QLX2';
      const licenseRef = status === 'completed' ? `${sysPrefix}-${tier.toUpperCase().slice(0,3)}-${count}` : '';

      db.prepare(`INSERT INTO deals(
        id, deal_no, distributor_id, clinic_name, doctor_name, clinic_phone, city, is_assiut,
        tier, fixed_price, commission_rate, distributor_commission, agent_net_amount,
        hardware_id, status, license_key_ref, notes, created_at, settled_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, dealNo, dist.id, clinicName, doctorName, clinicPhone, city, isAssiut,
        calc.tierId, calc.fixedPrice, calc.commissionRate, calc.distributorCommission, calc.agentNetAmount,
        hardwareId, status, licenseRef, String(body.notes || ''), now, status === 'completed' ? now : ''
      );

      logAudit('create_deal', `تسجيل صفقة ${dealNo} عبر الموزع ${dist.code} للعيادة "${clinicName}" بالسعر الثابت ${calc.fixedPrice} ج.م (عمولة الموزع: ${calc.distributorCommission} ج.م، صافي الوكيل: ${calc.agentNetAmount} ج.م)`);
      upsertUnifiedCase(db, {
        distributorId: dist.id,
        customerName: clinicName,
        contactInfo: `${doctorName}${clinicPhone ? ' - ' + clinicPhone : ''}`,
        governorate: city || dist.governorate,
        dealNo,
        activationKey: licenseRef,
        paymentStatus: status === 'completed' ? 'approved' : 'pending',
        stage: status === 'completed' ? 'completed' : 'payment_pending',
        outcome: status === 'completed' ? `تم إغلاق وتفعيل الصفقة (${dealNo})` : `صفقة معلقة قيد التحصيل (${dealNo})`,
        timelineEvent: {
          actorRole: 'agent',
          actorName: AGENT_INFO.titleAr || 'الوكيل',
          stage: status === 'completed' ? 'completed' : 'payment_pending',
          actionText: `تسجيل الصفقة ${dealNo} بقيمة ${calc.fixedPrice} ج.م (${status === 'completed' ? 'مكتملة بمفتاح ' + licenseRef : 'معلقة'})`
        }
      });
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/deals/') && pathname.endsWith('/settle')) {
      const id = pathname.split('/')[3];
      const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
      if (!deal) return sendJson(res, 404, { error: 'الصفقة غير موجودة' });

      const now = new Date().toISOString();
      const sysPrefix = ACTIVE_SYSTEM.licensePrefix || 'QLX2';
      const licRef = `${sysPrefix}-${deal.tier.toUpperCase().slice(0, 3)}-${deal.deal_no.split('-').pop()}`;
      db.prepare("UPDATE deals SET status = 'completed', settled_at = ?, license_key_ref = ? WHERE id = ?")
        .run(now, licRef, id);

      logAudit('settle_deal', `اعتماد وتفعيل الصفقة ${deal.deal_no} وتحصيل صافي الوكيل (${deal.agent_net_amount} ج.م) وإصدار المرجع ${licRef}`);
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    /* ---------------- Excellence & #1 Leadership Proposals API ---------------- */
    if (req.method === 'POST' && pathname === '/api/proposals') {
      const body = await readJsonBody(req);
      const pillar = String(body.pillar || 'product').trim();
      const title = String(body.title || '').trim();
      const description = String(body.description || '').trim();
      const impact = String(body.impact || 'مرتفع جداً').trim();
      const priority = String(body.priority || 'أولوية قصوى').trim();
      const status = String(body.status || 'معتمد للتنفيذ').trim();
      if (!title || !description) return sendJson(res, 400, { error: 'عنوان المقترح وتفاصيله مطلوبان' });

      const id = 'prop_' + crypto.randomBytes(6).toString('hex');
      const now = new Date().toISOString();
      db.prepare('INSERT INTO excellence_proposals(id, pillar, title, description, impact, priority, status, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, pillar, title, description, impact, priority, status, now);

      logAudit('create_proposal', `إضافة مقترح ارتقاء وتطوير جديد (${pillar}): ${title}`);
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/proposals/')) {
      const id = pathname.split('/')[3];
      const body = await readJsonBody(req);
      const prop = db.prepare('SELECT * FROM excellence_proposals WHERE id = ?').get(id);
      if (!prop) return sendJson(res, 404, { error: 'المقترح غير موجود' });
      const status = String(body.status || prop.status);
      db.prepare('UPDATE excellence_proposals SET status = ? WHERE id = ?').run(status, id);
      logAudit('update_proposal', `تحديث حالة المقترح "${prop.title}" إلى: ${status}`);
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    /* ---------------- Specialty Packs API (Phase 3) ---------------- */
    if (req.method === 'GET' && pathname === '/api/specialty-packs') {
      return sendJson(res, 200, { ok: true, packs: getAllPacks() });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/specialty-packs/') && pathname.endsWith('/download')) {
      const id = pathname.split('/')[3];
      const pack = getPackById(id);
      if (!pack) return sendJson(res, 404, { error: 'حزمة التخصص غير موجودة' });
      const format = url.searchParams.get('format') || 'json';
      if (format === 'csv') {
        let csv = '\uFEFFType,Code,NameOrTrade,GenericOrDept,Price,NotesOrDosage\n';
        for (const s of pack.services) {
          csv += `"service","${s.code}","${s.name.replace(/"/g, '""')}","${s.department.replace(/"/g, '""')}",${s.price},"${(s.notes || '').replace(/"/g, '""')}"\n`;
        }
        for (const d of pack.drugs) {
          csv += `"drug","","${d.tradeName.replace(/"/g, '""')}","${d.genericName.replace(/"/g, '""')}",${d.defaultPrice},"${(d.dosageGuide || '').replace(/"/g, '""')}"\n`;
        }
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Qalix-Specialty-${pack.id}.csv"`
        });
        return res.end(csv);
      }
      const dataStr = JSON.stringify(pack, null, 2);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="Qalix-Specialty-${pack.id}.json"`
      });
      return res.end(dataStr);
    }

    if (req.method === 'GET' && pathname.startsWith('/api/specialty-packs/')) {
      const id = pathname.split('/')[3];
      const pack = getPackById(id);
      if (!pack) return sendJson(res, 404, { error: 'حزمة التخصص غير موجودة' });
      return sendJson(res, 200, { ok: true, pack });
    }

    /* ---------------- Data Migration Tool API (Phase 3) ---------------- */
    if (req.method === 'POST' && pathname === '/api/tools/migrate-data') {
      const body = await readJsonBody(req);
      const type = String(body.type || 'patients').trim();
      const rawText = String(body.rawText || '').trim();
      const delimiter = body.delimiter || undefined;
      if (!rawText) return sendJson(res, 400, { error: 'يرجى لصق أو كتابة نص البيانات المراد تحويلها' });

      const migrationResult = processMigration(type, rawText, delimiter);
      if (!migrationResult.ok) return sendJson(res, 400, { error: migrationResult.error });

      logAudit('migrate_data', `تحويل بيانات خارجية (${type}): تم استيراد ${migrationResult.successfulCount} سجل بنجاح`);
      return sendJson(res, 200, migrationResult);
    }

    /* ---------------- Marketing & Field Kits API (Phase 3) ---------------- */
    if (req.method === 'GET' && pathname === '/api/marketing/materials') {
      return sendJson(res, 200, { ok: true, materials: MARKETING_MATERIALS });
    }

    if (req.method === 'GET' && pathname === '/api/marketing/whatsapp-catalog') {
      const distId = url.searchParams.get('distId');
      const dist = distId ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId) : null;
      return sendHtmlWithOptionalDownload(
        res,
        renderWhatsAppCatalogA4(dist),
        'Qalix-WhatsApp-Sales-Catalog.html',
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname === '/api/marketing/wow-demo') {
      const distId = url.searchParams.get('distId');
      const dist = distId ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId) : null;
      return sendHtmlWithOptionalDownload(
        res,
        renderWowDemoA4(dist),
        'Qalix-WOW-5Min-Demo-Guide.html',
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname === '/api/marketing/battle-card') {
      const distId = url.searchParams.get('distId');
      const dist = distId ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId) : null;
      return sendHtmlWithOptionalDownload(
        res,
        renderBattleCardA4(dist),
        'Qalix-Competitive-Battle-Card.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Distributor Recruitment & Onboarding Cards API ---------------- */
    if (req.method === 'GET' && pathname === '/api/recruitment/flyer') {
      return sendHtmlWithOptionalDownload(
        res,
        renderDistributorRecruitmentCardHtml(AGENT_INFO),
        'Qalix-Distributor-Recruitment-Card.html',
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname === '/api/recruitment/onboarding-card') {
      return sendHtmlWithOptionalDownload(
        res,
        renderDistributorOnboardingCardHtml(AGENT_INFO),
        'Qalix-New-Distributor-Onboarding-Card.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Network Diagnostics & Mobile QR Access (Phase 4) ---------------- */
    if (req.method === 'GET' && pathname === '/api/network-status') {
      return sendJson(res, 200, { ok: true, network: getLocalNetworkInfo(PORT) });
    }

    /* ---------------- Legal Contracts & Handover Certificates (Phase 4) ---------------- */
    if (req.method === 'GET' && pathname.startsWith('/api/contracts/distributor/')) {
      const id = pathname.split('/')[4];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      return sendHtmlWithOptionalDownload(
        res,
        generateDistributorContractHtml(dist, AGENT_INFO),
        `Qalix-Contract-${dist.code}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname.startsWith('/api/contracts/deal/')) {
      const id = pathname.split('/')[4];
      const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
      if (!deal) return sendJson(res, 404, { error: 'الصفقة غير موجودة' });
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(deal.distributor_id);
      return sendHtmlWithOptionalDownload(
        res,
        generateClinicHandoverHtml(deal, dist || { name: 'الموزع المعتمد', code: 'DIST' }, AGENT_INFO),
        `Qalix-Handover-${deal.deal_no}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname.startsWith('/api/distributors/') && pathname.endsWith('/statement')) {
      const id = pathname.split('/')[3];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      const deals = db.prepare('SELECT * FROM deals WHERE distributor_id = ? ORDER BY created_at DESC').all(id);
      return sendHtmlWithOptionalDownload(
        res,
        generateDistributorStatementHtml(dist, deals, AGENT_INFO),
        `Qalix-Statement-${dist.code}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Official Quotation Generator (Phase 5) ---------------- */
    if (req.method === 'GET' && pathname === '/api/quotations/generate') {
      const qParams = Object.fromEntries(url.searchParams.entries());
      const quoData = generateQuotationData(qParams, OFFICIAL_PRICING);
      return sendHtmlWithOptionalDownload(
        res,
        generateQuotationHtml(quoData),
        `Qalix-Quotation-${quoData.quotationNo || 'A4'}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    if (req.method === 'GET' && pathname === '/api/quotations/data') {
      const qParams = Object.fromEntries(url.searchParams.entries());
      const quoData = generateQuotationData(qParams, OFFICIAL_PRICING);
      return sendJson(res, 200, { ok: true, quotation: quoData });
    }

    /* ---------------- Doctor Objections Playbook (Phase 5) ---------------- */
    if (req.method === 'GET' && pathname === '/api/playbook/objections') {
      return sendJson(res, 200, { ok: true, playbook: getAllObjections() });
    }

    if (req.method === 'GET' && pathname === '/api/playbook/objections/a4') {
      const distId = url.searchParams.get('distId');
      const dist = distId ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId) : null;
      return sendHtmlWithOptionalDownload(
        res,
        renderObjectionsPlaybookA4(dist || {}),
        'Qalix-8-Objections-Playbook.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- After-Sales Success & Retention Tracker (Phase 5) ---------------- */
    if (req.method === 'GET' && pathname === '/api/after-sales/milestones') {
      return sendJson(res, 200, { ok: true, milestones: RETENTION_MILESTONES });
    }

    if (req.method === 'GET' && pathname === '/api/after-sales/deals') {
      const deals = db.prepare(`
        SELECT d.*, dist.name AS distributor_name, dist.phone AS distributor_phone
        FROM deals d
        LEFT JOIN distributors dist ON d.distributor_id = dist.id
        WHERE d.status = 'completed'
        ORDER BY d.created_at DESC
      `).all();
      const enriched = deals.map(d => calculateDealTimeline(d));
      return sendJson(res, 200, { ok: true, deals: enriched });
    }

    /* ---------------- Database Snapshots & Backup Manager (Phase 5) ---------------- */
    if (req.method === 'POST' && pathname === '/api/backup/create') {
      const snapshot = createDatabaseSnapshot(db, DATA_DIR);
      logAudit('backup_created', `إنشاء نقطة استعادة جديدة لقاعدة بيانات الوكيل: ${snapshot.filename} (بصمة: ${snapshot.sha256.substring(0, 12)}...)`);
      return sendJson(res, 201, { ok: true, snapshot });
    }

    if (req.method === 'GET' && pathname === '/api/backup/list') {
      const snapshots = listDatabaseSnapshots(DATA_DIR);
      return sendJson(res, 200, { ok: true, snapshots });
    }

    if (req.method === 'POST' && pathname === '/api/backup/verify') {
      const body = await readJsonBody(req);
      const safeName = path.basename(String(body.filename || '').trim());
      if (!safeName || !safeName.endsWith('.db') || safeName !== String(body.filename || '').trim()) {
        return sendJson(res, 400, { error: 'اسم ملف النسخة الاحتياطية غير صالح' });
      }
      try {
        const result = verifySnapshotFile(path.join(DATA_DIR, 'backups', safeName));
        return sendJson(res, 200, { ok: true, filename: safeName, verification: result });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/backup/restore') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لإتمام الاستعادة', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      try {
        const restored = restoreDatabaseSnapshot(db, DATA_DIR, body.filename, dbPath, {
          closeActiveDb: () => {
            const openConn = dbPool.get(ACTIVE_SYSTEM.id);
            if (openConn) {
              try { openConn.close(); } catch (_) {}
              dbPool.delete(ACTIVE_SYSTEM.id);
            }
          },
          reopenActiveDb: () => {
            activateRuntimeSystem(ACTIVE_SYSTEM.id);
          }
        });
        logAudit('backup_restored', `استعادة آمنة لقاعدة بيانات المنظومة (${ACTIVE_SYSTEM.id}) من نقطة: ${restored.restoredFilename} — بعد أخذ نقطة أمان: ${restored.preRestoreSnapshot.filename}`);
        return sendJson(res, 200, { ok: true, restored, summary: getSummaryResponse() });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/backup/export-data') {
      const exportData = exportFullSystemJson(db, {
        agentPhone: (ACTIVE_SYSTEM.agentInfo && ACTIVE_SYSTEM.agentInfo.phone) ? ACTIVE_SYSTEM.agentInfo.phone : '',
        systemTitle: ACTIVE_SYSTEM.nameAr || 'Universal Agents & Distributors Database Export'
      });
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="Qalix-Agent-FullBackup-${new Date().toISOString().split('T')[0]}.json"`
      });
      return res.end(exportData.jsonStr);
    }

    /* ---------------- Visual Analytics Charts API (Phase 6) ---------------- */
    if (req.method === 'GET' && pathname === '/api/analytics/charts') {
      const deals = db.prepare('SELECT * FROM deals').all();
      const distributors = db.prepare('SELECT * FROM distributors').all();
      const sum = getSummaryResponse();
      const charts = getAnalyticsPayload(deals, distributors, sum.kpis);
      return sendJson(res, 200, { ok: true, charts });
    }

    /* ---------------- Distributor Training Simulator & Accreditation API (Phase 6) ---------------- */
    if (req.method === 'GET' && pathname === '/api/training/modules') {
      return sendJson(res, 200, { ok: true, modules: TRAINING_MODULES, questions: EXAM_QUESTIONS });
    }

    if (req.method === 'POST' && pathname === '/api/training/submit-exam') {
      const body = await readJsonBody(req);
      const distId = String(body.distributorId || '');
      const answers = body.answers || {};
      const evalResult = evaluateExam(answers);

      if (distId && evalResult.passed) {
        logAudit('distributor_accredited', `اجتياز محاكاة التدريب الميداني والاعتماد الرسمي للموزع ${distId} بنسبة 100%`);
      }

      return sendJson(res, 200, { ok: true, result: evalResult });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/training/certificate/')) {
      const distId = pathname.split('/')[4];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      return sendHtmlWithOptionalDownload(
        res,
        generateAccreditationCertificateHtml(dist),
        `Qalix-Certificate-${dist.code}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Clinic Audit & Go-Live Checklist API (Phase 6) ---------------- */
    if (req.method === 'GET' && pathname === '/api/checklist/pre-install') {
      return sendJson(res, 200, { ok: true, checkpoints: AUDIT_CHECKPOINTS });
    }

    if (req.method === 'POST' && pathname === '/api/checklist/evaluate') {
      const body = await readJsonBody(req);
      const checkedIds = Array.isArray(body.checkedIds) ? body.checkedIds : [];
      const evalResult = evaluateClinicChecklist(checkedIds);
      return sendJson(res, 200, { ok: true, evaluation: evalResult });
    }

    if (req.method === 'GET' && pathname === '/api/checklist/report') {
      const qParams = Object.fromEntries(url.searchParams.entries());
      const checkedIds = (qParams.checked || '').split(',').filter(Boolean);
      const evalResult = evaluateClinicChecklist(checkedIds);
      return sendHtmlWithOptionalDownload(
        res,
        generateClinicAuditReportHtml(qParams, evalResult),
        'Qalix-Clinic-Readiness-Report.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- WhatsApp Broadcast Campaigns API (Phase 6) ---------------- */
    if (req.method === 'GET' && pathname === '/api/broadcast/campaigns') {
      return sendJson(res, 200, { ok: true, campaigns: getAllCampaigns() });
    }

    if (req.method === 'POST' && pathname === '/api/broadcast/compose') {
      const body = await readJsonBody(req);
      const composed = composeCampaignMessage(body.campaignId, body.vars || {});
      return sendJson(res, 200, { ok: true, message: composed });
    }

    /* ---------------- Distributor Tier Progression & Regional Franchise (Phase 7) ---------------- */
    if (req.method === 'GET' && pathname === '/api/hierarchy/tiers') {
      return sendJson(res, 200, { ok: true, tiers: COMMISSION_TIERS });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/hierarchy/distributor/') && !pathname.endsWith('/letter')) {
      const distId = pathname.split('/')[4];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      const deals = db.prepare('SELECT * FROM deals').all();
      const profile = getDistributorHierarchyProfile(dist, deals);
      return sendJson(res, 200, { ok: true, profile });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/hierarchy/distributor/') && pathname.endsWith('/letter')) {
      const distId = pathname.split('/')[4];
      const dist = db.prepare('SELECT * FROM distributors WHERE id = ?').get(distId);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير موجود' });
      const deals = db.prepare('SELECT * FROM deals').all();
      const profile = getDistributorHierarchyProfile(dist, deals);
      return sendHtmlWithOptionalDownload(
        res,
        generateTierPromotionLetterHtml(profile, AGENT_INFO),
        `Qalix-Tier-Letter-${dist.code}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Financial Forecasting & 12-Month Projections (Phase 7) ---------------- */
    if (req.method === 'GET' && pathname === '/api/financial/forecast') {
      const scenKey = url.searchParams.get('scenario') || 'balanced';
      const forecast = calculate12MonthForecast(scenKey);
      return sendJson(res, 200, { ok: true, forecast, scenarios: SCENARIOS });
    }

    /* ---------------- Presentations & Marketing Catalog API (Phase 8) ---------------- */
    if (req.method === 'GET' && pathname === '/api/marketing/presentation-assets') {
      return sendJson(res, 200, {
        ok: true,
        facebookCampaigns: MARKETING_MATERIALS.facebookCampaigns || [],
        clinicalGallery: MARKETING_MATERIALS.clinicalGallery || [],
        presentationCollateral: MARKETING_MATERIALS.presentationCollateral || [],
        marketingVideos: MARKETING_MATERIALS.marketingVideos || []
      });
    }

    /* ---------------- Legal & Handover Documents API (Phase 8) ---------------- */
    if (req.method === 'GET' && pathname === '/api/legal/delivery-documents') {
      if (isUniversalCleanMode()) {
        return sendJson(res, 200, {
          ok: true,
          documents: [
            { id: 'doc_agent_cat', format: 'A4 HTML', title: '📘 دليل تشغيل الوكيل الحصري (A–Z)', description: 'دليل التشغيل الكامل للوكيل لإدارة الشبكة والموزعين والتسليم الميداني.', url: '/api/catalogs/agent', isPrintable: true },
            { id: 'doc_dist_cat', format: 'A4 HTML', title: '💼 دليل عمل الموزع الميداني (A–Z)', description: 'المرجع الميداني الكامل للموزع لتنفيذ الصفقات وتوريد الإيصالات.', url: '/api/catalogs/distributor', isPrintable: true },
            { id: 'doc_weekly_digest', format: 'A4 HTML', title: '📊 التقرير التنفيذي الدوري المعتمد', description: 'ملخص الأداء الأسبوعي والمبيعات والتحصيل وحالة التراخيص للطباعة.', url: '/api/reports/weekly-digest', isPrintable: true }
          ]
        });
      }
      return sendJson(res, 200, {
        ok: true,
        documents: MARKETING_MATERIALS.legalHandoverDocs || []
      });
    }

    /* ---------------- Territory Protection & Lead Locks API (Phase 9) ---------------- */
    if (req.method === 'GET' && pathname === '/api/territory/list') {
      return sendJson(res, 200, {
        ok: true,
        territories: PROTECTED_TERRITORIES,
        locks: getLeadLocks(db)
      });
    }

    if (req.method === 'POST' && pathname === '/api/territory/lock-lead') {
      const body = await readJsonBody(req);
      try {
        const result = lockClinicLead(db, body);
        logAudit('lock_lead', `حجز عيادة للموزع (${body.distributorName || 'مستقل'}): ${body.clinicName} (${body.doctorName}) لمدة 14 يوماً`);
        return sendJson(res, 201, result);
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    /* ---------------- Payment Receipts & Verification API (Phase 9) ---------------- */
    if (req.method === 'GET' && pathname === '/api/receipts/channels') {
      return sendJson(res, 200, { ok: true, channels: PAYMENT_CHANNELS });
    }

    function renderDynamicUniversalCatalogHtml(role = 'distributor') {
      const sysName = escapeHtml(ACTIVE_SYSTEM.nameAr || 'منظومة إدارة الوكلاء والموزعين الموحدة');
      const isAgent = role === 'agent';
      const title = isAgent
        ? `كتالوج تشغيل الوكيل الحصري (A-Z) — ${sysName}`
        : `كتالوج عمل الموزع الميداني (A-Z) — ${sysName}`;
      const steps = isAgent
        ? [
            ['1. تهيئة المنظومة والبيانات', 'ضبط اسم النشاط والهاتف الرسمي، وتأمين دخول مدير الوكلاء برمز PIN، ومراجعة حالة الترخيص والتفعيل.'],
            ['2. إضافة الموزعين وتوليد البوابات', 'إنشاء كود فريد لكل موزع وتحديد نسبة العمولة، ثم تسليمه ملف البوابة المستقلة (.html) للعمل أوفلاين.'],
            ['3. حوكمة المدفوعات والتوريد', 'استلام إشعارات الدفع وإيصالات التوريد من الموزعين، ومطابقة صافي التوريد قبل اعتماد التفعيل.'],
            ['4. النسخ الاحتياطي والمزامنة', 'النسخ التلقائي نهاية كل جلسة إلى مجلد Documents\\UniversalAgentsBackups مع دعم حزم المزامنة الموقعة أوفلاين.'],
            ['5. العقود وكشوف الحسابات والتقارير', 'إصدار عقود الموزعين، محاضر التسليم، كشوف الحساب التفصيلية، والتقارير التنفيذية للطباعة A4 أو PDF.']
          ]
        : [
            ['1. استلام البوابة المستقلة (.html)', 'يعمل الموزع من خلال ملف البوابة المستقلة المرسَل له من الوكيل مباشرة بدون الحاجة لاتصال دائم بالخادم.'],
            ['2. تسجيل العملاء والصفقات الميدانية', 'إدخال بيانات العميل والباقة المطلوبة، وتحديد المندوب ثم الفني المسؤول عن التركيب والتشغيل.'],
            ['3. حجز النطاق ومتابعة التنفيذ', 'تسجيل قفل الحجز الميداني لمنع تضارب الموزعين، ومتابعة مراحل التنفيذ خطوة بخطوة حتى التسليم.'],
            ['4. إرسال إيصال التوريد وتأكيد الدفع', 'إرفاق بيانات التحويل أو الإيصال وإرساله للوكيل لمراجعته وإصدار إذن التفعيل الرسمي.'],
            ['5. تسليم العميل ومتابعة ما بعد البيع', 'توقيع محضر التسليم الميداني، ومتابعة العميل في محطات الرضاء الدورية لضمان الاستمرارية والترقية.']
          ];
      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; background:#f8fafc; color:#0f172a; margin:0; padding:24px; direction:rtl; }
  .sheet { max-width:820px; margin:0 auto; background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:28px; box-shadow:0 8px 24px rgba(15,23,42,0.08); }
  .head { border-bottom:2px solid #0284c7; padding-bottom:14px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
  h1 { margin:0; font-size:20px; color:#0f172a; }
  .badge { background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
  .step { border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:12px; background:#f8fafc; }
  .step h3 { margin:0 0 6px; font-size:15px; color:#0369a1; }
  .step p { margin:0; font-size:13.5px; line-height:1.75; color:#334155; }
  .foot { margin-top:20px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:12px; color:#64748b; display:flex; justify-content:space-between; }
  @media print { body { background:#fff; padding:0; } .sheet { box-shadow:none; border:none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${title}</h1>
        <div style="font-size:12.5px; color:#475569; margin-top:4px;">دليل التشغيل القياسي المعتمد · Powered by Qalix Platform</div>
      </div>
      <span class="badge">${isAgent ? 'خاص بالوكيل' : 'دليل الموزع الميداني'}</span>
    </div>
    ${steps.map(([h, p]) => `<div class="step"><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></div>`).join('')}
    <div class="foot">
      <span>${sysName}</span>
      <span>نسخة قياسية جاهزة للطباعة A4</span>
    </div>
  </div>
</body>
</html>`;
    }

    if (req.method === 'GET' && pathname === '/api/catalogs/agent') {
      const catPath = path.join(ROOT, 'كتالوج_تشغيل_الوكيل_الحصري.html');
      const html = fs.existsSync(catPath) ? fs.readFileSync(catPath, 'utf8') : renderDynamicUniversalCatalogHtml('agent');
      const dl = url.searchParams.get('download') === '1';
      return sendHtmlWithOptionalDownload(res, html, 'Universal-Agent-Operations-Catalog-A-Z.html', dl);
    }

    if (req.method === 'GET' && pathname === '/api/catalogs/distributor') {
      const catPath = path.join(PRESENTATIONS_DIR, 'كتالوج_تشغيل_الموزع_الميداني.html');
      const html = fs.existsSync(catPath) ? fs.readFileSync(catPath, 'utf8') : renderDynamicUniversalCatalogHtml('distributor');
      const dl = url.searchParams.get('download') === '1';
      return sendHtmlWithOptionalDownload(res, html, 'Universal-Distributor-Field-Catalog-A-Z.html', dl);
    }

    if (req.method === 'GET' && pathname === '/api/receipts/generate') {
      const qParams = Object.fromEntries(url.searchParams.entries());
      const dealId = qParams.dealId;
      let deal = null;
      if (dealId) {
        deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(dealId);
      }
      const dist = deal ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(deal.distributor_id) : null;
      const tier = deal ? OFFICIAL_PRICING[deal.tier] : (OFFICIAL_PRICING[qParams.tier] || OFFICIAL_PRICING.professional);
      const stdPrice = tier.price;
      const isAssiut = false;
      const paid = deal ? deal.fixed_price : tier.price;
      const recNo = 'REC-2026-' + (deal ? deal.deal_no.replace(/[^0-9]/g, '') : Math.floor(100 + Math.random() * 900));
      const channelKey = qParams.channel || 'instapay';
      const channel = PAYMENT_CHANNELS[channelKey] || PAYMENT_CHANNELS.instapay;
      const refId = qParams.refId || (deal ? (deal.license_key_ref || 'TRX-PAID') : 'IPN-' + Math.floor(10000000 + Math.random() * 90000000));
      const sha = crypto.createHash('sha256').update(`${recNo}|${paid}|${refId}`).digest('hex');

      const receiptData = {
        receiptNo: recNo,
        receiptDate: new Date().toLocaleDateString('ar-EG'),
        clinicName: deal ? deal.clinic_name : (qParams.clinicName || 'عيادة النخبة التخصصية'),
        doctorName: deal ? deal.doctor_name : (qParams.doctorName || 'السيد الدكتور المحترم'),
        city: deal ? deal.city : (qParams.city || 'القاهرة'),
        governorate: dist ? dist.governorate : 'القاهرة',
        clinicPhone: deal ? deal.clinic_phone : (qParams.phone || '01011223344'),
        tierNameAr: tier.nameAr,
        distributorName: dist ? dist.name : (qParams.distributorName || 'الموزع المعتمد'),
        distributorCode: dist ? dist.code : (qParams.distributorCode || 'DIST'),
        distributorPhone: dist ? dist.phone : (qParams.distributorPhone || ''),
        channelNameAr: channel.nameAr,
        referenceId: refId,
        standardPrice: stdPrice,
        amountPaid: paid,
        amountPaidInWords: paid.toLocaleString('ar-EG'),
        isAssiut,
        sha256: sha
      };

      return sendHtmlWithOptionalDownload(
        res,
        generateReceiptHtml(receiptData, AGENT_INFO),
        `Qalix-Receipt-${recNo}.html`,
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Commercial Alerts & Executive Digest API (Phase 9) ---------------- */
    if (req.method === 'GET' && pathname === '/api/alerts/commercial') {
      const alerts = calculateCommercialAlerts(db);
      return sendJson(res, 200, { ok: true, alerts });
    }

    if (req.method === 'GET' && pathname === '/api/reports/weekly-digest') {
      const sum = getSummaryResponse();
      return sendHtmlWithOptionalDownload(
        res,
        generateExecutiveWeeklyDigestHtml(sum, AGENT_INFO),
        'Qalix-Weekly-Executive-Digest.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- R&D Proposals Blueprint v2.0 Exporter (Phase 9) ---------------- */
    if (req.method === 'GET' && pathname === '/api/proposals/document') {
      const proposals = db.prepare('SELECT * FROM excellence_proposals ORDER BY created_at ASC').all();
      return sendHtmlWithOptionalDownload(
        res,
        generateProposalsDocumentHtml(proposals, AGENT_INFO),
        'Qalix-RD-Proposals-v2.0.html',
        url.searchParams.get('download') === '1'
      );
    }

    /* ---------------- Agent-Only Confidential Platform Owner Channel ---------------- */
    if (req.method === 'GET' && pathname === '/api/agent/owner-channel') {
      const nameRow = db.prepare("SELECT value FROM agent_private_settings WHERE key = 'platform_owner_name'").get();
      const phoneRow = db.prepare("SELECT value FROM agent_private_settings WHERE key = 'platform_owner_phone'").get();
      return sendJson(res, 200, {
        ok: true,
        ownerName: nameRow ? nameRow.value : (isUniversalCleanMode() ? 'إدارة منصة كالكس الأم' : 'صاحب منصة كالكس'),
        ownerPhone: phoneRow ? phoneRow.value : ''
      });
    }

    if (req.method === 'POST' && pathname === '/api/agent/owner-channel') {
      const body = await readJsonBody(req);
      const ownerName = String(body.ownerName || (isUniversalCleanMode() ? 'إدارة منصة كالكس الأم' : 'صاحب منصة كالكس')).trim().slice(0, 120);
      const ownerPhone = String(body.ownerPhone || '').replace(/[^0-9+]/g, '').slice(0, 20);
      const upsert = db.prepare('INSERT INTO agent_private_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      upsert.run('platform_owner_name', ownerName);
      upsert.run('platform_owner_phone', ownerPhone);
      logAudit('owner_channel_update', 'تحديث إعدادات القناة السرية المباشرة للوكيل مع صاحب منصة كالكس');
      return sendJson(res, 200, { ok: true, ownerName, ownerPhone });
    }

    /* ---------------- Agent Payment Accounts & Distributor Receipt Confirmation Workflow ---------------- */
    if (req.method === 'GET' && pathname === '/api/agent/payment-accounts') {
      return sendJson(res, 200, { ok: true, accounts: getAgentPaymentAccounts(db, AGENT_INFO) });
    }

    if (req.method === 'POST' && pathname === '/api/agent/payment-accounts') {
      const body = await readJsonBody(req);
      const accounts = {
        instapay: String(body.instapay || '').trim().slice(0, 80),
        instapayName: String(body.instapayName || '').trim().slice(0, 120),
        vodafoneCash: String(body.vodafoneCash || '').trim().slice(0, 40),
        bankName: String(body.bankName || '').trim().slice(0, 100),
        bankAccount: String(body.bankAccount || '').trim().slice(0, 80),
        cashNote: String(body.cashNote || 'توريد نقدي مباشر أو عبر المندوب المعتمد').trim().slice(0, 160)
      };
      db.prepare('INSERT INTO agent_private_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .run('payment_accounts', JSON.stringify(accounts));
      // Sync distributor portal kits with updated payment channels
      try {
        for (const d of db.prepare('SELECT * FROM distributors').all()) writeDistributorKitFile(d);
      } catch (_) {}
      logAudit('payment_accounts_update', 'تحديث حسابات وقنوات استلام الدفع للمنظومة النشطة');
      return sendJson(res, 200, { ok: true, accounts });
    }

    if (req.method === 'GET' && pathname === '/api/payment-requests') {
      const rows = db.prepare(`
        SELECT pr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM payment_requests pr
        JOIN distributors d ON d.id = pr.distributor_id
        ORDER BY CASE pr.status WHEN 'pending' THEN 0 ELSE 1 END, pr.created_at DESC
      `).all();
      return sendJson(res, 200, { ok: true, requests: rows });
    }

    if (req.method === 'GET' && pathname === '/api/payment-requests/status') {
      const reqCode = String(url.searchParams.get('reqCode') || '').trim().toUpperCase();
      if (!reqCode) return sendJson(res, 400, { error: 'يرجى تحديد كود الطلب (reqCode)' });
      const row = db.prepare(`
        SELECT pr.id, pr.req_code, pr.customer_name, pr.tier, pr.fixed_price, pr.agent_net_amount,
               pr.payment_channel, pr.payment_ref, pr.status, pr.activation_key, pr.deal_id,
               pr.notes, pr.created_at, pr.reviewed_at, dl.deal_no
        FROM payment_requests pr
        LEFT JOIN deals dl ON dl.id = pr.deal_id
        WHERE UPPER(pr.req_code) = ?
      `).get(reqCode);
      if (!row) return sendJson(res, 404, { error: 'طلب التفعيل غير موجود في هذه المنظومة' });
      return sendJson(res, 200, { ok: true, request: row });
    }

    if (req.method === 'POST' && pathname === '/api/payment-requests') {
      const body = await readJsonBody(req, 5 * 1024 * 1024);
      const rawDistCode = String(body.distributorCode || '').trim();
      const rawDistId = String(body.distributorId || '').trim();
      const dist = rawDistId
        ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(rawDistId)
        : db.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(rawDistCode.toUpperCase());
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير مسجل في هذه المنظومة' });
      if (body.accessPin && String(body.accessPin).trim() !== String(dist.access_pin)) {
        return sendJson(res, 403, { error: 'رمز PIN غير صحيح لهذا الموزع' });
      }

      const customerName = String(body.customerName || body.clinicName || '').trim().slice(0, 140);
      if (!customerName) return sendJson(res, 400, { error: 'اسم العميل أو المنشأة مطلوب' });
      const contactName = String(body.contactName || body.doctorName || customerName).trim().slice(0, 120);
      const customerPhone = String(body.customerPhone || body.clinicPhone || '').trim().slice(0, 40);
      const city = String(body.city || dist.governorate || '').trim().slice(0, 80);
      const tierRaw = String(body.tier || 'professional').trim();
      const normalizedTier = tierRaw === 'pro' ? 'professional' : (tierRaw === 'ent' ? 'enterprise' : tierRaw);
      const calc = calculateDealFinancials(normalizedTier, 0, dist.commission_rate);

      const hardwareOrRef = String(body.hardwareOrRef || body.hardwareId || '').trim().toUpperCase().slice(0, 120);
      const paymentChannel = String(body.paymentChannel || 'إنستاباي (InstaPay)').trim().slice(0, 80);
      const paymentRef = String(body.paymentRef || '').trim().slice(0, 100);
      const receiptFilename = String(body.receiptFilename || '').replace(/[^a-zA-Z0-9_.\-\u0600-\u06FF]/g, '_').slice(0, 100);
      let receiptDataUrl = String(body.receiptDataUrl || '').trim();
      if (receiptDataUrl && !/^data:(image\/(png|jpeg|jpg|webp|gif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(receiptDataUrl)) {
        receiptDataUrl = '';
      }
      if (receiptDataUrl.length > 3.5 * 1024 * 1024) {
        return sendJson(res, 413, { error: 'حجم صورة الإيصال يتجاوز الحد الأقصى المسموح (3.5 ميجابايت)' });
      }

      const providedCode = String(body.reqCode || '').trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 24);
      const reqCode = providedCode || ('REQ-' + crypto.randomBytes(3).toString('hex').toUpperCase());
      const id = 'preq_' + crypto.randomBytes(6).toString('hex');
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO payment_requests(
        id, req_code, distributor_id, customer_name, contact_name, customer_phone, city,
        tier, fixed_price, commission_rate, distributor_commission, agent_net_amount,
        hardware_or_ref, payment_channel, payment_ref, receipt_filename, receipt_data_url,
        status, activation_key, deal_id, notes, created_at, reviewed_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', '', ?, ?, '')`).run(
        id, reqCode, dist.id, customerName, contactName, customerPhone, city,
        calc.tierId, calc.fixedPrice, calc.commissionRate, calc.distributorCommission, calc.agentNetAmount,
        hardwareOrRef, paymentChannel, paymentRef, receiptFilename, receiptDataUrl,
        String(body.notes || '').slice(0, 500), now
      );

      logAudit('payment_request_submitted', `استلام طلب تأكيد دفع بالريسيت (${reqCode}) من الموزع ${dist.code} لصالح "${customerName}" بمبلغ صافي ${calc.agentNetAmount} ج.م عبر ${paymentChannel}`);
      upsertUnifiedCase(db, {
        distributorId: dist.id,
        customerName,
        contactInfo: `${contactName}${customerPhone ? ' - ' + customerPhone : ''}`,
        governorate: city || dist.governorate,
        repName: String(body.repName || ''),
        repActionFallback: String(body.repName || '') ? `أتم العرض والتعاقد مع العميل عبر الموزع ${dist.code}` : '',
        techName: String(body.techName || ''),
        paymentReqCode: reqCode,
        paymentStatus: 'pending',
        stage: 'payment_pending',
        outcome: `بانتظار مراجعة الوكيل لريسيت الدفع (${reqCode})`,
        timelineEvent: {
          actorRole: 'distributor',
          actorName: dist.name,
          stage: 'payment_pending',
          actionText: `أرسل الموزع طلب تأكيد دفع بالريسيت (${reqCode}) بمبلغ صافي ${calc.agentNetAmount} ج.م عبر ${paymentChannel}`
        }
      });
      const createdRow = db.prepare(`
        SELECT pr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM payment_requests pr JOIN distributors d ON d.id = pr.distributor_id WHERE pr.id = ?
      `).get(id);
      return sendJson(res, 201, { ok: true, request: createdRow });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/payment-requests/') && pathname.endsWith('/approve')) {
      const id = pathname.split('/')[3];
      const pr = db.prepare(`
        SELECT pr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM payment_requests pr JOIN distributors d ON d.id = pr.distributor_id WHERE pr.id = ?
      `).get(id);
      if (!pr) return sendJson(res, 404, { error: 'طلب الدفع غير موجود' });
      if (pr.status === 'approved') {
        return sendJson(res, 200, { ok: true, request: pr, summary: getSummaryResponse() });
      }

      const body = await readJsonBody(req);
      const count = db.prepare('SELECT COUNT(*) AS n FROM deals').get().n + 101;
      const dealId = 'deal_' + crypto.randomBytes(6).toString('hex');
      const dealNo = `DEAL-2026-${count}`;
      const activationKey = String(body.activationKey || '').trim() || 'PENDING_MANUAL_KEY_FROM_PLATFORM';
      const now = new Date().toISOString();

      db.prepare(`INSERT INTO deals(
        id, deal_no, distributor_id, clinic_name, doctor_name, clinic_phone, city, is_assiut,
        tier, fixed_price, commission_rate, distributor_commission, agent_net_amount,
        hardware_id, status, license_key_ref, notes, created_at, settled_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)`).run(
        dealId, dealNo, pr.distributor_id, pr.customer_name, pr.contact_name || pr.customer_name, pr.customer_phone || '', pr.city || '',
        pr.tier, pr.fixed_price, pr.commission_rate, pr.distributor_commission, pr.agent_net_amount,
        pr.hardware_or_ref || '', activationKey,
        `تأكيد ريسيت الدفع (${pr.req_code}) عبر ${pr.payment_channel}${pr.payment_ref ? ' - مرجع ' + pr.payment_ref : ''}`,
        now, now
      );

      db.prepare("UPDATE payment_requests SET status = 'approved', activation_key = ?, deal_id = ?, reviewed_at = ?, notes = COALESCE(?, notes) WHERE id = ?")
        .run(activationKey, dealId, now, body.notes ? String(body.notes).slice(0, 500) : null, id);

      logAudit('payment_request_approved', `تأكيد استلام الدفع لطلب ${pr.req_code} (${dealNo}) وتفعيل المفتاح ${activationKey} للموزع ${pr.distributor_code}`);
      upsertUnifiedCase(db, {
        distributorId: pr.distributor_id,
        customerName: pr.customer_name,
        paymentReqCode: pr.req_code,
        paymentStatus: 'approved',
        activationKey,
        dealNo,
        stage: 'tech_deploying',
        outcome: `تم تأكيد الدفع وإصدار المفتاح ${activationKey} — جاهز لتشغيل الفني`,
        timelineEvent: {
          actorRole: 'agent',
          actorName: AGENT_INFO.titleAr || 'الوكيل',
          stage: 'tech_deploying',
          actionText: `اعتمد الوكيل الدفع (${pr.agent_net_amount} ج.م) وأصدر المفتاح ${activationKey} للصفقة ${dealNo}`
        }
      });

      const waText = [
        `✅ *تم تأكيد استلام الدفع وإصدار مفتاح التفعيل — ${ACTIVE_SYSTEM.nameAr}*`,
        `• كود الطلب: ${pr.req_code}`,
        `• رقم الصفقة: ${dealNo}`,
        `• العميل: ${pr.customer_name}`,
        `• صافي المبلغ المؤكد: ${pr.agent_net_amount} ج.م (${pr.payment_channel})`,
        `• 🔑 *مفتاح التفعيل / التوثيق:* ${activationKey}`,
        ``,
        `يمكنك الآن تسليم العميل المفتاح وطباعة محضر التسليم من بوابتك.`
      ].join('\n');

      const updatedReq = db.prepare(`
        SELECT pr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM payment_requests pr JOIN distributors d ON d.id = pr.distributor_id WHERE pr.id = ?
      `).get(id);
      return sendJson(res, 200, { ok: true, request: updatedReq, dealNo, activationKey, waText, summary: getSummaryResponse() });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/payment-requests/') && pathname.endsWith('/reject')) {
      const id = pathname.split('/')[3];
      const pr = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(id);
      if (!pr) return sendJson(res, 404, { error: 'طلب الدفع غير موجود' });
      const body = await readJsonBody(req);
      const reason = String(body.reason || body.notes || 'لم يتم العثور على التحويل أو الإيصال غير واضح').trim().slice(0, 400);
      const now = new Date().toISOString();
      db.prepare("UPDATE payment_requests SET status = 'rejected', notes = ?, reviewed_at = ? WHERE id = ?").run(reason, now, id);
      logAudit('payment_request_rejected', `رفض طلب الدفع ${pr.req_code}: ${reason}`);
      return sendJson(res, 200, { ok: true, reqCode: pr.req_code, reason, summary: getSummaryResponse() });
    }

    /* ---------------- Trial Registration & Mandatory Stage Transition Notification API ---------------- */
    if (req.method === 'GET' && pathname === '/api/trial-reports') {
      const rows = db.prepare(`
        SELECT tr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM trial_stage_reports tr
        JOIN distributors d ON d.id = tr.distributor_id
        ORDER BY tr.updated_at DESC
      `).all();
      return sendJson(res, 200, { ok: true, reports: rows });
    }

    if (req.method === 'POST' && pathname === '/api/trial-reports') {
      const body = await readJsonBody(req);
      const rawDistId = String(body.distributorId || '').trim();
      const rawDistCode = String(body.distributorCode || '').trim().toUpperCase();
      const dist = rawDistId
        ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(rawDistId)
        : db.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(rawDistCode);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير مسجل في هذه المنظومة' });

      const customerName = String(body.customerName || '').trim().slice(0, 140);
      if (!customerName) return sendJson(res, 400, { error: 'اسم العميل أو المنشأة مطلوب لتسجيل النسخة التجريبية' });

      const STAGE_LABELS = {
        trial_installed: '1️⃣ مرحلة التجريب (تم تثبيت النسخة التجريبية للعميل)',
        rep_pending:     '1️⃣ بانتظار زيارة المندوب الأولى',
        rep_visited:     '🤝 تمت زيارة المندوب والعرض',
        rep_followup:    '🧑‍💼 متابعة المندوب خلال فترة التجريب',
        payment_pending: '💳 جاهز للشراء وتأكيد الدفع',
        tech_assigned:   '🛠️ لدى الفني للتركيب والتفعيل',
        tech_deploying:  '🛠️ لدى الفني للتنفيذ والتدريب',
        completed:       '✅ منجز ومفعّل بالكامل 100%'
      };

      const stage = String(body.stage || 'trial_installed').trim().slice(0, 40);
      const contactInfo = String(body.contactInfo || '').trim().slice(0, 160);
      const governorate = String(body.governorate || dist.governorate || '').trim().slice(0, 80);
      const sysName = String(body.systemName || ACTIVE_SYSTEM.nameAr || 'المنظومة').trim().slice(0, 140);
      const trialDeviceOrId = String(body.trialDeviceOrId || '').trim().slice(0, 100);
      const startDate = String(body.trialStartDate || new Date().toISOString().slice(0, 10)).slice(0, 20);
      const endDate = String(body.trialEndDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)).slice(0, 20);
      const repName = String(body.repName || '').trim().slice(0, 100);
      const techName = String(body.techName || '').trim().slice(0, 100);
      const cardSummary = String(body.cardSummary || STAGE_LABELS[stage] || stage).trim().slice(0, 600);
      const notes = String(body.notes || '').trim().slice(0, 600);
      const now = new Date().toISOString();

      const providedCode = String(body.reportCode || '').trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 28);
      const existing = providedCode
        ? db.prepare('SELECT * FROM trial_stage_reports WHERE UPPER(report_code) = ?').get(providedCode)
        : null;

      let reportCode = providedCode || ('TRL-' + crypto.randomBytes(3).toString('hex').toUpperCase());
      let rowId;

      if (existing) {
        rowId = existing.id;
        reportCode = existing.report_code;
        db.prepare(`
          UPDATE trial_stage_reports
          SET customer_name = ?, contact_info = ?, governorate = ?, system_name = ?,
              trial_device_or_id = ?, trial_start_date = ?, trial_end_date = ?,
              stage = ?, rep_name = ?, tech_name = ?, card_summary = ?, notes = ?,
              notified_agent = 1, updated_at = ?
          WHERE id = ?
        `).run(
          customerName, contactInfo, governorate, sysName,
          trialDeviceOrId, startDate, endDate,
          stage, repName, techName, cardSummary, notes,
          now, rowId
        );
      } else {
        rowId = 'trl_' + crypto.randomBytes(6).toString('hex');
        db.prepare(`
          INSERT INTO trial_stage_reports(
            id, report_code, distributor_id, customer_name, contact_info, governorate, system_name,
            trial_device_or_id, trial_start_date, trial_end_date, stage, rep_name, tech_name,
            card_summary, notes, notified_agent, created_at, updated_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(
          rowId, reportCode, dist.id, customerName, contactInfo, governorate, sysName,
          trialDeviceOrId, startDate, endDate, stage, repName, techName,
          cardSummary, notes, now, now
        );
      }

      const stText = STAGE_LABELS[stage] || stage;
      logAudit('trial_stage_notified', `إخطار الوكيل ببطاقة الموزع (${dist.code}) للعميل "${customerName}" [${reportCode}] — المرحلة: ${stText}`);
      upsertUnifiedCase(db, {
        caseCode: reportCode,
        distributorId: dist.id,
        customerName,
        contactInfo,
        governorate,
        systemName: sysName,
        repName,
        repActionFallback: repName ? (notes || `متابعة المندوب (${stText})`) : '',
        techName,
        techActionFallback: (techName && (stage === 'tech_assigned' || stage === 'tech_deploying' || stage === 'completed')) ? (notes || stText) : '',
        trialCode: reportCode,
        trialDevice: trialDeviceOrId,
        trialStartDate: startDate,
        trialEndDate: endDate,
        stage,
        outcome: notes || stText,
        timelineEvent: {
          actorRole: repName && stage.startsWith('rep') ? 'rep' : (techName && (stage.startsWith('tech') || stage === 'completed') ? 'tech' : 'distributor'),
          actorName: (stage.startsWith('rep') && repName) ? repName : ((stage.startsWith('tech') || stage === 'completed') && techName ? techName : dist.name),
          stage,
          actionText: `${stText}${notes ? ' — ' + notes : ''}`
        }
      });

      const waText = [
        `📡 *إخطار وتحديث بطاقة العميل للوكيل — ${sysName}*`,
        `• كود المتابعة: ${reportCode}`,
        `• الموزع: ${dist.name} (${dist.code}) · ${governorate}`,
        `• العميل: ${customerName}${contactInfo ? ' (' + contactInfo + ')' : ''}`,
        trialDeviceOrId ? `• مرجع النسخة التجريبية / الجهاز: ${trialDeviceOrId}` : '',
        `• فترة التجريب (14 يوماً): من ${startDate} إلى ${endDate}`,
        `• المرحلة الحالية: *${stText}*`,
        repName ? `• 1️⃣ المندوب المسؤول: ${repName}` : '',
        techName ? `• 2️⃣ الفني المكلّف: ${techName}` : '',
        notes ? `• ملاحظات وتحديث البطاقة: ${notes}` : ''
      ].filter(Boolean).join('\n');

      const savedRow = db.prepare(`
        SELECT tr.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
        FROM trial_stage_reports tr JOIN distributors d ON d.id = tr.distributor_id WHERE tr.id = ?
      `).get(rowId);
      return sendJson(res, existing ? 200 : 201, { ok: true, report: savedRow, waText });
    }

    /* ---------------- Unified Field Team & Full Rep -> Tech -> Distributor -> Agent -> Owner Pipeline ---------------- */
    if (req.method === 'GET' && pathname === '/api/field-team') {
      const distIdFilter = String(url.searchParams.get('distributorId') || '').trim();
      const rows = distIdFilter
        ? db.prepare(`
            SELECT ft.*, d.name AS distributor_name, d.code AS distributor_code
            FROM distributor_field_team ft JOIN distributors d ON d.id = ft.distributor_id
            WHERE ft.distributor_id = ? ORDER BY ft.created_at DESC
          `).all(distIdFilter)
        : db.prepare(`
            SELECT ft.*, d.name AS distributor_name, d.code AS distributor_code
            FROM distributor_field_team ft JOIN distributors d ON d.id = ft.distributor_id
            ORDER BY ft.created_at DESC
          `).all();
      return sendJson(res, 200, { ok: true, members: rows });
    }

    if (req.method === 'POST' && pathname === '/api/field-team') {
      const body = await readJsonBody(req);
      const rawDistId = String(body.distributorId || '').trim();
      const rawDistCode = String(body.distributorCode || '').trim().toUpperCase();
      const dist = rawDistId
        ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(rawDistId)
        : db.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(rawDistCode);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير مسجل في هذه المنظومة' });

      const name = String(body.name || '').trim().slice(0, 100);
      if (!name) return sendJson(res, 400, { error: 'اسم المندوب أو الفني مطلوب' });
      const role = body.role === 'tech' ? 'tech' : 'rep';
      const phone = String(body.phone || '').trim().slice(0, 30);
      const zone = String(body.zone || dist.governorate || '').trim().slice(0, 80);
      const fee = Number(body.fee || 0) || 0;
      const status = ['available', 'busy', 'off'].includes(body.status) ? body.status : 'available';
      const id = String(body.id || '').trim().slice(0, 40) || ('tm_' + crypto.randomBytes(5).toString('hex'));
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO distributor_field_team(id, distributor_id, name, role, phone, zone, fee, status, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name, role = excluded.role, phone = excluded.phone,
          zone = excluded.zone, fee = excluded.fee, status = excluded.status
      `).run(id, dist.id, name, role, phone, zone, fee, status, now);
      logAudit('field_team_sync', `تحديث فريق الموزع ${dist.code}: ${role === 'rep' ? 'مندوب' : 'فني'} "${name}" (${zone}) - ${status}`);
      const member = db.prepare('SELECT * FROM distributor_field_team WHERE id = ?').get(id);
      return sendJson(res, 200, { ok: true, member });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/field-team/')) {
      const id = pathname.split('/')[3];
      db.prepare('DELETE FROM distributor_field_team WHERE id = ?').run(id);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/unified-pipeline') {
      const distFilter = String(url.searchParams.get('distributorId') || '').trim();
      const rawRows = distFilter
        ? db.prepare(`
            SELECT uc.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
            FROM unified_workflow_cases uc JOIN distributors d ON d.id = uc.distributor_id
            WHERE uc.distributor_id = ? ORDER BY uc.updated_at DESC
          `).all(distFilter)
        : db.prepare(`
            SELECT uc.*, d.name AS distributor_name, d.code AS distributor_code, d.phone AS distributor_phone
            FROM unified_workflow_cases uc JOIN distributors d ON d.id = uc.distributor_id
            ORDER BY uc.updated_at DESC
          `).all();

      const cases = rawRows.map(r => {
        let timeline = [];
        try { timeline = JSON.parse(r.timeline_json || '[]'); } catch (_) {}
        return { ...r, timeline };
      });
      const stats = {
        totalCases: cases.length,
        repActionsLogged: cases.filter(c => c.rep_action).length,
        techActionsLogged: cases.filter(c => c.tech_action).length,
        trialsActive: cases.filter(c => c.stage === 'trial_installed' || c.trial_code).length,
        paymentsPending: cases.filter(c => c.payment_status === 'pending' || c.stage === 'payment_pending').length,
        completedCases: cases.filter(c => c.stage === 'completed').length
      };
      return sendJson(res, 200, { ok: true, stats, cases });
    }

    if (req.method === 'POST' && pathname === '/api/unified-pipeline') {
      const body = await readJsonBody(req);
      const rawDistId = String(body.distributorId || '').trim();
      const rawDistCode = String(body.distributorCode || '').trim().toUpperCase();
      const dist = rawDistId
        ? db.prepare('SELECT * FROM distributors WHERE id = ?').get(rawDistId)
        : db.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(rawDistCode);
      if (!dist) return sendJson(res, 404, { error: 'الموزع غير مسجل في هذه المنظومة' });

      const customerName = String(body.customerName || '').trim().slice(0, 140);
      if (!customerName) return sendJson(res, 400, { error: 'اسم العميل مطلوب في سلسلة الترابط الموحد' });

      const actorRole = String(body.actorRole || 'distributor').trim();
      const actorName = String(body.actorName || dist.name).trim();
      const actionText = String(body.actionText || body.outcome || '').trim();
      const stage = String(body.stage || 'rep_pending').trim();

      const savedCase = upsertUnifiedCase(db, {
        caseCode: body.caseCode,
        distributorId: dist.id,
        customerName,
        contactInfo: body.contactInfo,
        governorate: body.governorate || dist.governorate,
        systemName: body.systemName || ACTIVE_SYSTEM.nameAr,
        repName: body.repName,
        repAction: body.repAction || (actorRole === 'rep' ? actionText : ''),
        techName: body.techName,
        techAction: body.techAction || (actorRole === 'tech' ? actionText : ''),
        trialCode: body.trialCode,
        trialDevice: body.trialDevice,
        trialStartDate: body.trialStartDate,
        trialEndDate: body.trialEndDate,
        paymentReqCode: body.paymentReqCode,
        paymentStatus: body.paymentStatus,
        activationKey: body.activationKey,
        dealNo: body.dealNo,
        stage,
        outcome: body.outcome || actionText,
        timelineEvent: actionText ? { actorRole, actorName, stage, actionText } : null
      });
      logAudit('unified_case_sync', `تحديث سلسلة العمل الموحدة [${savedCase?.case_code || ''}] للعميل "${customerName}" — المرحلة: ${stage}${actionText ? ' | ' + actionText : ''}`);
      return sendJson(res, 200, { ok: true, caseItem: savedCase });
    }

    /* ---------------- Agents Manager PIN Lock & Role Session Guard ---------------- */
    if (req.method === 'GET' && pathname === '/api/manager/auth/status') {
      return sendJson(res, 200, { ok: true, auth: getManagerAuthStatus(managerHubDb, req) });
    }

    if (req.method === 'POST' && pathname === '/api/manager/auth/set-pin') {
      const body = await readJsonBody(req);
      const resCfg = configureManagerPin(managerHubDb, {
        newPin: body.newPin !== undefined ? body.newPin : body.pin,
        currentPin: body.currentPin
      });
      if (!resCfg.ok) return sendJson(res, resCfg.status || 400, { error: resCfg.error });
      logAudit('manager_pin_configured', resCfg.pinEnabled ? 'تفعيل/تحديث قفل PIN الخاص بمدير الوكلاء' : 'إلغاء قفل PIN الخاص بمدير الوكلاء');
      return sendJson(res, 200, {
        ok: true,
        pinEnabled: resCfg.pinEnabled,
        session: resCfg.session,
        auth: getManagerAuthStatus(managerHubDb, { headers: resCfg.session ? { 'x-qalix-manager-token': resCfg.session.token } : {} })
      });
    }

    if (req.method === 'POST' && pathname === '/api/manager/auth/login') {
      const body = await readJsonBody(req);
      const authRes = loginWithManagerPin(managerHubDb, body.pin);
      if (!authRes.ok) return sendJson(res, authRes.status || 401, { error: authRes.error });
      logAudit('manager_pin_unlocked', 'تسجيل دخول مدير الوكلاء بنجاح');
      return sendJson(res, 200, { ok: true, pinEnabled: authRes.pinEnabled, session: authRes.session });
    }

    if (req.method === 'POST' && pathname === '/api/manager/auth/logout') {
      const hdrTok = String(req.headers['x-qalix-manager-token'] || '').trim();
      if (hdrTok) {
        try { managerHubDb.prepare('DELETE FROM manager_sessions WHERE token = ?').run(hdrTok); } catch (_) {}
      }
      return sendJson(res, 200, { ok: true, auth: getManagerAuthStatus(managerHubDb, { headers: {} }) });
    }

    /* ---------------- Agents Manager (مدير الوكلاء) Main Control, Agent Assignment & Manual Key Inbox ---------------- */
    if (req.method === 'GET' && pathname === '/api/manager/overview') {
      const auth = getManagerAuthStatus(managerHubDb, req);
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      const rawProfile = getManagerHubProfile();
      const profile = auth.locked
        ? { managerName: rawProfile.managerName, managerPhone: rawProfile.managerPhone, ownerName: 'مخفي (يتطلب فتح قفل مدير الوكلاء)', ownerPhone: '' }
        : rawProfile;
      const keyRequests = managerHubDb.prepare('SELECT * FROM agent_key_requests ORDER BY created_at DESC LIMIT 200').all();
      const slaSummary = collectSlaAlerts({
        systemsRegistry,
        baseDataDir: BASE_DATA_DIR,
        baseKitsDir: BASE_KITS_DIR,
        activeSystemId: ACTIVE_SYSTEM.id,
        activeDb: db,
        slaMaxDays: Number(url.searchParams.get('slaDays') || 5)
      });
      const systems = systemsRegistry.systems.map(s => {
        const st = summarizeSystemStats(BASE_DATA_DIR, BASE_KITS_DIR, s);
        return {
          ...st,
          agentName: s.agentInfo?.agentName || s.agentInfo?.titleAr || `وكيل ${s.nameAr}`,
          agentPhone: s.agentInfo?.phone || '',
          pendingKeyRequestsCount: getPendingKeyRequestsCount(s.id)
        };
      });
      return sendJson(res, 200, {
        ok: true,
        auth,
        activeSystemId: ACTIVE_SYSTEM.id,
        profile,
        slaSummary,
        hierarchy: [
          { level: 1, role: 'صاحب المنصة (المطور)', visibility: 'مخفي تماماً — لا يعرفه ولا يتواصل معه إلا مدير الوكلاء فقط (مفاتيح التفعيل وأدوات إنشائها خارجه تماماً)' },
          { level: 2, role: 'مدير الوكلاء (صاحب هذه اللوحة الرئيسية)', visibility: 'يرى جميع الوكلاء والمنظومات الـ 11 ويحضر المفاتيح يدوياً من صاحب المنصة — لا يعرفه إلا الوكلاء فقط' },
          { level: 3, role: 'الوكيل (وكيل المنظومة المختارة)', visibility: 'يتواصل مع مدير الوكلاء لطلب مفاتيح التفعيل ويدير الموزعين فقط' },
          { level: 4, role: 'الموزع', visibility: 'يعرف الوكيل فقط ويدير فريق الميدان (مندوب + فني)' },
          { level: 5, role: 'المندوب', visibility: 'الزيارة الأولى والعرض والتعاقد وتسجيل البيانات' },
          { level: 6, role: 'الفني', visibility: 'التركيب وتفعيل المفتاح المُسلَّم والتدريب والتسليم النهائي' }
        ],
        systems,
        keyRequests
      });
    }

    if (req.method === 'POST' && pathname === '/api/manager/profile') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى إدخال رمز PIN لمدير الوكلاء لتعديل القناة السرية', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      const upsertSetting = managerHubDb.prepare('INSERT INTO manager_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      if (body.managerName !== undefined) upsertSetting.run('manager_name', String(body.managerName || '').trim().slice(0, 120) || 'مدير الوكلاء العام');
      if (body.managerPhone !== undefined) upsertSetting.run('manager_phone', String(body.managerPhone || '').replace(/[^0-9+]/g, '').slice(0, 20));
      if (body.ownerName !== undefined) upsertSetting.run('platform_owner_name', String(body.ownerName || '').trim().slice(0, 120));
      if (body.ownerPhone !== undefined) upsertSetting.run('platform_owner_phone', String(body.ownerPhone || '').replace(/[^0-9+]/g, '').slice(0, 20));
      logAudit('manager_profile_updated', 'تحديث بيانات تواصل مدير الوكلاء وقناته السرية مع صاحب المنصة');
      return sendJson(res, 200, { ok: true, profile: getManagerHubProfile(), agentsManagerContact: getAgentVisibleManagerContact() });
    }

    if (req.method === 'GET' && pathname === '/api/role-profiles') {
      return sendJson(res, 200, { ok: true, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/role-profiles/switch') {
      const body = await readJsonBody(req);
      const roleKey = String(body.roleKey || '').trim();
      if (!USER_ROLE_DEFINITIONS.some(d => d.key === roleKey)) {
        return sendJson(res, 400, { error: 'دور غير صالح' });
      }
      managerHubDb.prepare("INSERT INTO manager_settings(key, value) VALUES('active_user_role', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(roleKey);
      return sendJson(res, 200, { ok: true, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/role-profiles') {
      const body = await readJsonBody(req);
      const roleKey = String(body.roleKey || '').trim();
      if (!USER_ROLE_DEFINITIONS.some(d => d.key === roleKey)) {
        return sendJson(res, 400, { error: 'دور غير صالح' });
      }
      const avatar = String(body.avatarDataUrl || '').trim();
      if (avatar && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(avatar)) {
        return sendJson(res, 400, { error: 'صيغة الصورة غير مدعومة (يُسمح بـ PNG/JPG/WEBP فقط)' });
      }
      if (avatar.length > 1600000) {
        return sendJson(res, 400, { error: 'حجم الصورة كبير جداً (الحد الأقصى 1.5 ميجابايت)' });
      }
      const nowIso = new Date().toISOString();
      managerHubDb.prepare(`
        INSERT INTO role_profiles(role_key, full_name, phone, title, region, email, bio, avatar_data_url, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(role_key) DO UPDATE SET
          full_name = excluded.full_name,
          phone = excluded.phone,
          title = excluded.title,
          region = excluded.region,
          email = excluded.email,
          bio = excluded.bio,
          avatar_data_url = excluded.avatar_data_url,
          updated_at = excluded.updated_at
      `).run(
        roleKey,
        String(body.fullName || '').trim().slice(0, 120),
        String(body.phone || '').replace(/[^0-9+\-\s]/g, '').trim().slice(0, 24),
        String(body.title || '').trim().slice(0, 100),
        String(body.region || '').trim().slice(0, 100),
        String(body.email || '').trim().slice(0, 120),
        String(body.bio || '').trim().slice(0, 400),
        avatar,
        nowIso
      );
      if (body.setActiveRole === true) {
        managerHubDb.prepare("INSERT INTO manager_settings(key, value) VALUES('active_user_role', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(roleKey);
      }
      logAudit('role_profile_updated', `تحديث بيانات وصورة الحساب للدور: ${roleKey}`);
      return sendJson(res, 200, { ok: true, ...getRoleProfilesState() });
    }

    if (req.method === 'GET' && pathname === '/api/accounts/requests') {
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/requests') {
      const body = await readJsonBody(req);
      const roleKey = String(body.roleKey || '').trim();
      const fullName = String(body.fullName || '').trim().slice(0, 120);
      if (!['agent', 'distributor', 'rep', 'technician'].includes(roleKey)) {
        return sendJson(res, 400, { error: 'الدور المطلوب يجب أن يكون: وكيل أو موزع أو مندوب أو فني' });
      }
      if (!fullName) return sendJson(res, 400, { error: 'يرجى إدخال الاسم الكامل للحساب المطلوب' });
      const nowIso = new Date().toISOString();
      const id = 'ACC_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex').toUpperCase();
      const parentMap = { agent: 'agents_manager', distributor: 'agent', rep: 'distributor', technician: 'distributor' };
      const parentRole = parentMap[roleKey] || 'owner';
      const requestedByRole = String(body.requestedByRole || parentRole).trim();
      const allowedCreators = {
        agent: ['owner', 'agents_manager'],
        distributor: ['owner', 'agent'],
        rep: ['owner', 'distributor'],
        technician: ['owner', 'distributor']
      };
      if (!(allowedCreators[roleKey] || []).includes(requestedByRole)) {
        const parentNames = { agents_manager: 'مدير الوكلاء', agent: 'الوكيل', distributor: 'الموزع' };
        return sendJson(res, 403, { error: `التسلسل الإداري: إنشاء هذا الحساب مقتصر على (${parentNames[parentRole] || 'صاحب العمل'}) أو صاحب العمل فقط.` });
      }
      const autoApprove = body.autoApprove !== false && (requestedByRole === 'owner' || requestedByRole === parentRole);
      const status = autoApprove ? 'approved' : 'pending';
      const approvedByRole = autoApprove ? requestedByRole : '';
      managerHubDb.prepare(`
        INSERT INTO account_requests(id, role_key, full_name, phone, region, parent_role, requested_by_role, status, approved_by_role, notes, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        roleKey,
        fullName,
        String(body.phone || '').replace(/[^0-9+\-\s]/g, '').trim().slice(0, 24),
        String(body.region || '').trim().slice(0, 100),
        parentRole,
        requestedByRole,
        status,
        approvedByRole,
        String(body.notes || '').trim().slice(0, 300),
        nowIso,
        nowIso
      );
      if (autoApprove) {
        const def = USER_ROLE_DEFINITIONS.find(d => d.key === roleKey);
        managerHubDb.prepare(`
          INSERT INTO role_profiles(role_key, full_name, phone, title, region, updated_at)
          VALUES(?, ?, ?, ?, ?, ?)
          ON CONFLICT(role_key) DO UPDATE SET
            full_name = excluded.full_name,
            phone = excluded.phone,
            region = excluded.region,
            updated_at = excluded.updated_at
        `).run(roleKey, fullName, String(body.phone || '').trim().slice(0, 24), def ? def.nameAr : roleKey, String(body.region || '').trim().slice(0, 100), nowIso);
      }
      logAudit('account_request_created', `إنشاء حساب (${roleKey}) بواسطة (${requestedByRole}): ${fullName} [${status}]`);
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 201, { ok: true, id, status, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/requests/approve') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const decision = body.decision === 'rejected' ? 'rejected' : 'approved';
      const approvedByRole = String(body.approvedByRole || 'owner').trim();
      const existing = managerHubDb.prepare('SELECT * FROM account_requests WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'طلب الحساب غير موجود' });
      const nowIso = new Date().toISOString();
      managerHubDb.prepare('UPDATE account_requests SET status = ?, approved_by_role = ?, updated_at = ? WHERE id = ?')
        .run(decision, approvedByRole, nowIso, id);
      if (decision === 'approved') {
        const def = USER_ROLE_DEFINITIONS.find(d => d.key === existing.role_key);
        managerHubDb.prepare(`
          INSERT INTO role_profiles(role_key, full_name, phone, title, region, updated_at)
          VALUES(?, ?, ?, ?, ?, ?)
          ON CONFLICT(role_key) DO UPDATE SET
            full_name = excluded.full_name,
            phone = excluded.phone,
            region = excluded.region,
            updated_at = excluded.updated_at
        `).run(existing.role_key, existing.full_name, existing.phone || '', def ? def.nameAr : existing.role_key, existing.region || '', nowIso);
      }
      logAudit('account_request_decided', `${decision === 'approved' ? 'اعتماد' : 'رفض'} حساب (${existing.role_key}): ${existing.full_name}`);
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, decision, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/delete') {
      const body = await readJsonBody(req);
      const deletedByRole = String(body.deletedByRole || '').trim();
      if (deletedByRole !== 'owner') {
        return sendJson(res, 403, { error: 'صلاحية حذف الحسابات مقتصرة على صاحب العمل فقط' });
      }
      const id = String(body.id || '').trim();
      const roleKey = String(body.roleKey || '').trim();
      if (!id && !roleKey) {
        return sendJson(res, 400, { error: 'يرجى تحديد معرف الطلب أو الدور المطلوب حذفه' });
      }
      if (roleKey === 'owner' && !id) {
        return sendJson(res, 400, { error: 'لا يمكن حذف حساب صاحب العمل الرئيسي' });
      }
      let targetDesc = roleKey;
      if (id) {
        const existing = managerHubDb.prepare('SELECT * FROM account_requests WHERE id = ?').get(id);
        if (!existing) return sendJson(res, 404, { error: 'الحساب أو الطلب غير موجود' });
        targetDesc = `${existing.role_key}: ${existing.full_name}`;
        managerHubDb.prepare('DELETE FROM account_requests WHERE id = ?').run(id);
        if (body.resetRoleProfile !== false && existing.role_key && existing.role_key !== 'owner') {
          const remainingApproved = managerHubDb.prepare("SELECT * FROM account_requests WHERE role_key = ? AND status = 'approved' ORDER BY updated_at DESC LIMIT 1").get(existing.role_key);
          if (!remainingApproved) {
            managerHubDb.prepare('DELETE FROM role_profiles WHERE role_key = ?').run(existing.role_key);
          }
        }
      } else if (roleKey && roleKey !== 'owner') {
        managerHubDb.prepare('DELETE FROM role_profiles WHERE role_key = ?').run(roleKey);
        if (body.deleteRequestsForRole) {
          managerHubDb.prepare('DELETE FROM account_requests WHERE role_key = ?').run(roleKey);
        }
      }
      logAudit('account_deleted', `حذف صاحب العمل حساب (${targetDesc})`);
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'GET' && pathname === '/api/accounts/invitations') {
      const invitations = managerHubDb.prepare('SELECT * FROM invitation_cards ORDER BY created_at DESC LIMIT 200').all();
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      return sendJson(res, 200, { ok: true, invitations, globalRules: ruleRow ? ruleRow.value : '' });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/invitations') {
      const body = await readJsonBody(req);
      const inviterRole = String(body.inviterRole || 'owner').trim();
      const targetRole = String(body.targetRole || '').trim();
      const inviteeName = String(body.inviteeName || '').trim().slice(0, 120);
      const inviteePhone = String(body.inviteePhone || '').trim().slice(0, 40);
      const region = String(body.region || '').trim().slice(0, 80);
      if (!inviteeName || !targetRole) {
        return sendJson(res, 400, { error: 'يرجى إدخال اسم المدعو والدور المستهدف' });
      }
      const allowedTargets = {
        owner: ['agents_manager', 'agent', 'distributor', 'rep', 'technician'],
        agents_manager: ['agent', 'distributor'],
        agent: ['distributor'],
        distributor: ['rep', 'technician']
      };
      if (!(allowedTargets[inviterRole] || []).includes(targetRole)) {
        return sendJson(res, 403, { error: 'التسلسل الهرمي: لا يمكن لهذا الدور توجيه بطاقة دعوة للدور المحدد' });
      }
      const inviterProf = managerHubDb.prepare('SELECT full_name FROM role_profiles WHERE role_key = ?').get(inviterRole);
      const inviterName = String(body.inviterName || (inviterProf && inviterProf.full_name) || inviterRole).trim().slice(0, 120);
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      const rulesSnapshot = ruleRow ? ruleRow.value : '';
      const id = 'INV_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex').toUpperCase();
      const inviteCode = `QLX-${targetRole.slice(0, 3).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const nowIso = new Date().toISOString();
      managerHubDb.prepare(`
        INSERT INTO invitation_cards(id, inviter_role, inviter_name, target_role, invitee_name, invitee_phone, region, invite_code, rules_snapshot, status, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?)
      `).run(id, inviterRole, inviterName, targetRole, inviteeName, inviteePhone, region, inviteCode, rulesSnapshot, nowIso);
      logAudit('invitation_issued', `إصدار بطاقة دعوة من (${inviterRole}) إلى (${targetRole}): ${inviteeName} [${inviteCode}]`);
      const invitations = managerHubDb.prepare('SELECT * FROM invitation_cards ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, id, inviteCode, invitations, globalRules: rulesSnapshot });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/invitations/accept') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const inv = managerHubDb.prepare('SELECT * FROM invitation_cards WHERE id = ?').get(id);
      if (!inv) return sendJson(res, 404, { error: 'بطاقة الدعوة غير موجودة' });
      const nowIso = new Date().toISOString();
      managerHubDb.prepare("UPDATE invitation_cards SET status = 'accepted' WHERE id = ?").run(id);
      const reqId = 'ACC_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex').toUpperCase();
      managerHubDb.prepare(`
        INSERT INTO account_requests(id, role_key, full_name, phone, region, parent_role, requested_by_role, status, approved_by_role, notes, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?)
      `).run(reqId, inv.target_role, inv.invitee_name, inv.invitee_phone || '', inv.region || '', inv.inviter_role, inv.inviter_role, inv.inviter_role, `قبول بطاقة دعوة ${inv.invite_code}`, nowIso, nowIso);
      const def = USER_ROLE_DEFINITIONS.find(d => d.key === inv.target_role);
      managerHubDb.prepare(`
        INSERT INTO role_profiles(role_key, full_name, phone, title, region, updated_at)
        VALUES(?, ?, ?, ?, ?, ?)
        ON CONFLICT(role_key) DO UPDATE SET
          full_name = excluded.full_name,
          phone = excluded.phone,
          region = excluded.region,
          updated_at = excluded.updated_at
      `).run(inv.target_role, inv.invitee_name, inv.invitee_phone || '', def ? def.nameAr : inv.target_role, inv.region || '', nowIso);
      logAudit('invitation_accepted', `تفعيل بطاقة دعوة (${inv.invite_code}) للدور (${inv.target_role}): ${inv.invitee_name}`);
      const invitations = managerHubDb.prepare('SELECT * FROM invitation_cards ORDER BY created_at DESC LIMIT 200').all();
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, invitations, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/invitations/delete') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const deletedByRole = String(body.deletedByRole || '').trim();
      if (deletedByRole !== 'owner') {
        return sendJson(res, 403, { error: 'صلاحية حذف بطاقات الدعوة مقتصرة على صاحب العمل فقط' });
      }
      if (id) managerHubDb.prepare('DELETE FROM invitation_cards WHERE id = ?').run(id);
      const invitations = managerHubDb.prepare('SELECT * FROM invitation_cards ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, invitations });
    }

    if (req.method === 'GET' && pathname === '/api/owner/catalog-policy') {
      const items = managerHubDb.prepare('SELECT * FROM owner_catalog_items ORDER BY updated_at DESC').all();
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      return sendJson(res, 200, { ok: true, items, globalRules: ruleRow ? ruleRow.value : '' });
    }

    if (req.method === 'POST' && pathname === '/api/owner/catalog-policy') {
      const body = await readJsonBody(req);
      if (body.updatedByRole && body.updatedByRole !== 'owner') {
        return sendJson(res, 403, { error: 'صلاحية تعديل الكتالوج والأسعار والقواعد مقتصرة على صاحب العمل فقط' });
      }
      const nowIso = new Date().toISOString();
      if (body.globalRules !== undefined) {
        managerHubDb.prepare("INSERT INTO manager_settings(key, value) VALUES('owner_global_rules', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
          .run(String(body.globalRules || '').trim().slice(0, 2000));
      }
      if (body.nameAr) {
        const id = String(body.id || ('OWN_SYS_' + Date.now())).trim().slice(0, 60);
        managerHubDb.prepare(`
          INSERT INTO owner_catalog_items(id, name_ar, version, basic_price, pro_price, ent_price, agent_commission_pct, dist_commission_pct, marketing_pitch, presentation_url, updated_at)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_ar = excluded.name_ar,
            version = excluded.version,
            basic_price = excluded.basic_price,
            pro_price = excluded.pro_price,
            ent_price = excluded.ent_price,
            agent_commission_pct = excluded.agent_commission_pct,
            dist_commission_pct = excluded.dist_commission_pct,
            marketing_pitch = excluded.marketing_pitch,
            presentation_url = excluded.presentation_url,
            updated_at = excluded.updated_at
        `).run(
          id,
          String(body.nameAr || '').trim().slice(0, 140),
          String(body.version || 'v1.0').trim().slice(0, 40),
          Math.max(0, Number(body.basicPrice) || 4500),
          Math.max(0, Number(body.proPrice) || 8500),
          Math.max(0, Number(body.entPrice) || 18500),
          Math.min(100, Math.max(0, Number(body.agentCommissionPct) || 15)),
          Math.min(100, Math.max(0, Number(body.distCommissionPct) || 27)),
          String(body.marketingPitch || '').trim().slice(0, 600),
          String(body.presentationUrl || '').trim().slice(0, 300),
          nowIso
        );
      }
      logAudit('owner_catalog_updated', 'تحديث كتالوج المنظومات والأسعار والعمولات والقواعد العامة من صاحب العمل');
      const items = managerHubDb.prepare('SELECT * FROM owner_catalog_items ORDER BY updated_at DESC').all();
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      return sendJson(res, 200, { ok: true, items, globalRules: ruleRow ? ruleRow.value : '' });
    }

    if (req.method === 'POST' && pathname === '/api/owner/catalog-policy/remove') {
      const body = await readJsonBody(req);
      if (body.updatedByRole && body.updatedByRole !== 'owner') {
        return sendJson(res, 403, { error: 'صلاحية حذف منظومات الكتالوج مقتصرة على صاحب العمل فقط' });
      }
      const id = String(body.id || '').trim();
      if (id) managerHubDb.prepare('DELETE FROM owner_catalog_items WHERE id = ?').run(id);
      const items = managerHubDb.prepare('SELECT * FROM owner_catalog_items ORDER BY updated_at DESC').all();
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      return sendJson(res, 200, { ok: true, items, globalRules: ruleRow ? ruleRow.value : '' });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/whatsapp-packet/export') {
      const body = await readJsonBody(req);
      const exportedByRole = String(body.exportedByRole || 'owner').trim();
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      const profiles = managerHubDb.prepare('SELECT role_key, full_name, phone, title, region, email, bio, updated_at FROM role_profiles').all();
      const ownerCatalogItems = managerHubDb.prepare('SELECT * FROM owner_catalog_items ORDER BY updated_at DESC').all();
      const invitationCards = managerHubDb.prepare('SELECT * FROM invitation_cards ORDER BY created_at DESC LIMIT 200').all();
      const ruleRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'owner_global_rules'").get();
      const corePayload = {
        format: 'QALIX_OFFLINE_WHATSAPP_SYNC_V1',
        exportedAt: new Date().toISOString(),
        exportedByRole,
        systemId: ACTIVE_SYSTEM.id,
        systemNameAr: ACTIVE_SYSTEM.nameAr,
        accountRequests: requests,
        roleProfiles: profiles,
        ownerCatalogItems,
        invitationCards,
        ownerGlobalRules: ruleRow ? ruleRow.value : ''
      };
      const sha256 = crypto.createHash('sha256').update(JSON.stringify(corePayload)).digest('hex');
      const packet = { ...corePayload, sha256 };
      const filename = `wa-sync-${exportedByRole}-${new Date().toISOString().slice(0, 10)}.qlxsync`;
      return sendJson(res, 200, { ok: true, filename, packetJson: JSON.stringify(packet, null, 2), sha256, count: requests.length });
    }

    if (req.method === 'POST' && pathname === '/api/accounts/whatsapp-packet/import') {
      const body = await readJsonBody(req);
      let packet = body.packet;
      if (typeof packet === 'string') {
        try { packet = JSON.parse(packet); } catch (_) { return sendJson(res, 400, { error: 'ملف التحديث غير صالح (JSON تالف)' }); }
      }
      if (!packet || packet.format !== 'QALIX_OFFLINE_WHATSAPP_SYNC_V1' || !packet.sha256) {
        return sendJson(res, 400, { error: 'صيغة ملف تحديث الواتساب غير معتمدة' });
      }
      const { sha256, ...corePayload } = packet;
      const expected = crypto.createHash('sha256').update(JSON.stringify(corePayload)).digest('hex');
      if (sha256 !== expected) {
        return sendJson(res, 400, { error: 'تم رفض الملف: البصمة الرقمية غير مطابقة (يوجد تعديل أو تلف في الملف)!' });
      }
      let importedRequests = 0;
      const upsertReq = managerHubDb.prepare(`
        INSERT INTO account_requests(id, role_key, full_name, phone, region, parent_role, requested_by_role, status, approved_by_role, notes, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = CASE WHEN excluded.updated_at > account_requests.updated_at THEN excluded.status ELSE account_requests.status END,
          approved_by_role = CASE WHEN excluded.updated_at > account_requests.updated_at THEN excluded.approved_by_role ELSE account_requests.approved_by_role END,
          updated_at = CASE WHEN excluded.updated_at > account_requests.updated_at THEN excluded.updated_at ELSE account_requests.updated_at END
      `);
      for (const r of (Array.isArray(packet.accountRequests) ? packet.accountRequests : [])) {
        if (!r || !r.id || !r.role_key || !r.full_name) continue;
        upsertReq.run(r.id, r.role_key, r.full_name, r.phone || '', r.region || '', r.parent_role || '', r.requested_by_role || '', r.status || 'pending', r.approved_by_role || '', r.notes || '', r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString());
        importedRequests++;
      }
      let importedProfiles = 0;
      const upsertProf = managerHubDb.prepare(`
        INSERT INTO role_profiles(role_key, full_name, phone, title, region, email, bio, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(role_key) DO UPDATE SET
          full_name = CASE WHEN excluded.updated_at > role_profiles.updated_at THEN excluded.full_name ELSE role_profiles.full_name END,
          phone = CASE WHEN excluded.updated_at > role_profiles.updated_at THEN excluded.phone ELSE role_profiles.phone END,
          title = CASE WHEN excluded.updated_at > role_profiles.updated_at THEN excluded.title ELSE role_profiles.title END,
          region = CASE WHEN excluded.updated_at > role_profiles.updated_at THEN excluded.region ELSE role_profiles.region END,
          updated_at = CASE WHEN excluded.updated_at > role_profiles.updated_at THEN excluded.updated_at ELSE role_profiles.updated_at END
      `);
      for (const p of (Array.isArray(packet.roleProfiles) ? packet.roleProfiles : [])) {
        if (!p || !p.role_key) continue;
        upsertProf.run(p.role_key, p.full_name || '', p.phone || '', p.title || '', p.region || '', p.email || '', p.bio || '', p.updated_at || new Date().toISOString());
        importedProfiles++;
      }
      if (typeof packet.ownerGlobalRules === 'string' && packet.ownerGlobalRules) {
        managerHubDb.prepare("INSERT INTO manager_settings(key, value) VALUES('owner_global_rules', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
          .run(packet.ownerGlobalRules.slice(0, 2000));
      }
      if (Array.isArray(packet.ownerCatalogItems)) {
        const upsertOwnerItem = managerHubDb.prepare(`
          INSERT INTO owner_catalog_items(id, name_ar, version, basic_price, pro_price, ent_price, agent_commission_pct, dist_commission_pct, marketing_pitch, presentation_url, updated_at)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name_ar = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.name_ar ELSE owner_catalog_items.name_ar END,
            version = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.version ELSE owner_catalog_items.version END,
            basic_price = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.basic_price ELSE owner_catalog_items.basic_price END,
            pro_price = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.pro_price ELSE owner_catalog_items.pro_price END,
            ent_price = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.ent_price ELSE owner_catalog_items.ent_price END,
            agent_commission_pct = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.agent_commission_pct ELSE owner_catalog_items.agent_commission_pct END,
            dist_commission_pct = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.dist_commission_pct ELSE owner_catalog_items.dist_commission_pct END,
            marketing_pitch = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.marketing_pitch ELSE owner_catalog_items.marketing_pitch END,
            presentation_url = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.presentation_url ELSE owner_catalog_items.presentation_url END,
            updated_at = CASE WHEN excluded.updated_at > owner_catalog_items.updated_at THEN excluded.updated_at ELSE owner_catalog_items.updated_at END
        `);
        for (const it of packet.ownerCatalogItems) {
          if (!it || !it.id || !it.name_ar) continue;
          upsertOwnerItem.run(it.id, it.name_ar, it.version || 'v1.0', Number(it.basic_price) || 4500, Number(it.pro_price) || 8500, Number(it.ent_price) || 18500, Number(it.agent_commission_pct) || 15, Number(it.dist_commission_pct) || 27, it.marketing_pitch || '', it.presentation_url || '', it.updated_at || new Date().toISOString());
        }
      }
      if (Array.isArray(packet.invitationCards)) {
        const upsertInv = managerHubDb.prepare(`
          INSERT INTO invitation_cards(id, inviter_role, inviter_name, target_role, invitee_name, invitee_phone, region, invite_code, rules_snapshot, status, created_at)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = CASE WHEN excluded.status = 'accepted' THEN 'accepted' ELSE invitation_cards.status END
        `);
        for (const inv of packet.invitationCards) {
          if (!inv || !inv.id || !inv.invite_code) continue;
          upsertInv.run(inv.id, inv.inviter_role || 'owner', inv.inviter_name || '', inv.target_role || 'agent', inv.invitee_name || '', inv.invitee_phone || '', inv.region || '', inv.invite_code, inv.rules_snapshot || '', inv.status || 'issued', inv.created_at || new Date().toISOString());
        }
      }
      logAudit('whatsapp_sync_imported', `استيراد ملف تحديث واتساب موقّع (${packet.exportedByRole || '-'}): ${importedRequests} طلب، ${importedProfiles} حساب`);
      const requests = managerHubDb.prepare('SELECT * FROM account_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, { ok: true, importedRequests, importedProfiles, requests, ...getRoleProfilesState() });
    }

    if (req.method === 'POST' && pathname === '/api/manager/assign-agent') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتعيين أو تعديل وكيل المنظومة', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      const systemId = String(body.systemId || ACTIVE_SYSTEM.id).trim();
      try {
        const updatedSys = updateSystemAgentProfile(BASE_DATA_DIR, systemId, {
          agentName: body.agentName,
          titleAr: body.agentTitleAr || (body.agentName ? `وكيل ${body.agentName}` : undefined),
          phone: body.agentPhone
        });
        if (systemId === ACTIVE_SYSTEM.id) {
          activateRuntimeSystem(systemId);
        } else {
          systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
        }
        logAudit('assign_system_agent', `تعيين/تحديث الوكيل للمنظومة ${updatedSys.nameAr} (${systemId}): ${updatedSys.agentInfo?.agentName || ''} (${updatedSys.agentInfo?.phone || ''})`);
        return sendJson(res, 200, { ok: true, system: updatedSys, summary: getSummaryResponse() });
      } catch (err) {
        return sendJson(res, 404, { error: err.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/manager/key-requests') {
      const sysFilter = String(url.searchParams.get('systemId') || '').trim();
      const rows = sysFilter
        ? managerHubDb.prepare('SELECT * FROM agent_key_requests WHERE system_id = ? ORDER BY created_at DESC LIMIT 200').all(sysFilter)
        : managerHubDb.prepare('SELECT * FROM agent_key_requests ORDER BY created_at DESC LIMIT 200').all();
      return sendJson(res, 200, {
        ok: true,
        requests: rows,
        agentsManagerContact: getAgentVisibleManagerContact()
      });
    }

    if (req.method === 'POST' && pathname === '/api/manager/key-requests') {
      const body = await readJsonBody(req);
      const customerName = String(body.customerName || '').trim().slice(0, 140);
      const hardwareId = String(body.hardwareId || '').trim().toUpperCase().slice(0, 120);
      if (!customerName) return sendJson(res, 400, { error: 'اسم العميل / المنشأة مطلوب لطلب مفتاح التفعيل من مدير الوكلاء' });

      const targetSysId = String(body.systemId || ACTIVE_SYSTEM.id).trim();
      const targetSys = systemsRegistry.systems.find(s => s.id === targetSysId) || ACTIVE_SYSTEM;
      const tier = String(body.tier || 'professional').trim();
      const amountPaid = body.amountPaid !== undefined ? (Number(body.amountPaid) || 0) : Number(targetSys.pricing?.[tier]?.price || 0);
      const keyValCheck = validateKeyRequestInput({ targetSys, tier, hardwareId, amountPaid });
      if (!keyValCheck.ok) {
        return sendJson(res, 400, { error: keyValCheck.error });
      }
      const distributorCode = String(body.distributorCode || '').trim().toUpperCase().slice(0, 32);
      const distributorName = String(body.distributorName || '').trim().slice(0, 120);
      const paymentRef = String(body.paymentRef || '').trim().slice(0, 80);
      const notes = String(body.notes || '').trim().slice(0, 400);

      const cnt = managerHubDb.prepare('SELECT COUNT(*) AS c FROM agent_key_requests').get().c;
      const id = 'kr_' + crypto.randomBytes(6).toString('hex');
      const reqCode = `KEYREQ-${String(cnt + 1).padStart(4, '0')}`;
      const now = new Date().toISOString();
      const agentName = String(body.agentName || targetSys.agentInfo?.agentName || targetSys.agentInfo?.titleAr || '').trim();
      const agentPhone = String(body.agentPhone || targetSys.agentInfo?.phone || '').trim();

      // ملاحظة صارمة: لا يُنشأ أو يُولَّد أي مفتاح داخل المنظومة؛ يظل فارغاً حتى يحضره مدير الوكلاء يدوياً من صاحب المنصة.
      managerHubDb.prepare(`
        INSERT INTO agent_key_requests(
          id, req_code, system_id, system_name_ar, agent_name, agent_phone,
          distributor_code, distributor_name, customer_name, hardware_id, tier,
          amount_paid, payment_ref, notes, status, manual_license_key, delivered_by, created_at, delivered_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_owner_fetch', '', '', ?, '')
      `).run(
        id, reqCode, targetSys.id, targetSys.nameAr, agentName, agentPhone,
        distributorCode, distributorName, customerName, hardwareId, tier,
        amountPaid, paymentRef, notes, now
      );

      logAudit('key_request_to_manager', `طلب الوكيل (${agentName}) مفتاح ترخيص [${reqCode}] للمنظومة ${targetSys.nameAr} — العميل "${customerName}" بانتظار إحضاره يدوياً من مدير الوكلاء`);
      const mgr = getAgentVisibleManagerContact();
      const waToAgentsManager = [
        `📩 *طلب مفتاح تفعيل موجه إلى مدير الوكلاء (${mgr.managerName})*`,
        `• رقم الطلب: ${reqCode}`,
        `• المنظومة: ${targetSys.nameAr} (${targetSys.id})`,
        `• الوكيل الطالب: ${agentName}${agentPhone ? ' (' + agentPhone + ')' : ''}`,
        `• العميل / المنشأة: ${customerName}`,
        hardwareId ? `• بصمة الجهاز (HWID): ${hardwareId}` : null,
        `• الباقة: ${tier} | المبلغ المسدد: ${amountPaid} ج.م`,
        paymentRef ? `• مرجع الدفع: ${paymentRef}` : null,
        `يرجى إحضار المفتاح يدوياً من منصة كالكس وإرساله لإتمام التسليم للوكيل.`
      ].filter(Boolean).join('\n');

      const created = managerHubDb.prepare('SELECT * FROM agent_key_requests WHERE id = ?').get(id);
      return sendJson(res, 201, { ok: true, request: created, validation: keyValCheck, waToAgentsManager, agentsManagerContact: mgr });
    }

    if (req.method === 'POST' && /^\/api\/manager\/key-requests\/[^/]+\/deliver$/.test(pathname)) {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتسليم المفاتيح يدوياً', managerPinRequired: true });
      }
      const id = pathname.split('/')[4];
      const body = await readJsonBody(req);
      const manualKey = String(body.manualLicenseKey || body.activationKey || '').trim();
      if (!manualKey || manualKey.length < 6) {
        return sendJson(res, 400, {
          error: 'هذه المنظومة لا تنشئ مفاتيح آلياً — يجب على مدير الوكلاء إحضار المفتاح يدوياً من صاحب المنصة ولصقه هنا كاملاً.'
        });
      }
      const existing = managerHubDb.prepare('SELECT * FROM agent_key_requests WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'طلب المفتاح غير موجود' });

      const mgr = getManagerHubProfile();
      const deliveredBy = String(body.deliveredBy || mgr.managerName || 'مدير الوكلاء').trim();
      const now = new Date().toISOString();
      managerHubDb.prepare(`
        UPDATE agent_key_requests SET
          status = 'delivered_by_manager',
          manual_license_key = ?,
          delivered_by = ?,
          delivered_at = ?
        WHERE id = ?
      `).run(manualKey, deliveredBy, now, id);

      // ربط المفتاح اليدوي المُسلَّم بالسلسلة الموحدة في قاعدة بيانات المنظومة المستهدفة (إن وُجدت)
      try {
        const sysPaths = getSystemPaths(BASE_DATA_DIR, BASE_KITS_DIR, existing.system_id);
        if (existing.system_id === ACTIVE_SYSTEM.id || fs.existsSync(sysPaths.dbPath)) {
          const targetDb = existing.system_id === ACTIVE_SYSTEM.id ? db : new DatabaseSync(sysPaths.dbPath);
          try {
            const distRow = existing.distributor_code
              ? targetDb.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(existing.distributor_code)
              : targetDb.prepare('SELECT * FROM distributors LIMIT 1').get();
            if (distRow) {
              upsertUnifiedCase(targetDb, {
                distributorId: distRow.id,
                customerName: existing.customer_name,
                activationKey: manualKey,
                stage: 'tech_deploying',
                outcome: `أحضر مدير الوكلاء المفتاح يدوياً وأرسله للوكيل [${existing.req_code}] — جاهز لتفعيل الفني`,
                timelineEvent: {
                  actorRole: 'agent',
                  actorName: deliveredBy,
                  stage: 'tech_deploying',
                  actionText: `تسليم مفتاح التفعيل اليدوي (${existing.req_code}) عبر مدير الوكلاء`
                }
              });
            }
          } finally {
            if (existing.system_id !== ACTIVE_SYSTEM.id) {
              try { targetDb.close(); } catch (_) {}
            }
          }
        }
      } catch (_) {}

      logAudit('manager_delivered_manual_key', `تسليم المفتاح اليدوي لطلب ${existing.req_code} (المنظومة: ${existing.system_id}) عبر مدير الوكلاء للوكيل ${existing.agent_name}`);
      const updated = managerHubDb.prepare('SELECT * FROM agent_key_requests WHERE id = ?').get(id);
      const waToAgent = [
        `🔑 *تسليم مفتاح تفعيل من مدير الوكلاء (${deliveredBy})*`,
        `• طلب رقم: ${updated.req_code}`,
        `• المنظومة: ${updated.system_name_ar}`,
        `• العميل: ${updated.customer_name}`,
        `• المفتاح المُحضر يدوياً:`,
        updated.manual_license_key
      ].join('\n');
      return sendJson(res, 200, { ok: true, request: updated, waToAgent });
    }

    /* ---------------- SLA Watchdog, Sync Packets (.qlxsync) & Executive Funnel Report ---------------- */
    if (req.method === 'GET' && pathname === '/api/manager/sla-alerts') {
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      const slaDaysParam = url.searchParams.get('slaDays');
      const sysFilter = String(url.searchParams.get('systemId') || '').trim();
      const cfgRow = managerHubDb.prepare("SELECT value FROM manager_settings WHERE key = 'sla_max_days'").get();
      const slaDays = slaDaysParam !== null ? Number(slaDaysParam) : Number(cfgRow?.value || 5);
      const summary = collectSlaAlerts({
        systemsRegistry,
        baseDataDir: BASE_DATA_DIR,
        baseKitsDir: BASE_KITS_DIR,
        activeSystemId: ACTIVE_SYSTEM.id,
        activeDb: db,
        slaMaxDays: slaDays,
        systemIdFilter: sysFilter
      });
      return sendJson(res, 200, { ok: true, ...summary });
    }

    if (req.method === 'POST' && pathname === '/api/manager/sla-config') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتعديل حد المتابعة SLA', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      const days = Math.max(1, Math.min(90, Number(body.slaMaxDays) || 5));
      managerHubDb.prepare("INSERT INTO manager_settings(key, value) VALUES('sla_max_days', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String(days));
      return sendJson(res, 200, { ok: true, slaMaxDays: days });
    }

    if (req.method === 'GET' && pathname === '/api/sync/export') {
      const pkt = buildAgentSyncPacket(db, ACTIVE_SYSTEM, managerHubDb, { upsertUnifiedCase });
      if (url.searchParams.get('download') === '1') {
        const fname = `Qalix-Sync-${ACTIVE_SYSTEM.id}-${new Date().toISOString().slice(0, 10)}.qlxsync`;
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fname}"`
        });
        return res.end(JSON.stringify(pkt, null, 2));
      }
      return sendJson(res, 200, { ok: true, packet: pkt });
    }

    if (req.method === 'POST' && pathname === '/api/sync/import') {
      const body = await readJsonBody(req);
      const packet = body && body.packet && typeof body.packet === 'object' ? body.packet : body;
      const impRes = importSyncPacket({
        db,
        activeSystem: ACTIVE_SYSTEM,
        managerHubDb,
        packet,
        upsertUnifiedCase
      });
      if (!impRes.ok) {
        return sendJson(res, impRes.status || 400, { error: impRes.error });
      }
      logAudit('sync_packet_imported', `استيراد حزمة مزامنة أوفلاين موثقة (${impRes.packetType}) — بصمة: ${impRes.integritySha256.slice(0, 12)}...`);
      return sendJson(res, 200, impRes);
    }

    if (req.method === 'GET' && pathname === '/api/sync/snapshots') {
      const rows = managerHubDb.prepare('SELECT id, system_id, packet_type, packet_sha256, source_label, cases_count, deals_count, gross_sales, imported_at FROM synced_agent_snapshots ORDER BY imported_at DESC LIMIT 100').all();
      return sendJson(res, 200, { ok: true, snapshots: rows });
    }

    /* ---------------- Agents Manager (مدير الوكلاء) Consolidated Cross-System Oversight & Funnel ---------------- */
    if (req.method === 'GET' && pathname === '/api/owner/agents-activity') {
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      const fromDate = String(url.searchParams.get('from') || '').trim();
      const toDate = String(url.searchParams.get('to') || '').trim();
      const systemIdFilter = String(url.searchParams.get('systemId') || '').trim();
      const slaParam = url.searchParams.get('slaDays');
      const analytics = buildManagerExecutiveAnalytics({
        systemsRegistry,
        baseDataDir: BASE_DATA_DIR,
        baseKitsDir: BASE_KITS_DIR,
        activeSystemId: ACTIVE_SYSTEM.id,
        activeDb: db,
        managerHubDb,
        fromDate,
        toDate,
        systemIdFilter,
        slaMaxDays: slaParam !== null ? Number(slaParam) : undefined
      });
      const auth = getManagerAuthStatus(managerHubDb, req);
      const mgrProfile = getManagerHubProfile();
      const ownerName = auth.locked ? mgrProfile.managerName : mgrProfile.ownerName;
      const generatedAt = new Date().toISOString();
      const grandTotals = analytics.grandTotals;
      const agentsActivity = analytics.agentsActivity;
      const reportPayload = { ownerName, generatedAt, grandTotals, agentsActivity };
      const reportSha256 = crypto.createHash('sha256').update(JSON.stringify(reportPayload)).digest('hex');

      const waBrief = [
        `🏛️ *تقرير نشاط عمل الوكلاء والفرق الميدانية لـ (${ownerName})*`,
        `• تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}`,
        `• عدد المنظومات / الوكلاء النشطة: ${grandTotals.systemsCount}`,
        `• إجمالي الموزعين: ${grandTotals.distributorsCount} | المناديب: ${grandTotals.repsCount} | الفنيون: ${grandTotals.techsCount}`,
        `• الحالات الميدانية الموحدة: ${grandTotals.unifiedCasesCount} (مناديب: ${grandTotals.repActionsCount} · فنيون: ${grandTotals.techActionsCount})`,
        `• معدل التحويل العام: ${analytics.funnel.overallConversionPct}% | تنبيهات SLA: ${analytics.slaSummary.alertsCount}`,
        `• النسخ التجريبية المسجلة: ${grandTotals.trialsCount} | طلبات دفع بالانتظار: ${grandTotals.pendingPaymentsCount}`,
        `• الصفقات المكتملة: ${grandTotals.completedDealsCount} | المبيعات: ${grandTotals.grossSales} ج.م | صافي الوكلاء: ${grandTotals.agentNetRevenue} ج.م`,
        `• بصمة التوثيق SHA-256: ${reportSha256.slice(0, 16)}...`
      ].join('\n');

      return sendJson(res, 200, {
        ok: true,
        ...reportPayload,
        funnel: analytics.funnel,
        slaSummary: analytics.slaSummary,
        syncedSnapshotsCount: analytics.syncedSnapshotsCount,
        filters: analytics.filters,
        auth,
        reportSha256,
        waBrief
      });
    }

    if (req.method === 'GET' && pathname === '/api/manager/executive-report') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لعرض التقرير التنفيذي المجمع', managerPinRequired: true });
      }
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      const analytics = buildManagerExecutiveAnalytics({
        systemsRegistry,
        baseDataDir: BASE_DATA_DIR,
        baseKitsDir: BASE_KITS_DIR,
        activeSystemId: ACTIVE_SYSTEM.id,
        activeDb: db,
        managerHubDb,
        fromDate: String(url.searchParams.get('from') || '').trim(),
        toDate: String(url.searchParams.get('to') || '').trim(),
        systemIdFilter: String(url.searchParams.get('systemId') || '').trim()
      });
      const html = generateManagerExecutiveReportHtml(analytics, getManagerHubProfile());
      return sendHtmlWithOptionalDownload(res, html, 'Qalix-Manager-Executive-Report.html', url.searchParams.get('download') === '1');
    }

    /* ---------------- Multi-System Isolation & Clean Reseller Edition API ---------------- */
    if (req.method === 'GET' && pathname === '/api/systems') {
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      const universalClean = isUniversalCleanMode();
      return sendJson(res, 200, {
        ok: true,
        isUniversalClean: universalClean,
        activeSystemId: ACTIVE_SYSTEM.id,
        qalixSuiteIds: universalClean ? [] : QALIX_11_SUITE_IDS,
        presets: universalClean ? [SYSTEM_PRESETS.universal_agent] : Object.values(SYSTEM_PRESETS),
        systems: systemsRegistry.systems.map(s => summarizeSystemStats(BASE_DATA_DIR, BASE_KITS_DIR, s))
      });
    }

    if (req.method === 'POST' && pathname === '/api/systems') {
      const body = await readJsonBody(req);
      const activeAppLic = getAppLicenseState();
      systemsRegistry = loadSystemsRegistry(BASE_DATA_DIR, BASE_KITS_DIR);
      if (!activeAppLic.isTrial && activeAppLic.maxSystems < 9999 && systemsRegistry.systems.length >= activeAppLic.maxSystems) {
        return sendJson(res, 403, {
          error: `باقة "${activeAppLic.displayNameAr}" تتيح حتى ${activeAppLic.maxSystems} منظومة معزولة كحد أقصى. يرجى الترقية إلى باقة أعلى لإضافة منظومات أخرى.`,
          licenseUpgradeRequired: true
        });
      }
      try {
        const created = createIsolatedSystem(BASE_DATA_DIR, BASE_KITS_DIR, body);
        systemsRegistry = created.registry;
        if (body.activateNow !== false) {
          activateRuntimeSystem(created.system.id);
        }
        return sendJson(res, 201, {
          ok: true,
          system: created.system,
          activeSystemId: ACTIVE_SYSTEM.id,
          systems: systemsRegistry.systems.map(s => summarizeSystemStats(BASE_DATA_DIR, BASE_KITS_DIR, s)),
          summary: getSummaryResponse()
        });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/systems/select') {
      const body = await readJsonBody(req);
      const sysId = String(body.systemId || '').trim();
      if (!sysId) return sendJson(res, 400, { error: 'يرجى تحديد معرف المنظومة' });
      try {
        const selected = selectActiveSystemInRegistry(BASE_DATA_DIR, BASE_KITS_DIR, sysId);
        systemsRegistry = selected.registry;
        activateRuntimeSystem(sysId);
        return sendJson(res, 200, {
          ok: true,
          activeSystemId: ACTIVE_SYSTEM.id,
          activeSystem: ACTIVE_SYSTEM,
          systems: systemsRegistry.systems.map(s => summarizeSystemStats(BASE_DATA_DIR, BASE_KITS_DIR, s)),
          summary: getSummaryResponse()
        });
      } catch (err) {
        return sendJson(res, 404, { error: err.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/systems/build-reseller-edition') {
      const activeAppLic = getAppLicenseState();
      if (!activeAppLic.isTrial && !activeAppLic.ownerOversight) {
        return sendJson(res, 403, {
          error: `باقة "${activeAppLic.displayNameAr}" لا تشمل تصدير نسخ الوكلاء المستقلة. يرجى الترقية إلى الباقة المتقدمة أو المؤسسية.`,
          licenseUpgradeRequired: true
        });
      }
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتصدير النسخ', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      try {
        const exportsBase = path.join(BASE_DATA_DIR, 'exports');
        const edition = buildCleanResellerEdition({
          rootDir: ROOT,
          outputBaseDir: exportsBase,
          buyerAgentPhone: body.buyerAgentPhone,
          buyerAgentTitleAr: body.buyerAgentTitleAr,
          buyerOwnerName: body.buyerOwnerName,
          defaultSystemId: body.defaultSystemId,
          includeAllQalix11: body.includeAllQalix11 === true,
          includeMediaAssets: body.includeMediaAssets === true,
          includeRuntime: body.includeRuntime === true,
          extraSystemPresets: Array.isArray(body.extraSystemPresets) ? body.extraSystemPresets : []
        });
        logAudit('reseller_edition_built', `إنشاء نسخة وكلاء متعددة المنظومات مصفرة البيانات جاهزة للبيع: ${edition.editionName}`);
        return sendJson(res, 201, {
          ok: true,
          edition,
          downloadUrl: edition.zipFilename
            ? `/api/systems/download-reseller-edition?file=${encodeURIComponent(edition.zipFilename)}`
            : null
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/systems/build-installer-kit') {
      const activeAppLic = getAppLicenseState();
      if (!activeAppLic.isTrial && !activeAppLic.ownerOversight) {
        return sendJson(res, 403, {
          error: `باقة "${activeAppLic.displayNameAr}" لا تشمل بناء حزم تثبيت ويندوز. يرجى الترقية إلى الباقة المتقدمة أو المؤسسية.`,
          licenseUpgradeRequired: true
        });
      }
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتجهيز المُثبِّت', managerPinRequired: true });
      }
      const body = await readJsonBody(req);
      try {
        const kit = buildWindowsInstallerKit({
          rootDir: ROOT,
          baseDataDir: BASE_DATA_DIR,
          edition: body.edition === 'universal' ? 'universal' : 'qalix11',
          includeMediaAssets: body.includeMediaAssets === true
        });
        logAudit('installer_kit_staged', `تجهيز حزمة ومخطط المُثبِّت المستقل للويندوز (${kit.edition}) في: ${kit.stageDir}`);
        return sendJson(res, 201, kit);
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/systems/download-reseller-edition') {
      const reqFile = path.basename(String(url.searchParams.get('file') || ''));
      if (!reqFile || !reqFile.endsWith('.zip')) {
        return sendJson(res, 400, { error: 'اسم ملف الحزمة غير صالح' });
      }
      const exportsBase = path.resolve(BASE_DATA_DIR, 'exports');
      const targetZip = path.resolve(exportsBase, reqFile);
      if (!targetZip.startsWith(exportsBase + path.sep) || !fs.existsSync(targetZip)) {
        return sendJson(res, 404, { error: 'ملف النسخة الجاهزة غير موجود' });
      }
      const stat = fs.statSync(targetZip);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${reqFile}"`
      });
      return fs.createReadStream(targetZip).pipe(res);
    }

    /* ---------------- Developer & System Administration API (Dev Console) ---------------- */
    if (req.method === 'POST' && pathname === '/api/dev/reset-deals') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لإجراء التصفير', managerPinRequired: true });
      }
      const resData = resetDealsOnly(db, DATA_DIR);
      logAudit('dev_reset_deals', 'تصفير صفقات النظام من لوحة المطور مع أخذ لقطة احتياطية');
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/factory-reset') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لإعادة ضبط المصنع', managerPinRequired: true });
      }
      const resData = resetAllDataFactory(db, () => seedInitialData(db), DATA_DIR);
      logAudit('dev_factory_reset', 'استعادة ضبط المصنع وتصفير قاعدة البيانات من لوحة المطور');
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/clear-audits') {
      if (!isManagerAuthorized(managerHubDb, req)) {
        return sendJson(res, 401, { error: 'يرجى تسجيل دخول مدير الوكلاء لتصفير السجل', managerPinRequired: true });
      }
      const resData = clearAuditLogsOnly(db, DATA_DIR);
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/custom-whatsapp') {
      const body = await readJsonBody(req);
      try {
        const result = addCustomWhatsAppTemplate(body, DATA_DIR);
        logAudit('dev_add_whatsapp', `إضافة قالب واتساب بيعي جديد: ${result.template.title}`);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (req.method === 'POST' && pathname === '/api/dev/upload-media') {
      const filename = url.searchParams.get('filename') || ('upload_' + Date.now() + '.mp4');
      const category = url.searchParams.get('category') || 'video';
      try {
        const uploadResult = await uploadMediaFileStream(req, filename, category);
        logAudit('dev_upload_media', `رفع وسائط تسويقية جديدة (${category}): ${uploadResult.filename}`);
        return sendJson(res, 200, uploadResult);
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    if (req.method === 'GET' && pathname === '/api/dev/media-list') {
      return sendJson(res, 200, { ok: true, media: listAllMedia() });
    }

    if (req.method === 'GET' && pathname === '/api/dev/status') {
      const dealsCount = db.prepare('SELECT COUNT(*) AS c FROM deals').get().c;
      const distsCount = db.prepare('SELECT COUNT(*) AS c FROM distributors').get().c;
      let auditsCount = 0;
      try { auditsCount = db.prepare('SELECT COUNT(*) AS c FROM audit_log').get().c; } catch (_) {}
      const media = listAllMedia();
      return sendJson(res, 200, {
        ok: true,
        stats: {
          officialPhone: AGENT_INFO.phone,
          dealsCount,
          distributorsCount: distsCount,
          auditLogsCount: auditsCount,
          videosCount: media.videos.length,
          imagesCount: media.images.length
        },
        uptimeSeconds: Math.round(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
      });
    }

    // Serve static files: support /presentations/, /legal-docs/, /distributors_kits/, and /public/
    let filePath = null;
    let baseDir = null;

    if (pathname.startsWith('/presentations/')) {
      const sub = pathname.slice('/presentations/'.length);
      baseDir = PRESENTATIONS_DIR;
      filePath = path.resolve(PRESENTATIONS_DIR, sub);
    } else if (pathname.startsWith('/legal-docs/')) {
      const sub = pathname.slice('/legal-docs/'.length);
      baseDir = LEGAL_DOCS_DIR;
      filePath = path.resolve(LEGAL_DOCS_DIR, sub);
    } else if (pathname.startsWith('/distributors_kits/')) {
      const sub = pathname.slice('/distributors_kits/'.length);
      baseDir = KITS_DIR;
      filePath = path.resolve(KITS_DIR, sub);
    } else if (pathname.startsWith('/public/')) {
      const sub = pathname.slice('/public/'.length);
      baseDir = PUBLIC_DIR;
      filePath = path.resolve(PUBLIC_DIR, sub);
    } else {
      let rel = pathname === '/' ? '/index.html' : pathname;
      baseDir = PUBLIC_DIR;
      filePath = path.resolve(PUBLIC_DIR, '.' + rel);
    }

    const resolvedBase = path.resolve(baseDir);
    const normFile = filePath.toLowerCase();
    const normBase = resolvedBase.toLowerCase();
    if (normFile !== normBase && !normFile.startsWith(normBase + path.sep)) {
      return sendJson(res, 403, { error: 'Forbidden' });
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.md': 'text/markdown; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8'
      };
      const mime = mimeTypes[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);
      const forceDownload = url.searchParams.get('download') === '1';
      const baseName = path.basename(filePath);
      const encodedName = encodeURIComponent(baseName);
      const asciiFallback = baseName.replace(/[^\x20-\x7E]/g, '_') || (`file${ext}`);

      // Simple Range header handling for video playback
      const range = req.headers.range;
      if (range && ext === '.mp4' && !forceDownload) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = Math.max(0, parseInt(parts[0], 10) || 0);
        const end = parts[1] ? Math.min(stat.size - 1, parseInt(parts[1], 10)) : stat.size - 1;
        if (Number.isNaN(end) || start >= stat.size || start > end) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          return res.end();
        }
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime,
          'Access-Control-Allow-Origin': '*'
        });
        return fileStream.pipe(res);
      }

      const headers = {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
      };

      res.writeHead(200, headers);
      return fs.createReadStream(filePath).pipe(res);
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (e) {
    if (!e?.statusCode || e.statusCode >= 500) console.error(e);
    const status = Number(e?.statusCode) || 500;
    return sendJson(res, status, { error: e.message || 'Server error' });
  }
});

try {
  const allDists = db.prepare('SELECT * FROM distributors').all();
  for (const d of allDists) writeDistributorKitFile(d);
} catch (e) {
  console.error('Warning syncing distributor kits on startup:', e.message);
}

const explicitPortLocked = Boolean(process.env.PORT);

server.on('error', err => {
  if (err && err.code === 'EADDRINUSE' && !explicitPortLocked && activePort < PORT + 20) {
    const nextPort = activePort + 1;
    console.warn(`Port ${activePort} is in use; switching automatically to port ${nextPort}...`);
    activePort = nextPort;
    setTimeout(() => server.listen(activePort, HOST), 150);
    return;
  }
  console.error(err);
  process.exit(1);
});

server.listen(activePort, HOST, () => {
  const bannerName = ACTIVE_SYSTEM.id === 'qalix_medical'
    ? 'Qalix Medical Agent Server v1.0 (100% Offline Air-Gapped)'
    : `${ACTIVE_SYSTEM.projectName || 'Qalix Multi-System Agent'} Server v1.0 (100% Offline Air-Gapped)`;
  console.log(`=============================================================`);
  console.log(`  [QALIX] ${bannerName}`);
  console.log(`  - Official Agent Contact: ${AGENT_INFO.phone} (${AGENT_INFO.intlPhone})`);
  console.log(`  - Agent Command URL:      http://${HOST}:${activePort}`);
  console.log(`  - Database (SQLite WAL):  ${dbPath}`);
  console.log(`=============================================================`);
  try {
    fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(BASE_DATA_DIR, '.runtime_port'), String(activePort), 'utf8');
  } catch (_) {}
  if (process.env.AUTO_OPEN_BROWSER === '1' && process.platform === 'win32') {
    const openHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
    openWindowsDesktopApp(`http://${openHost}:${activePort}`, BASE_DATA_DIR);
  }
});

function getSafeExternalBackupDir() {
  if (process.env.SAFE_BACKUP_DIR) return process.env.SAFE_BACKUP_DIR;
  const docsDir = path.join(require('node:os').homedir(), 'Documents');
  const folderName = isUniversalCleanMode() ? 'UniversalAgentsBackups' : 'QalixAgentsBackups';
  return path.join(docsDir, folderName);
}

let lastAutoBackupAt = 0;
function runAutoSessionBackup(reason = 'session_end') {
  const nowMs = Date.now();
  if (reason === 'session_end' && nowMs - lastAutoBackupAt < 3000) {
    return { skipped: true, safeBackupDir: getSafeExternalBackupDir() };
  }
  lastAutoBackupAt = nowMs;
  try {
    const snap = createDatabaseSnapshot(db, ACTIVE_PATHS.dataDir);
    const safeBase = getSafeExternalBackupDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sessionDir = path.join(safeBase, `session_${stamp}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.copyFileSync(snap.path, path.join(sessionDir, snap.filename));
    if (fs.existsSync(`${snap.path}.meta.json`)) {
      fs.copyFileSync(`${snap.path}.meta.json`, path.join(sessionDir, `${snap.filename}.meta.json`));
    }
    const sysJsonPath = path.join(BASE_DATA_DIR, 'systems.json');
    if (fs.existsSync(sysJsonPath)) {
      fs.copyFileSync(sysJsonPath, path.join(sessionDir, 'systems.json'));
    }
    try {
      managerHubDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      const hubPath = path.join(BASE_DATA_DIR, 'manager_hub.db');
      if (fs.existsSync(hubPath)) fs.copyFileSync(hubPath, path.join(sessionDir, 'manager_hub.db'));
    } catch (_) {}
    // Keep latest 15 session backup folders
    try {
      const dirs = fs.readdirSync(safeBase, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('session_'))
        .map(d => d.name)
        .sort();
      while (dirs.length > 15) {
        const oldest = dirs.shift();
        fs.rmSync(path.join(safeBase, oldest), { recursive: true, force: true });
      }
    } catch (_) {}
    return { snapshot: snap, safeBackupDir: safeBase, sessionDir };
  } catch (err) {
    return { error: err.message, safeBackupDir: getSafeExternalBackupDir() };
  }
}

function gracefulShutdown() {
  try { fs.rmSync(path.join(BASE_DATA_DIR, '.runtime_port'), { force: true }); } catch (_) {}
  try { runAutoSessionBackup('shutdown'); } catch (_) {}
  for (const conn of dbPool.values()) {
    try { conn.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}
    try { conn.close(); } catch (_) {}
  }
  dbPool.clear();
  try {
    managerHubDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    managerHubDb.close();
  } catch (_) {}
  process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

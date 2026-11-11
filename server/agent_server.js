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
const { SPECIALTY_PACKS, getAllPacks, getPackById } = require('./specialty_packs');
const { processMigration } = require('./data_migrator');
const { MARKETING_MATERIALS, renderWhatsAppCatalogA4, renderWowDemoA4, renderBattleCardA4 } = require('./marketing_kit');
const { getLocalNetworkInfo } = require('./network_diagnostics');
const { generateDistributorContractHtml, generateClinicHandoverHtml } = require('./contract_generator');
const { generateDistributorStatementHtml } = require('./financial_ledger');
const { generateQuotationData, generateQuotationHtml } = require('./quotation_engine');
const { getAllObjections, getObjectionById, renderObjectionsPlaybookA4 } = require('./objection_playbook');
const { calculateDealTimeline, RETENTION_MILESTONES } = require('./after_sales_tracker');
const { createDatabaseSnapshot, listDatabaseSnapshots, exportFullSystemJson } = require('./backup_manager');
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

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PRESENTATIONS_DIR = path.join(ROOT, 'ملفات_العروض_التقديمية');
const LEGAL_DOCS_DIR = path.join(ROOT, 'الوثائق_القانونية_والتسليم');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const KITS_DIR = process.env.DATA_DIR ? path.join(DATA_DIR, 'kits') : path.join(ROOT, 'distributors_kits');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(KITS_DIR, { recursive: true });

function sendHtmlWithOptionalDownload(res, html, downloadFilename, forceDownload) {
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };
  if (forceDownload && downloadFilename) {
    headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`;
  }
  res.writeHead(200, headers);
  return res.end(html);
}

/* ---------------- Fixed Official Pricing (EGP) ---------------- */
const OFFICIAL_PRICING = {
  basic:        { id: 'basic',        nameAr: 'الباقة الأساسية (عيادة طبيب فردي)',         price: 4500,  maxDoctors: 2,  maxUsers: 4 },
  professional: { id: 'professional', nameAr: 'الباقة التخصصية (العيادات النشطة)',         price: 8500,  maxDoctors: 5,  maxUsers: 12 },
  enterprise:   { id: 'enterprise',   nameAr: 'باقة المراكز الكبرى والفروع (Enterprise)', price: 18500, maxDoctors: 99, maxUsers: 99 }
};

const AGENT_INFO = {
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

/* ---------------- SQLite WAL Database ---------------- */
const dbPath = path.join(DATA_DIR, 'agent.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
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
`);

initializeTerritoryTables(db);

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

/* Seed initial sample distributors if empty */
const distCount = db.prepare('SELECT COUNT(*) AS n FROM distributors').get().n;
if (distCount === 0) {
  seedInitialData(db);
}

/* Seed initial Excellence & #1 Leadership Proposals if empty */
const propCount = db.prepare('SELECT COUNT(*) AS n FROM excellence_proposals').get().n;
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

// Always ensure post-launch R&D follow-up proposals exist (idempotent across existing & fresh DBs)
{
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

const { generateStandaloneDistributorPortalHtml: genPortal } = require('./portal_template');
function generateStandaloneDistributorPortalHtml(dist) {
  return genPortal(dist, AGENT_INFO);
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
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 1e6) {
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

  return {
    agent: AGENT_INFO,
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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = url.pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      pathname = url.pathname;
    }

    if (req.method === 'GET' && (pathname === '/api/bootstrap' || pathname === '/api/summary')) {
      return sendJson(res, 200, getSummaryResponse());
    }

    if (req.method === 'GET' && pathname === '/api/competitors') {
      return sendJson(res, 200, { ok: true, competitors: COMPETITORS_CATALOG, pricing: OFFICIAL_PRICING });
    }

    if (req.method === 'POST' && pathname === '/api/distributors') {
      const body = await readJsonBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const governorate = String(body.governorate || 'مصر').trim();
      const commissionRate = Math.max(5, Math.min(45, Number(body.commissionRate) || 27));
      const notes = String(body.notes || '').trim();
      if (!name || !phone) return sendJson(res, 400, { error: 'اسم الموزع ورقم الهاتف مطلوبان' });

      const existingCodes = db.prepare('SELECT code FROM distributors').all();
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
      const licenseRef = status === 'completed' ? `QLX2-${tier.toUpperCase().slice(0,3)}-${count}` : '';

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
      return sendJson(res, 200, { ok: true, summary: getSummaryResponse() });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/deals/') && pathname.endsWith('/settle')) {
      const id = pathname.split('/')[3];
      const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
      if (!deal) return sendJson(res, 404, { error: 'الصفقة غير موجودة' });

      const now = new Date().toISOString();
      const licRef = `QLX2-${deal.tier.toUpperCase().slice(0, 3)}-${deal.deal_no.split('-').pop()}`;
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

    if (req.method === 'GET' && pathname === '/api/backup/export-data') {
      const exportData = exportFullSystemJson(db);
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

    if (req.method === 'GET' && pathname === '/api/catalogs/agent') {
      const catPath = path.join(ROOT, 'كتالوج_تشغيل_الوكيل_الحصري.html');
      if (!fs.existsSync(catPath)) return sendJson(res, 404, { error: 'كتالوج الوكيل غير متاح' });
      const html = fs.readFileSync(catPath, 'utf8');
      const dl = url.searchParams.get('download') === '1';
      return sendHtmlWithOptionalDownload(res, html, 'Qalix-Agent-Operations-Catalog-A-Z.html', dl);
    }

    if (req.method === 'GET' && pathname === '/api/catalogs/distributor') {
      const catPath = path.join(PRESENTATIONS_DIR, 'كتالوج_تشغيل_الموزع_الميداني.html');
      if (!fs.existsSync(catPath)) return sendJson(res, 404, { error: 'كتالوج الموزع غير متاح' });
      const html = fs.readFileSync(catPath, 'utf8');
      const dl = url.searchParams.get('download') === '1';
      return sendHtmlWithOptionalDownload(res, html, 'Qalix-Distributor-Field-Catalog-A-Z.html', dl);
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

    /* ---------------- Developer & System Administration API (Dev Console) ---------------- */
    if (req.method === 'POST' && pathname === '/api/dev/reset-deals') {
      const resData = resetDealsOnly(db);
      logAudit('dev_reset_deals', 'تصفير صفقات النظام من لوحة المطور مع أخذ لقطة احتياطية');
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/factory-reset') {
      const resData = resetAllDataFactory(db, () => seedInitialData(db));
      logAudit('dev_factory_reset', 'استعادة ضبط المصنع وتصفير قاعدة البيانات من لوحة المطور');
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/clear-audits') {
      const resData = clearAuditLogsOnly(db);
      return sendJson(res, 200, resData);
    }

    if (req.method === 'POST' && pathname === '/api/dev/custom-whatsapp') {
      const body = await readJsonBody(req);
      try {
        const result = addCustomWhatsAppTemplate(body);
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

server.listen(PORT, HOST, () => {
  console.log(`=============================================================`);
  console.log(`★ Qalix Medical Agent Server v1.0 (100% Offline Air-Gapped) ★`);
  console.log(`  - Official Agent Contact: 01122166076 (+201122166076)`);
  console.log(`  - Agent Command URL:      http://${HOST}:${PORT}`);
  console.log(`  - Database (SQLite WAL):  ${dbPath}`);
  console.log(`=============================================================`);
});

function gracefulShutdown() {
  try { db.close(); } catch (_) {}
  process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

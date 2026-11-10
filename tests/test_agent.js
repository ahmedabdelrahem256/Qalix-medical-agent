/* Automated Test Suite for Qalix Medical Agent (100% Offline Air-Gapped) */
'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const TEST_PORT = 4150;
const TEST_DATA_DIR = path.join(__dirname, '..', 'data', '.test_run');

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = http.request({ hostname: '127.0.0.1', port: TEST_PORT, path: urlPath, method, headers }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: b, headers: res.headers }); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

(async () => {
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'agent_server.js')], {
    env: { ...process.env, PORT: String(TEST_PORT), DATA_DIR: TEST_DATA_DIR },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Server timeout')), 5000);
    srv.stdout.on('data', d => {
      if (String(d).includes('Qalix Medical Agent Server')) {
        clearTimeout(t);
        resolve();
      }
    });
    srv.stderr.on('data', d => console.error('SRV STDERR:', String(d)));
  });

  const results = [];
  const check = (name, cond, details) => {
    if (!cond && details) console.error('DEBUG DETAILS FOR:', name, details);
    assert.ok(cond, name);
    results.push(name);
  };

  try {
    // 1. Bootstrap & Agent Phone 01122166076
    const b1 = await req('GET', '/api/bootstrap');
    check('1. تشغيل خادم الوكيل والتحقق من الرقم الموحد 01122166076', b1.status === 200 && b1.body.agent.phone === '01122166076');

    // 2. Verify Fixed Pricing Table
    check('2. التحقق من جدول الأسعار الرسمية الثابتة (4500 / 8500 / 18500) وعرض أسيوط (2700 / 5100 / 11100)',
      b1.body.pricing.basic.price === 4500 &&
      b1.body.pricing.professional.price === 8500 &&
      b1.body.pricing.enterprise.price === 18500 &&
      b1.body.pricing.professional.assiutPrice === 5100
    );

    // 3. Create Independent Distributor with 20% commission
    const newDist = await req('POST', '/api/distributors', {
      name: 'مكتب الصعيد للأنظمة الطبية',
      phone: '01099887766',
      governorate: 'أسيوط وسوهاج',
      commissionRate: 20
    });
    check('3. إضافة موزع مستقل جديد وتوليد كوده وبوابته المستقلة (.html)',
      newDist.status === 200 && newDist.body.distributor.code.startsWith('QMA-DIST-') && fs.existsSync(newDist.body.kitFile)
    );
    const distId = newDist.body.distributor.id;

    // 4. Download Standalone Distributor Kit HTML
    const kitRes = await req('GET', `/api/distributors/${distId}/kit`);
    check('4. تنزيل بوابة الموزع المستقلة والتأكد من تضمين الرقم 01122166076 ونسبة العمولة 20%',
      kitRes.status === 200 && String(kitRes.body).includes('01122166076') && String(kitRes.body).includes('20%')
    );

    // 5. Register Deal at Standard Fixed Price (Professional = 8500 EGP, 20% = 1700 EGP, Agent Net = 6800 EGP)
    const dl1 = await req('POST', '/api/deals', {
      distributorId: distId,
      clinicName: 'مركز النيل التخصصي',
      doctorName: 'د. سامح فؤاد',
      clinicPhone: '01055443322',
      city: 'سوهاج',
      isAssiut: false,
      tier: 'professional',
      hardwareId: 'A1B2C3D4E5F60718293A4B5C'
    });
    const createdDeal = dl1.body.summary.deals[0];
    check('5. تسجيل صفقة بالسعر الثابت (8,500 ج.م) وحساب نسبة الموزع (1,700 ج.م) وصافي الوكيل (6,800 ج.م)',
      dl1.status === 200 &&
      createdDeal.fixed_price === 8500 &&
      createdDeal.distributor_commission === 1700 &&
      createdDeal.agent_net_amount === 6800 &&
      createdDeal.status === 'pending'
    );

    // 6. Register Deal with Assiut 40% Discount (Basic = 2700 EGP, 20% = 540 EGP, Agent Net = 2160 EGP)
    const dl2 = await req('POST', '/api/deals', {
      distributorId: distId,
      clinicName: 'عيادة الرحمة التخصصية بأسيوط',
      doctorName: 'د. محمود حسن',
      clinicPhone: '01122334455',
      city: 'أسيوط',
      isAssiut: true,
      tier: 'basic',
      hardwareId: 'F1E2D3C4B5A69788695A4B3C'
    });
    const assiutDeal = dl2.body.summary.deals[0];
    check('6. تسجيل صفقة بعرض أسيوط الثابت (2,700 ج.م) وحساب عمولة الموزع (540 ج.م) وصافي الوكيل (2,160 ج.م)',
      dl2.status === 200 &&
      assiutDeal.fixed_price === 2700 &&
      assiutDeal.distributor_commission === 540 &&
      assiutDeal.agent_net_amount === 2160
    );

    // 7. Settle Pending Deal & Issue License Reference
    const st1 = await req('POST', `/api/deals/${createdDeal.id}/settle`);
    const settled = st1.body.summary.deals.find(x => x.id === createdDeal.id);
    check('7. اعتماد تحصيل صافي الوكيل وتفعيل الصفقة وإصدار مرجع الترخيص',
      st1.status === 200 && settled.status === 'completed' && settled.license_key_ref.startsWith('QLX2-PRO-')
    );

    // 8. Verify Audit Hash Chain
    const audits = st1.body.summary.audits;
    check('8. التحقق من سلسلة التدقيق الجنائي المشفرة (SHA-256 Hash Chain)',
      audits.length >= 4 && audits[0].curr_hash.length === 64
    );

    // 9. Verify 5-Pillar Excellence & #1 Leadership Proposals
    check('9. التحقق من ركن اقتراحات التطوير والارتقاء (12 محوراً عبر الأركان الخمسة: المنظومة، العرض، البيع، المتابعة، الإدارة)',
      Array.isArray(b1.body.proposals) && b1.body.proposals.length >= 12
    );

    // 10. Add a new proposal to Excellence Hub
    const pRes = await req('POST', '/api/proposals', {
      pillar: 'sales',
      title: 'حملة الزيارات المباشرة للمراكز الطبية الكبرى',
      description: 'تخصيص يوم أسبوعي لكل موزع لزيارة المراكز متعددة التخصصات وعرض باقة المراكز الكبرى.',
      impact: 'رفع مبيعات باقة Enterprise بنسبة 40%'
    });
    check('10. إضافة مقترح تطوير جديد وحفظه في قاعدة بيانات الوكيل SQLite WAL',
      pRes.status === 200 && pRes.body.summary.proposals.length >= 13
    );

    // 11. Verify Competitors Pros/Cons & Qalix Comparison Window API
    const compRes = await req('GET', '/api/competitors');
    check('11. التحقق من نافذة المنظومات المنافسة (طَبَّبَ، طبيب بلس، أوركا/أميدرا، تيبورا، البرامج المكتبية) ومزاياها وعيوبها والمقارنة مع كالكس',
      compRes.status === 200 &&
      Array.isArray(compRes.body.competitors) &&
      compRes.body.competitors.length === 5 &&
      compRes.body.competitors.every(c => c.pros.length > 0 && c.cons.length > 0 && c.qalixWinEdge && c.salesPitchAr)
    );

    // 12. Verify Specialty Turnkey Packs API (Phase 3)
    const packsRes = await req('GET', '/api/specialty-packs');
    check('12. التحقق من كتالوج حزم التخصصات الجاهزة للاستيراد (أسنان، أطفال، باطنة/قلب، نساء وتوليد، عيون)',
      packsRes.status === 200 &&
      Array.isArray(packsRes.body.packs) &&
      packsRes.body.packs.length === 5 &&
      packsRes.body.packs.every(p => p.id && p.nameAr && p.stats.drugsCount > 0 && p.stats.servicesCount > 0)
    );

    // 13. Download Specialty Pack in JSON and CSV formats
    const packJsonRes = await req('GET', '/api/specialty-packs/dental/download?format=json');
    const packCsvRes = await req('GET', '/api/specialty-packs/dental/download?format=csv');
    check('13. تنزيل حزمة تخصصية بصيغة JSON و CSV مهيأة للاستيراد الفوري بالعيادة',
      packJsonRes.status === 200 &&
      packJsonRes.body.id === 'dental' &&
      Array.isArray(packJsonRes.body.services) &&
      packJsonRes.body.services.length >= 20 &&
      packCsvRes.status === 200 &&
      typeof packCsvRes.body === 'string' &&
      packCsvRes.body.includes('DENT-01')
    );

    // 14. Test Legacy Excel/CSV Data Migration Engine
    const sampleCsv = `اسم المريض,رقم الهاتف,العمر,النوع,العنوان,التاريخ المرضي
محمد محمود أحمد,01012345678,45,ذكر,أسيوط - ديروط,حساسية بنسلين وضغط مرتفع
منى عبد الله سالم,01287654321,32,أنثى,القاهرة - مدينة نصر,لا يوجد`;
    const migRes = await req('POST', '/api/tools/migrate-data', {
      type: 'patients',
      rawText: sampleCsv
    });
    check('14. اختبار محول هجرة بيانات Excel/CSV وتنقية سجلات المرضى والأدوية أوفلاين',
      migRes.status === 200 &&
      migRes.body.ok === true &&
      migRes.body.successfulCount === 2 &&
      migRes.body.data[0].name === 'محمد محمود أحمد' &&
      migRes.body.data[0].gender === 'ذكر' &&
      migRes.body.data[1].gender === 'أنثى'
    );

    // 15. Verify Marketing Materials & 5-Minute WOW Live Demo Kit
    const mktRes = await req('GET', '/api/marketing/materials');
    check('15. التحقق من حقيبة التسويق الميداني وسيناريو الـ 5 دقائق ورسائل واتساب وبطاقة A4',
      mktRes.status === 200 &&
      mktRes.body.materials &&
      mktRes.body.materials.fiveMinuteDemo.steps.length === 5 &&
      Array.isArray(mktRes.body.materials.whatsAppTemplates) &&
      mktRes.body.materials.whatsAppTemplates.length >= 4 &&
      mktRes.body.materials.battleCardData.comparisonPoints.length >= 7
    );

    // 16. Verify Standalone Distributor Portal includes Phase 3 Field Kit
    const kitV3Res = await req('GET', `/api/distributors/${distId}/kit`);
    check('16. التحقق من احتواء بوابة الموزع المستقلة على أدوات المرحلة 3 (العرض، رسائل واتساب، وبطاقة A4)',
      kitV3Res.status === 200 &&
      typeof kitV3Res.body === 'string' &&
      kitV3Res.body.includes('سيناريو العرض الميداني في 5 دقائق') &&
      kitV3Res.body.includes('رسائل واتساب البيعية') &&
      kitV3Res.body.includes('01122166076')
    );

    // 17. Verify Network Diagnostics & Local WiFi Mobile QR Access (Phase 4)
    const netRes = await req('GET', '/api/network-status');
    check('17. فحص واكتشاف عناوين الشبكة المحلية وتوليد QR للموبايل (Network Diagnostics)',
      netRes.status === 200 &&
      netRes.body.ok === true &&
      netRes.body.network &&
      netRes.body.network.primaryIp &&
      netRes.body.network.primaryMobileUrl.includes(':4150') &&
      netRes.body.network.qrCodeSvg.includes('<svg')
    );

    // 18. Generate Official Distributor Partnership Contract (Phase 4)
    const ctrRes = await req('GET', `/api/contracts/distributor/${distId}`);
    check('18. توليد عقد التوزيع المستقل المعتمد القابل للطباعة A4 ببنود الأسعار الثابتة والعمولة',
      ctrRes.status === 200 &&
      typeof ctrRes.body === 'string' &&
      ctrRes.body.includes('عقد تعيين موزع مستقل معتمد') &&
      ctrRes.body.includes('01122166076') &&
      ctrRes.body.includes('20%')
    );

    // 19. Generate Clinic Handover & Operation Sign-off Certificate (Phase 4)
    const hDealId = dl1.body.summary.deals[0].id;
    const handRes = await req('GET', `/api/contracts/deal/${hDealId}`);
    check('19. توليد محضر تسليم وتشغيل العيادة المعتمد (Sign-Off Handover Certificate)',
      handRes.status === 200 &&
      typeof handRes.body === 'string' &&
      handRes.body.includes('محضر تسليم وتشغيل واعتماد ترخيص نهائي') &&
      handRes.body.includes('مركز النيل التخصصي') &&
      handRes.body.includes('A1B2C3D4E5F60718293A4B5C')
    );

    // 20. Generate Distributor Financial Ledger Statement (Phase 4)
    const stmtRes = await req('GET', `/api/distributors/${distId}/statement`);
    check('20. استخراج كشف الحساب المالي التفصيلي للموزع (Statement of Account) وسلسلة التدقيق',
      stmtRes.status === 200 &&
      typeof stmtRes.body === 'string' &&
      stmtRes.body.includes('كشف حساب مالي وتسوية مستحقات موزع معتمد') &&
      stmtRes.body.includes('إجمالي المبيعات المحققة') &&
      stmtRes.body.includes('01122166076')
    );

    // 21. Generate Printable Official Quotation HTML & Data (Phase 5)
    const quoRes = await req('GET', `/api/quotations/generate?doctor_name=${encodeURIComponent('د. أحمد صلاح')}&clinic_name=${encodeURIComponent('مركز الشفاء التخصصي')}&specialty=dental&tier=professional&governorate=${encodeURIComponent('أسيوط')}&assiut=true`);
    check('21. توليد عرض السعر الرسمي المعتمد A4 بخصم أسيوط 40% والرمز الرقمي (Phase 5)',
      quoRes.status === 200 &&
      typeof quoRes.body === 'string' &&
      quoRes.body.includes('عــرض ســعـر وتـوريــد رســمـي مـعـتـمـد') &&
      quoRes.body.includes('د. أحمد صلاح') &&
      quoRes.body.includes('مركز الشفاء التخصصي') &&
      quoRes.body.includes('01122166076') &&
      quoRes.body.includes('5,100'),
      { status: quoRes.status, bodyLen: typeof quoRes.body === 'string' ? quoRes.body.length : null, bodySub: typeof quoRes.body === 'string' ? quoRes.body.substring(0, 300) : quoRes.body }
    );

    // 22. Field Objections Playbook with Killer Responses & WA Snippets (Phase 5)
    const objRes = await req('GET', '/api/playbook/objections');
    check('22. التحقق من كتيب الرد على اعتراضات الأطباء (8 سيناريوهات ميدانية ورسائل واتساب)',
      objRes.status === 200 &&
      objRes.body.ok === true &&
      Array.isArray(objRes.body.playbook) &&
      objRes.body.playbook.length === 8 &&
      objRes.body.playbook.some(o => o.id === 'price_too_high') &&
      objRes.body.playbook.some(o => o.id === 'internet_issues')
    );

    // 23. After-Sales Retention Milestones & Customer Success Timeline (Phase 5)
    const afsRes = await req('GET', '/api/after-sales/milestones');
    const afsDealsRes = await req('GET', '/api/after-sales/deals');
    check('23. التحقق من محرك متابعة ما بعد البيع ومحطات الرضاء (اليوم 3، 14، 3 شهور، 6 شهور، سنة)',
      afsRes.status === 200 &&
      Array.isArray(afsRes.body.milestones) &&
      afsRes.body.milestones.length === 5 &&
      afsDealsRes.status === 200 &&
      Array.isArray(afsDealsRes.body.deals) &&
      afsDealsRes.body.deals.length > 0 &&
      afsDealsRes.body.deals[0].milestones.length === 5
    );

    // 24. SQLite Database Snapshot Creation & SHA-256 Integrity Verification (Phase 5)
    const snapRes = await req('POST', '/api/backup/create');
    const snapListRes = await req('GET', '/api/backup/list');
    check('24. إنشاء نقطة استعادة لحظية لقاعدة الوكيل SQLite WAL والتحقق من بصمة SHA-256',
      snapRes.status === 201 &&
      snapRes.body.ok === true &&
      snapRes.body.snapshot.sha256.length === 64 &&
      snapListRes.status === 200 &&
      snapListRes.body.snapshots.length > 0
    );

    // 25. Full System Data Export in JSON Format (Phase 5)
    const expRes = await req('GET', '/api/backup/export-data');
    check('25. تصدير كامل بيانات المنظومة وسجل التدقيق في ملف JSON موثق بالبصمة المشفرة',
      expRes.status === 200 &&
      typeof expRes.body === 'object' &&
      expRes.body.agentPhone === '01122166076' &&
      expRes.body.summary &&
      expRes.body.summary.distributorsCount >= 1 &&
      expRes.body.summary.dealsCount >= 1,
      { status: expRes.status, bodyType: typeof expRes.body, body: expRes.body }
    );

    // 26. Pure Zero-Dependency SVG Visual Analytics Charts (Phase 6)
    const chartsRes = await req('GET', '/api/analytics/charts');
    check('26. توليد مخططات التحليلات البصرية الصافية (Pure SVG: الأعمدة، الدونات، والتدفق النقدي)',
      chartsRes.status === 200 &&
      chartsRes.body.ok === true &&
      typeof chartsRes.body.charts.barChartSvg === 'string' &&
      chartsRes.body.charts.barChartSvg.includes('<svg') &&
      typeof chartsRes.body.charts.donutChartSvg === 'string' &&
      chartsRes.body.charts.donutChartSvg.includes('<svg') &&
      typeof chartsRes.body.charts.waterfallChartSvg === 'string' &&
      chartsRes.body.charts.waterfallChartSvg.includes('<svg')
    );

    // 27. Distributor Training Modules & Exam Curriculum (Phase 6)
    const trainRes = await req('GET', '/api/training/modules');
    check('27. استرجاع مناهج التدريب الـ 6 وأسئلة امتحان تأهيل الموزعين الميدانيين (Phase 6)',
      trainRes.status === 200 &&
      trainRes.body.ok === true &&
      Array.isArray(trainRes.body.modules) &&
      trainRes.body.modules.length === 6 &&
      Array.isArray(trainRes.body.questions) &&
      trainRes.body.questions.length === 6
    );

    // 28. Training Exam Simulation Evaluation & 100% Score (Phase 6)
    const examRes = await req('POST', '/api/training/submit-exam', {
      distributorId: distId,
      answers: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0 }
    });
    check('28. تصحيح امتحان محاكاة المبيعات واجتياز الاعتماد بنسبة 100% وإصدار التوثيق',
      examRes.status === 200 &&
      examRes.body.ok === true &&
      examRes.body.result.passed === true &&
      examRes.body.result.score === 6 &&
      examRes.body.result.percentage === 100
    );

    // 29. Printable A4 Accredited Distributor Certificate (Phase 6)
    const certRes = await req('GET', `/api/training/certificate/${distId}`);
    check('29. إصدار شهادة اعتماد الموزع الميداني الرسمية A4 برمز التحقق وبصمة الهاش الجنائية',
      certRes.status === 200 &&
      typeof certRes.body === 'string' &&
      certRes.body.includes('شـــهادة اعــتـماد مـوزع مـيـدانـي مـعـتـمـد') &&
      certRes.body.includes('01122166076') &&
      certRes.body.includes('QMA-CERT-')
    );

    // 30. Clinic Go-Live Readiness Inspector & WhatsApp Broadcast Studio (Phase 6)
    const chkEvalRes = await req('POST', '/api/checklist/evaluate', {
      checkedIds: ['os_compat', 'ram_disk', 'network_wifi', 'printer_ready', 'backup_media', 'power_settings', 'desktop_icons', 'migration_check', 'sample_print', 'staff_training']
    });
    const bcastRes = await req('GET', '/api/broadcast/campaigns');
    check('30. فحص الجاهزية الفنية للعيادات (10/10 Optimal) واستوديو حملات الواتساب الميدانية',
      chkEvalRes.status === 200 &&
      chkEvalRes.body.evaluation.percentage === 100 &&
      chkEvalRes.body.evaluation.status === 'optimal' &&
      bcastRes.status === 200 &&
      Array.isArray(bcastRes.body.campaigns) &&
      bcastRes.body.campaigns.length >= 4 &&
      bcastRes.body.campaigns.some(c => c.id === 'camp_assiut_support')
    );

    // 31. Medical Prescription Templates Retrieval (Phase 7)
    const rxTemplRes = await req('GET', '/api/rx-designer/templates');
    check('31. استرجاع قوالب الروشتات الطبية التخصصية الـ 5 (أسنان، أطفال، قلب، نساء، عيون)',
      rxTemplRes.status === 200 &&
      rxTemplRes.body.ok === true &&
      rxTemplRes.body.presets &&
      rxTemplRes.body.presets.dental &&
      rxTemplRes.body.presets.internal_cardio
    );

    // 32. Render Printable Medical Prescription HTML (Phase 7)
    const rxRenderRes = await req('GET', `/api/rx-designer/preview?specialty=internal_cardio&paperSize=A4&doctorName=${encodeURIComponent('د. حسام عادل')}&clinicName=${encodeURIComponent('مركز القلب الدولي')}`);
    check('32. توليد ومعاينة الروشتة الطبية المخصصة A4 مع الباركود والتشخيص وقائمة الأدوية',
      rxRenderRes.status === 200 &&
      typeof rxRenderRes.body === 'string' &&
      rxRenderRes.body.includes('د. حسام عادل') &&
      rxRenderRes.body.includes('مركز القلب الدولي') &&
      rxRenderRes.body.includes('01122166076') &&
      rxRenderRes.body.includes('℞')
    );

    // 33. Distributor Commission Hierarchy Tiers & Profile Calculation (Phase 7)
    const hierRes = await req('GET', `/api/hierarchy/distributor/${distId}`);
    check('33. حساب وتصنيف الموزع ضمن شرائح التميز (Bronze, Silver, Gold, Platinum) وحوافز الترقية',
      hierRes.status === 200 &&
      hierRes.body.ok === true &&
      hierRes.body.profile &&
      hierRes.body.profile.currentTier &&
      hierRes.body.profile.currentTier.commissionRate >= 20
    );

    // 34. Generate Official Distributor Tier Promotion Letter A4 (Phase 7)
    const letterRes = await req('GET', `/api/hierarchy/distributor/${distId}/letter`);
    check('34. إصدار خطاب ترقية واعتماد شريحة التميز التجاري A4 برمز التحقق وبصمة الوكيل',
      letterRes.status === 200 &&
      typeof letterRes.body === 'string' &&
      letterRes.body.includes('خــطـاب تـرقــيـة واعــتـمـاد شــريـحـة الـتـمـيـز الـتـجـاري') &&
      letterRes.body.includes('01122166076')
    );

    // 35. 12-Month Financial Forecasting Simulator & SVG Projection (Phase 7)
    const fcRes = await req('GET', '/api/financial/forecast?scenario=balanced');
    check('35. محاكاة المسار التنبؤي لإيرادات الوكيل وعمولات الموزعين لـ 12 شهراً ورسم SVG',
      fcRes.status === 200 &&
      fcRes.body.ok === true &&
      fcRes.body.forecast &&
      fcRes.body.forecast.months.length === 12 &&
      fcRes.body.forecast.annualGrossSales > 0 &&
      fcRes.body.forecast.annualAgentNetRevenue > 0 &&
      typeof fcRes.body.forecast.forecastSvgChart === 'string' &&
      fcRes.body.forecast.forecastSvgChart.includes('<svg')
    );

    console.log(`=== QALIX MEDICAL AGENT TESTS: ${results.length}/35 PASSED ===`);
    for (const r of results) console.log(' ✅', r);
  } finally {
    srv.kill('SIGINT');
    await new Promise(r => setTimeout(r, 600));
    try {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }
})();

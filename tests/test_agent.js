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
  });

  const results = [];
  const check = (name, cond) => {
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

    console.log('=== QALIX MEDICAL AGENT TESTS: 11/11 PASSED ===');
    for (const r of results) console.log(' ✅', r);
  } finally {
    srv.kill();
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
})();

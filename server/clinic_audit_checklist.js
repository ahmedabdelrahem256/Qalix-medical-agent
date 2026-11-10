/* Qalix Medical Agent — Clinic Pre-Installation & Go-Live Readiness Inspector (Phase 6)
 * 100% Offline Air-Gapped · Zero External Dependencies · A4 Printable Audit Report
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const crypto = require('node:crypto');
const { generateSimpleSvgQr } = require('./network_diagnostics');

const AUDIT_CHECKPOINTS = [
  { id: 'os_compat', title: '1. نظام التشغيل والتوافق', desc: 'Windows 10 أو 11 (64-bit) محدث وخالٍ من الفيروسات', weight: 10, category: 'العتاد' },
  { id: 'ram_disk', title: '2. الذاكرة والمساحة التخزينية', desc: 'RAM لا تقل عن 4GB وتوفر مساحة تخزين 5GB+ على القرص', weight: 10, category: 'العتاد' },
  { id: 'network_wifi', title: '3. الشبكة الداخلية (Wi-Fi/LAN)', desc: 'راوتر أو نقطة اتصال داخلية لربط الموبايل والتابلت بدون إنترنت', weight: 10, category: 'الشبكة' },
  { id: 'printer_ready', title: '4. طابعة الروشتات والإيصالات', desc: 'طابعة ليزر A4 أو طابعة حرارية 80mm معرفة وجاهزة للطباعة', weight: 10, category: 'الملحقات' },
  { id: 'backup_media', title: '5. وسيط النسخ الاحتياطي', desc: 'فلاشة USB أو هارد خارجي مخصص لحفظ النسخ الاحتياطية المشفرة', weight: 10, category: 'الأمان' },
  { id: 'power_settings', title: '6. ضبط نمط الطاقة وشاشة السكون', desc: 'تعطيل Sleep Mode لضمان عدم توقف الاستقبال أثناء العمل', weight: 10, category: 'النظام' },
  { id: 'desktop_icons', title: '7. اختصارات سطح المكتب', desc: 'وضع اختصارات تشغيل المنظومة والعيادة على سطح مكتب الأجهزة', weight: 10, category: 'البرمجيات' },
  { id: 'migration_check', title: '8. هجرة بيانات المرضى القدامى', desc: 'استيراد وتنقية شيت إكسيل من البرنامج القديم واكتمال السجلات', weight: 10, category: 'البيانات' },
  { id: 'sample_print', title: '9. اختبار طباعة روشتة تجريبية', desc: 'فحص جودة طباعة الروشتة وقراءة الباركود الدوائي واسم الطبيب', weight: 10, category: 'الجودة' },
  { id: 'staff_training', title: '10. تدريب طاقم السكرتارية', desc: 'إتقان حجز المريض، كتابة الكشف، وتقفيل الوردية Z-Report', weight: 10, category: 'التدريب' }
];

function evaluateClinicChecklist(checkedIds = []) {
  let passedCount = 0;
  const total = AUDIT_CHECKPOINTS.length;
  const items = AUDIT_CHECKPOINTS.map(c => {
    const isChecked = checkedIds.includes(c.id);
    if (isChecked) passedCount++;
    return {
      id: c.id,
      title: c.title,
      desc: c.desc,
      category: c.category,
      isChecked
    };
  });

  const percentage = Math.round((passedCount / total) * 100);
  let status = 'critical';
  let statusLabelAr = 'غير جاهزة للتشغيل (يلزم استكمال الشروط الحرجة)';
  if (percentage === 100) {
    status = 'optimal';
    statusLabelAr = 'جاهزة للتشغيل الطبي الفوري بنسبة 100% (Go-Live Optimal)';
  } else if (percentage >= 80) {
    status = 'good';
    statusLabelAr = 'جاهزة للتشغيل مع استيفاء بعض الملاحظات الطفيفة';
  }

  return {
    passedCount,
    total,
    percentage,
    status,
    statusLabelAr,
    items
  };
}

function generateClinicAuditReportHtml(params, evalResult) {
  const doctorName = (params.doctorName || 'السيد الدكتور المحترم').trim();
  const clinicName = (params.clinicName || 'العيادة التخصصية').trim();
  const inspectorName = (params.inspectorName || 'الموزع المعتمد').trim();
  const dateStr = new Date().toISOString().split('T')[0];
  const auditSerial = `QMA-AUD-${dateStr.replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const qrSvg = generateSimpleSvgQr(`AUDIT:${auditSerial}|CLINIC:${clinicName}|STATUS:${evalResult.status}|AGENT:01122166076`);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير جاهزية التشغيل الفني — ${clinicName} — ${auditSerial}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif; }
    body { background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
    .page-container { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 30px 36px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 14px; margin-bottom: 16px; }
    .brand-title { font-size: 19px; font-weight: 800; color: #0f766e; margin: 0 0 4px; }
    .brand-sub { font-size: 12px; color: #64748b; margin: 0; }
    .doc-headline { text-align: center; margin: 12px 0 16px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; padding: 8px; }
    .doc-headline h1 { margin: 0; font-size: 17px; color: #115e59; }
    .meta-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; }
    .score-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 4px; }
    .score-optimal { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .score-good { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .score-critical { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
    th { background: #0f766e; color: #fff; padding: 8px 10px; text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) { background: #f8fafc; }
    .sig-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; margin-top: 24px; border-top: 1.5px dashed #cbd5e1; padding-top: 14px; font-size: 12px; }
    .sig-col { text-align: center; color: #475569; }
    .sig-col .line { margin-top: 40px; border-top: 1px solid #94a3b8; width: 75%; margin-left: auto; margin-right: auto; }
    .actions { text-align: center; margin-top: 18px; }
    .btn { background: #0f766e; color: #fff; padding: 9px 22px; border-radius: 6px; border: none; font-size: 13.5px; font-weight: bold; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .page-container { border: none; box-shadow: none; padding: 0; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div>
        <h2 class="brand-title">منظومة كالكس ميديكال الطبية — Qalix Medical</h2>
        <p class="brand-sub">إدارة العيادات والمراكز التخصصية · بروتوكول الفحص الفني قبل التشغيل الميداني</p>
      </div>
      <div style="text-align:left; font-size:11.5px; color:#475569;">
        <strong>وكيل المنظومة الرسمي</strong><br>
        هاتف / واتساب: <strong>01122166076</strong>
      </div>
    </div>

    <div class="doc-headline">
      <h1>تقرير التدقيق الفني وجاهزية التشغيل الطبي (Go-Live Readiness)</h1>
      <div style="font-size:11.5px; color:#64748b; margin-top:3px;">
        الرقم المرجعي: <strong>${auditSerial}</strong> &nbsp;|&nbsp; التاريخ: <strong>${dateStr}</strong>
      </div>
    </div>

    <div class="meta-bar">
      <div><strong>المنشأة الطبية:</strong> ${clinicName}</div>
      <div><strong>الطبيب المسؤول:</strong> د. ${doctorName}</div>
      <div><strong>المشرف الفني / الموزع:</strong> ${inspectorName}</div>
    </div>

    <div style="text-align:center; margin-bottom:16px;">
      <span class="score-badge score-${evalResult.status}">
        معدل الجاهزية الفنية: ${evalResult.percentage}% (${evalResult.passedCount} من ${evalResult.total} معايير مكتملة) — ${evalResult.statusLabelAr}
      </span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px; text-align:center;">#</th>
          <th>المعيار الفني والتشغيلي</th>
          <th style="width:110px; text-align:center;">التصنيف</th>
          <th style="width:90px; text-align:center;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${evalResult.items.map((it, idx) => `
          <tr>
            <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
            <td>
              <strong>${it.title}</strong><br>
              <span style="font-size:11.5px; color:#64748b;">${it.desc}</span>
            </td>
            <td style="text-align:center;"><span style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-size:11px;">${it.category}</span></td>
            <td style="text-align:center; font-weight:bold; color:${it.isChecked ? '#16a34a' : '#dc2626'};">
              ${it.isChecked ? '✅ مطابق' : '❌ يلزم استكماله'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="sig-grid">
      <div class="sig-col">
        <strong>الفني / الموزع المستقل المعتمد</strong>
        <p style="margin:2px 0; font-size:11px;">${inspectorName}</p>
        <div class="line"></div>
      </div>
      <div style="text-align:center;">
        ${qrSvg}
        <div style="font-size:9.5px; color:#64748b;">التحقق الفني الرقمي</div>
      </div>
      <div class="sig-col">
        <strong>مدير العيادة / الطبيب المسؤول</strong>
        <p style="margin:2px 0; font-size:11px;">د. ${doctorName}</p>
        <div class="line"></div>
      </div>
    </div>

    <div class="actions">
      <button class="btn" onclick="window.print()">🖨️ طباعة تقرير الجاهزية الفنية (A4)</button>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  AUDIT_CHECKPOINTS,
  evaluateClinicChecklist,
  generateClinicAuditReportHtml
};

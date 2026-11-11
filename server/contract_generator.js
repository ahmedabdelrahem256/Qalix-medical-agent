/* Official Legal Contracts & Clinic Handover Certificates Generator (Phase 4)
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

const { escapeHtml } = require('./html_escape');

function generateDistributorContractHtml(dist, agentInfo) {
  const contractDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const safeDist = {
    name: escapeHtml(dist.name),
    code: escapeHtml(dist.code),
    phone: escapeHtml(dist.phone),
    governorate: escapeHtml(dist.governorate),
    commission_rate: Number(dist.commission_rate) || 27
  };
  const contractNo = `CTR-${safeDist.code}-${new Date().getFullYear()}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>عقد توزيع مستقل معتمد: ${safeDist.name} (${contractNo})</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 30px; color: #0f172a; line-height: 1.7; background: #fff; }
    .page { max-width: 820px; margin: 0 auto; border: 2px solid #0f172a; padding: 35px; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 800; margin: 5px 0; color: #0f172a; }
    .meta { font-size: 13px; color: #475569; display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    .clause { margin-bottom: 14px; font-size: 13px; text-align: justify; }
    .clause-title { font-weight: bold; color: #0369a1; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12.5px; }
    th, td { border: 1px solid #94a3b8; padding: 8px 10px; text-align: right; }
    th { background: #f1f5f9; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 35px; padding-top: 20px; border-top: 1px solid #cbd5e1; }
    .sig-box { border: 1px dashed #94a3b8; padding: 15px; border-radius: 6px; min-height: 110px; font-size: 12.5px; }
    @media print {
      body { padding: 0; }
      .page { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:820px; margin:0 auto 15px; text-align:left;">
    <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;">🖨️ طباعة العقد الرسمي (A4 Print)</button>
  </div>

  <div class="page">
    <div class="header">
      <div style="font-size:13px; font-weight:bold; color:#0284c7;">جمهورية مصر العربية · قطاع تكنولوجيا الرعاية الصحية</div>
      <div class="title">عقد تعيين موزع مستقل معتمد لمنظومة "كالكس ميديكال" الطبية</div>
      <div style="font-size:12.5px; color:#64748b;">Qalix Medical System — Official Independent Distributor Agreement</div>
      <div class="meta">
        <span>رقم العقد المرجعي: <strong>${contractNo}</strong></span>
        <span>تاريخ التحرير: <strong>${contractDate}</strong></span>
        <span>نطاق التوزيع: <strong>محافظة ${safeDist.governorate}</strong></span>
      </div>
    </div>

    <div class="clause">
      <strong>تم الاتفاق والتراضي في هذا اليوم بين كلٍ من:</strong><br>
      <strong>الطرف الأول (الوكيل الحصري):</strong> وكيل منظومة كالكس ميديكال الطبية، هاتف وواتساب الدعم المعتمد: <code>01122166076</code>.<br>
      <strong>الطرف الثاني (الموزع المستقل):</strong> السيد/المكتب: <strong>${safeDist.name}</strong>، كود الموزع: <strong>${safeDist.code}</strong>، هاتف: <strong>${safeDist.phone}</strong>، المقيم بنطاق: <strong>${safeDist.governorate}</strong>.
    </div>

    <div class="clause">
      <div class="clause-title">البند الأول: موضوع التعاقد والصفة القانونية</div>
      يمنح الطرف الأول بموجب هذا العقد الطرف الثاني صفة «موزع مستقل معتمد» لتسويق وتثبيت النسخ التجريبية وبيع تراخيص منظومة "كالكس ميديكال" الطبية داخل النطاق الجغرافي المحدد (${safeDist.governorate})، دون أن يترتب على ذلك أي علاقة عمل تابع أو التزام وظيفي.
    </div>

    <div class="clause">
      <div class="clause-title">البند الثاني: السياسة السعرية الثابتة والعمولة</div>
      يلتزم الطرف الثاني التزاماً صارماً وغير قابل للتفاوض بالأسعار الرسمية الثابتة، ويحصل على عمولة فورية بنسبة <strong>${safeDist.commission_rate}%</strong> من إجمالي سعر البيع الثابت، ويورد صافي المبلغ كاملاً للوكيل، وفق الجدول التالي:
      <table>
        <thead>
          <tr><th>الباقة المعتمدة</th><th>السعر الرسمي الثابت</th><th>عمولة الموزع (${safeDist.commission_rate}%)</th><th>صافي توريد الوكيل (01122166076)</th></tr>
        </thead>
        <tbody>
          <tr><td>الباقة الأساسية (عيادة فردية)</td><td>4,500 ج.م</td><td>${Math.round(4500 * safeDist.commission_rate / 100)} ج.م</td><td>${4500 - Math.round(4500 * safeDist.commission_rate / 100)} ج.م</td></tr>
          <tr><td>الباقة التخصصية (عيادة نشطة)</td><td>8,500 ج.م</td><td>${Math.round(8500 * safeDist.commission_rate / 100)} ج.م</td><td>${8500 - Math.round(8500 * safeDist.commission_rate / 100)} ج.م</td></tr>
          <tr><td>باقة المراكز الكبرى والفروع (Enterprise)</td><td>18,500 ج.م</td><td>${Math.round(18500 * safeDist.commission_rate / 100)} ج.م</td><td>${18500 - Math.round(18500 * safeDist.commission_rate / 100)} ج.م</td></tr>
        </tbody>
      </table>
    </div>

    <div class="clause">
      <div class="clause-title">البند الثالث: آلية إصدار التراخيص والحوكمة الصارمة</div>
      يقر الطرفان بأن أداة توليد مفاتيح التفعيل الدائمة هي حق سيادي حصري للوكيل فقط (01122166076). لا يصدر أي ترخيص دائم إلا بعد استلام بصمة جهاز العيادة (Hardware ID) وتوريد صافي المبلغ كاملاً في حساب الوكيل، وتوثيق العملية في سجل التدقيق الجنائي المشفر (SHA-256).
    </div>

    <div class="clause">
      <div class="clause-title">البند الرابع: السرية وحظر المساس بحزمة المنظومة</div>
      يتعهد الطرف الثاني بالمحافظة التامة على سرية المنظومة، والالتزام بحظر تعديل أو تفكيك أي ملف من ملفات المنظومة الطبية، وعدم تقديم أي وعود فنية خارج المواصفات الرسمية للمنظومة (المحمية أوفلاين 100%).
    </div>

    <div class="signatures">
      <div class="sig-box">
        <strong>الطرف الأول (وكيل المنظومة الرسمي):</strong><br>
        الهوية: وكيل منظومة كالكس ميديكال الطبية<br>
        هاتف التواصل: 01122166076<br>
        التوقيع والختم: .......................................
      </div>
      <div class="sig-box">
        <strong>الطرف الثاني (الموزع المستقل):</strong><br>
        الاسم: ${safeDist.name}<br>
        الكود: ${safeDist.code} — هاتف: ${safeDist.phone}<br>
        التوقيع: .......................................
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateClinicHandoverHtml(deal, dist, agentInfo) {
  const handoverDate = deal.settled_at ? new Date(deal.settled_at).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG');
  const safeDeal = {
    deal_no: escapeHtml(deal.deal_no),
    clinic_name: escapeHtml(deal.clinic_name),
    city: escapeHtml(deal.city),
    doctor_name: escapeHtml(deal.doctor_name),
    clinic_phone: escapeHtml(deal.clinic_phone || '—'),
    tier: escapeHtml(deal.tier),
    fixed_price: Number(deal.fixed_price) || 0,
    license_key_ref: escapeHtml(deal.license_key_ref || 'QLX2-ISSUED'),
    hardware_id: escapeHtml(deal.hardware_id || 'REGISTERED_IN_SECURE_VAULT')
  };
  const safeDist = {
    name: escapeHtml(dist.name),
    code: escapeHtml(dist.code),
    phone: escapeHtml(dist.phone || '')
  };
  const handoverNo = `HO-${safeDeal.deal_no}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>محضر تسليم وتشغيل منظومة طبية: ${safeDeal.clinic_name} (${handoverNo})</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 30px; color: #0f172a; line-height: 1.7; background: #fff; }
    .page { max-width: 820px; margin: 0 auto; border: 2px solid #059669; padding: 35px; border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
    .title { font-size: 21px; font-weight: 800; margin: 5px 0; color: #065f46; }
    .meta { font-size: 13px; color: #475569; display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    .section-title { font-weight: bold; color: #047857; margin: 15px 0 6px; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12.5px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
    th { background: #f0fdf4; color: #065f46; }
    .check-list { list-style: none; padding-right: 0; font-size: 12.5px; }
    .check-list li { margin-bottom: 6px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #cbd5e1; }
    .sig-box { border: 1px dashed #94a3b8; padding: 15px; border-radius: 6px; min-height: 110px; font-size: 12.5px; }
    @media print {
      body { padding: 0; }
      .page { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:820px; margin:0 auto 15px; text-align:left;">
    <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; background:#059669; color:#fff; border:none; border-radius:6px; cursor:pointer;">🖨️ طباعة محضر التسليم الرسمي (A4 Print)</button>
  </div>

  <div class="page">
    <div class="header">
      <div style="font-size:13px; font-weight:bold; color:#059669;">منظومة كالكس ميديكال لإدارة العيادات والمراكز الطبية</div>
      <div class="title">محضر تسليم وتشغيل واعتماد ترخيص نهائي (Sign-Off Handover)</div>
      <div style="font-size:12.5px; color:#64748b;">Qalix Medical System — Official Clinic Handover & Acceptance Certificate</div>
      <div class="meta">
        <span>رقم المحضر: <strong>${handoverNo}</strong></span>
        <span>تاريخ التشغيل: <strong>${handoverDate}</strong></span>
        <span>رقم الصفقة: <strong>${safeDeal.deal_no}</strong></span>
      </div>
    </div>

    <div class="section-title">1. بيانات المنشأة الطبية والمتعاقد</div>
    <table>
      <tr><th style="width:25%;">اسم العيادة / المركز:</th><td><strong>${safeDeal.clinic_name}</strong></td><th style="width:25%;">المدينة / النطاق:</th><td>${safeDeal.city}</td></tr>
      <tr><th>اسم الطبيب المسؤول:</th><td><strong>${safeDeal.doctor_name}</strong></td><th>هاتف التواصل:</th><td dir="ltr">${safeDeal.clinic_phone}</td></tr>
      <tr><th>الباقة المتعاقد عليها:</th><td>${safeDeal.tier} (${safeDeal.fixed_price} ج.م)</td><th>مرجع الترخيص الصادر:</th><td><code>${safeDeal.license_key_ref}</code></td></tr>
      <tr><th>بصمة العتاد (Hardware ID):</th><td colspan="3"><code dir="ltr">${safeDeal.hardware_id}</code></td></tr>
    </table>

    <div class="section-title">2. بنود الفحص والتشغيل الميداني التي تم التحقق منها بحضور العميل</div>
    <ul class="check-list">
      <li>☑ <strong>تثبيت وتشغيل المنظومة أوفلاين 100%:</strong> تم التأكد من عمل البرنامج محلياً بكامل السرعة بعد فصل كابل الإنترنت.</li>
      <li>☑ <strong>الربط الشبكي وشاشة الانتظار:</strong> تم التحقق من مسح QR وربط شاشات الهواتف المحلية وسماع نداء الاستدعاء الصوتي.</li>
      <li>☑ <strong>صمام أمان التداخلات الدوائية:</strong> تم اختبار تنبيه التداخلات الدوائية والحساسية في الروشتة السريعة بنجاح.</li>
      <li>☑ <strong>تدريب السكرتارية والاستقبال:</strong> تم تدريب موظف الاستقبال على تسجيل المرضى والحجز وتقفيل الورديات Z-Report.</li>
      <li>☑ <strong>أمان وتشفير البيانات والنسخ الاحتياطي:</strong> تم إرشاد الطبيب لطريقة سحب النسخة الاحتياطية المشفرة على الفلاشة الخارجية.</li>
    </ul>

    <div class="section-title">3. إقرار الاستلام والتشغيل النهائي</div>
    <div style="font-size:12.5px; text-align:justify; margin-bottom:15px;">
      يقر الطرف الثاني (المنشأة الطبية) بأنه استلم المنظومة الطبية الموضحة أعلاه وهي تعمل بكفاءة تامة مطابقة لكافة المواصفات السريرية والمالية المتفق عليها، وتم تدريب فريق العمل، وصدر مرجع الترخيص المعتمد مدى الحياة بعد سداد الرسوم المتفق عليها.
    </div>

    <div class="signatures">
      <div class="sig-box">
        <strong>المسلِّم (الموزع المعتمد):</strong><br>
        الموزع: ${safeDist.name} (${safeDist.code})<br>
        ${safeDist.phone ? 'الهاتف: ' + safeDist.phone + '<br>' : ''}
        التوقيع: .......................................
      </div>
      <div class="sig-box">
        <strong>المستلم (الطبيب / المدير المالي للمركز):</strong><br>
        الاسم: د. ${safeDeal.doctor_name}<br>
        المنشأة: ${safeDeal.clinic_name}<br>
        التوقيع والختم: .......................................
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateDistributorContractHtml,
  generateClinicHandoverHtml
};

/* Qalix Medical Agent — Official Printable Quotation Generator (Phase 5)
 * 100% Offline Air-Gapped · Zero External Dependencies · A4 Print-Optimized
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const crypto = require('node:crypto');
const { SPECIALTY_PACKS } = require('./specialty_packs');
const { generateSimpleSvgQr } = require('./network_diagnostics');

function generateQuotationData(params, pricingCatalog) {
  const doctorName = (params.doctor_name || 'السيد الدكتور المحترم').trim();
  const clinicName = (params.clinic_name || 'العيادة التخصصية').trim();
  const specialtyId = params.specialty || 'dental';
  const tierKey = params.tier || 'professional';
  const governorate = (params.governorate || 'القاهرة').trim();
  const distributorName = (params.distributor_name || '').trim();
  const distributorCode = (params.distributor_code || '').trim();
  const distributorPhone = (params.distributor_phone || '').trim();
  const isAssiut = governorate.includes('أسيوط') || governorate.includes('اسيوط') || params.assiut === 'true' || params.assiut === true;
  
  const tier = pricingCatalog[tierKey] || pricingCatalog.professional;
  const unitPrice = isAssiut ? tier.assiutPrice : tier.price;
  const spec = SPECIALTY_PACKS[specialtyId] || SPECIALTY_PACKS.dental;
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const validUntil = new Date(now.getTime() + 15 * 86400 * 1000).toISOString().split('T')[0];
  
  const hash = crypto.createHash('sha256').update(`${doctorName}|${clinicName}|${unitPrice}|${dateStr}`).digest('hex').substring(0, 8).toUpperCase();
  const quotationNo = `QMA-QUO-${dateStr.replace(/-/g, '').substring(2, 6)}-${hash}`;

  return {
    quotationNo,
    dateStr,
    validUntil,
    doctorName,
    clinicName,
    specialty: spec.nameAr,
    specialtyIcon: spec.icon,
    tierKey,
    tierNameAr: tier.nameAr,
    maxDoctors: tier.maxDoctors,
    maxUsers: tier.maxUsers,
    unitPrice,
    isAssiut,
    originalPrice: tier.price,
    discountAmount: isAssiut ? (tier.price - tier.assiutPrice) : 0,
    distributorName,
    distributorCode,
    distributorPhone,
    features: [
      `ترخيص دائم مدى الحياة (بدون أي اشتراكات شهرية أو سنوية إجبارية نهائياً)`,
      `تثبيت وتشغيل أوفلاين 100% داخل العيادة دون الحاجة للإنترنت مطلقاً`,
      `تضمين حزمة ${spec.nameAr} بكامل الأدوية والإجراءات (${(spec.stats && spec.stats.drugsCount) || 20} دواء + ${(spec.stats && spec.stats.servicesCount) || 20} إجراء طبي جاهز)`,
      `ربط أجهزة العيادة وموبايل الطبيب والسكرتيرة عبر شبكة Wi-Fi الداخلية بدون كابلات`,
      `تشفير جنائي عسكري لكافة بيانات وسجلات المرضى (AES-256 GCM)`,
      `جلسة تدريب عملي فورية للسكرتارية والطاقم الطبي حتى إتقان العمل بالكامل`,
      `ضمان استقرار فني كامل ودعم مباشر لمدة 12 شهراً`
    ]
  };
}

function generateQuotationHtml(quo) {
  const qrSvg = generateSimpleSvgQr(`QALIX-QUO:${quo.quotationNo}|VAL:${quo.unitPrice}EGP|DIST:${quo.distributorCode || 'DIST'}`);
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>عرض سعر رسمي معتمد — ${quo.quotationNo} — منظومة كالكس ميديكال</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif; }
    body { background: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; font-size: 13.5px; line-height: 1.5; }
    .page-container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); padding: 32px 40px; position: relative; }
    
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #0f766e; margin: 0 0 4px 0; }
    .brand-sub { font-size: 12px; color: #475569; margin: 0; }
    .agent-contact { text-align: left; font-size: 11.5px; color: #334155; line-height: 1.4; }
    .agent-contact strong { color: #0f766e; font-size: 13px; }
    
    .doc-headline { text-align: center; margin: 15px 0 20px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; padding: 10px; }
    .doc-headline h1 { margin: 0; font-size: 18px; color: #115e59; font-weight: 800; }
    .doc-headline .meta { font-size: 11.5px; color: #475569; margin-top: 4px; }

    .client-card { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
    .client-card div strong { color: #0f766e; margin-left: 6px; }

    .table-box { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table-box th { background: #0f766e; color: #ffffff; padding: 10px 12px; font-size: 12.5px; text-align: right; border: 1px solid #0f766e; }
    .table-box td { padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 13px; vertical-align: middle; }
    .table-box tr:nth-child(even) { background: #f8fafc; }
    .price-cell { text-align: left; font-weight: 800; font-size: 15px; color: #0f766e; font-family: monospace; }
    .strike-price { text-decoration: line-through; color: #94a3b8; font-size: 12px; margin-left: 6px; }
    
    .features-list { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .features-list h4 { margin: 0 0 10px 0; color: #166534; font-size: 13.5px; }
    .features-list ul { margin: 0; padding-right: 20px; }
    .features-list li { margin-bottom: 5px; color: #14532d; font-size: 12.5px; }

    .terms-box { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 20px; font-size: 11.5px; color: #64748b; line-height: 1.6; }
    .terms-box strong { color: #334155; }

    .footer-signatures { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; margin-top: 25px; border-top: 2px dashed #cbd5e1; padding-top: 16px; }
    .sig-col { text-align: center; font-size: 12px; color: #475569; }
    .sig-col .line { margin-top: 45px; border-top: 1px solid #94a3b8; width: 80%; margin-left: auto; margin-right: auto; }
    
    .actions-bar { margin-top: 20px; text-align: center; }
    .btn { display: inline-block; background: #0f766e; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; cursor: pointer; border: none; font-size: 14px; box-shadow: 0 2px 6px rgba(15,118,110,0.3); }
    .btn:hover { background: #0d9488; }
    
    @media print {
      body { background: #ffffff; padding: 0; font-size: 12px; }
      .page-container { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
      .actions-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div>
        <h2 class="brand-title">منظومة كالكس ميديكال الطبية — Qalix Medical</h2>
        <p class="brand-sub">إدارة العيادات والمراكز الطبية التخصصية · Air-Gapped Fortress 100%</p>
      </div>
      <div class="agent-contact">
        <strong>الموزع المعتمد لمنظومة كالكس</strong><br>
        ${quo.distributorName ? `<span>${quo.distributorName}${quo.distributorCode ? ' (' + quo.distributorCode + ')' : ''}</span><br>` : ''}
        ${quo.distributorPhone ? `هاتف / واتساب: <strong dir="ltr">${quo.distributorPhone}</strong>` : 'التوريد والدعم الفني عبر الموزع المعتمد'}
      </div>
    </div>

    <div class="doc-headline">
      <h1>عــرض ســعـر وتـوريــد رســمـي مـعـتـمـد</h1>
      <div class="meta">
        رقم العرض: <strong>${quo.quotationNo}</strong> &nbsp;|&nbsp;
        تاريخ الإصدار: <strong>${quo.dateStr}</strong> &nbsp;|&nbsp;
        صالح حتى: <strong>${quo.validUntil}</strong> (لمدة 15 يوماً)
      </div>
    </div>

    <div class="client-card">
      <div><strong>الموجه إلى:</strong> د. ${quo.doctorName}</div>
      <div><strong>اسم المركز / العيادة:</strong> ${quo.clinicName}</div>
      <div><strong>التخصص الطبي:</strong> ${quo.specialtyIcon} ${quo.specialty}</div>
      <div><strong>النطاق الجغرافي:</strong> ${quo.isAssiut ? 'محافظة أسيوط (خاضع لدعم الصعيد 40%)' : 'جمهورية مصر العربية'}</div>
    </div>

    <table class="table-box">
      <thead>
        <tr>
          <th>بيان الباقة والتجهيزات البرمجية</th>
          <th style="width: 120px; text-align: center;">السعة المعتمدة</th>
          <th style="width: 160px; text-align: left;">القيمة الاستثمارية</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${quo.tierNameAr}</strong><br>
            <span style="font-size: 11.5px; color: #64748b;">
              نسخة أوفلاين دائمة مدى الحياة بكامل الصلاحيات + محرك التشغيل + قاعدة بيانات مشفرة جنائياً
            </span>
          </td>
          <td style="text-align: center;">
            ${quo.maxDoctors === 99 ? 'غير محدود' : quo.maxDoctors + ' أطباء'}<br>
            <span style="font-size: 11px; color: #64748b;">${quo.maxUsers === 99 ? 'غير محدود' : quo.maxUsers + ' مستخدمين'}</span>
          </td>
          <td class="price-cell">
            ${quo.isAssiut ? `<span class="strike-price">${quo.originalPrice.toLocaleString('en-US')} ج.م</span>` : ''}
            <span>${quo.unitPrice.toLocaleString('en-US')} ج.م</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="features-list">
      <h4>المزايا والخدمات التنفيذية المشمولة بالعرض:</h4>
      <ul>
        ${quo.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>

    <div class="terms-box">
      <strong>شروط التوريد والتعاقد:</strong><br>
      1. السعر شامل التثبيت الكامل، ربط الشبكة الداخلية Wi-Fi، وتدريب طاقم السكرتارية دون أي رسوم إضافية.<br>
      2. لا توجد أي اشتراكات دورية أو شهرية إطلاقاً (استثمار دائم لمرة واحدة مدى الحياة).<br>
      3. السداد يتم دفعة واحدة عند استلام العيادة وتوقيع محضر التسليم والتشغيل المعتمد.<br>
      4. صلاحية هذا العرض سارية لمدة 15 يوماً من تاريخ صدوره، ويصبح لاغياً بعد ذلك ما لم يتم تثبيته كتابياً.
    </div>

    <div class="footer-signatures">
      <div class="sig-col">
        <strong>اعتماد وتوقيع الموزع المعتمد</strong>
        <p style="margin: 2px 0; font-size: 11px;">${quo.distributorName ? (quo.distributorName + (quo.distributorCode ? ' (' + quo.distributorCode + ')' : '')) : 'الموزع المعتمد'}${quo.distributorPhone ? ' — ' + quo.distributorPhone : ''}</p>
        <div class="line"></div>
      </div>
      <div style="text-align: center;">
        ${qrSvg}
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">رمز التحقق الرسمي</div>
      </div>
      <div class="sig-col">
        <strong>موافقة الطبيب / إدارة العيادة</strong>
        <p style="margin: 2px 0; font-size: 11px;">د. ${quo.doctorName}</p>
        <div class="line"></div>
      </div>
    </div>

    <div class="actions-bar">
      <button class="btn" onclick="window.print()">🖨️ طباعة عرض السعر / حفظ كملف PDF</button>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateQuotationData,
  generateQuotationHtml
};

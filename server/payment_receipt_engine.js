/* Official Payment Receipt & Commission Clearance Engine (Phase 9)
 * Official printable A4 receipt vouchers for clinic transactions & distributor commission payouts.
 * 100% Offline Air-Gapped · Zero External Dependencies · Agent: 01122166076 / 01122166704
 */
'use strict';

const crypto = require('crypto');

const PAYMENT_CHANNELS = {
  instapay: { id: 'instapay', nameAr: 'إنستاباي (InstaPay IPN)', icon: '⚡', reqRef: true, desc: 'تحويل فوري لحظي لحساب الوكيل المعتمد' },
  vodafone_cash: { id: 'vodafone_cash', nameAr: 'فودافون كاش (Vodafone Cash)', icon: '📱', reqRef: true, desc: 'محفظة إلكترونية معتمدة' },
  bank_wire: { id: 'bank_wire', nameAr: 'تحويل بنكي رسمي (Bank Wire)', icon: '🏛️', reqRef: true, desc: 'حساب بنكي تجاري (البنك الأهلي / CIB / بنك مصر)' },
  cash_handover: { id: 'cash_handover', nameAr: 'نقداً بتوريد مباشر (Official Cash)', icon: '💵', reqRef: false, desc: 'تسليم نقدي مباشر مع محضر التسليم' }
};

function generateReceiptHtml(receiptData, agentInfo) {
  const d = receiptData;
  const qrSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#ffffff" rx="6"/>
    <path d="M10 10 h25 v25 h-25 z M15 15 h15 v15 h-15 z M65 10 h25 v25 h-25 z M70 15 h15 v15 h-15 z M10 65 h25 v25 h-25 z M15 70 h15 v15 h-15 z M45 20 h10 v10 h-10 z M45 45 h10 v10 h-10 z M20 45 h10 v10 h-10 z M65 65 h10 v10 h-10 z M80 45 h10 v20 h-10 z M45 70 h20 v10 h-20 z M70 80 h20 v10 h-20 z" fill="#0f172a"/>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>سند قبض رسمي معتمد | ${d.receiptNo}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: #e2e8f0; color: #0f172a; padding: 20px; font-size: 13px; line-height: 1.6; }
  .paper { background: #fff; max-width: 800px; margin: auto; padding: 32px 36px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); position: relative; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
  .logo-title h1 { font-size: 21px; color: #0f172a; margin-bottom: 4px; }
  .logo-title p { font-size: 12px; color: #475569; }
  .meta { text-align: left; }
  .badge-rec { background: #0ea5e9; color: #fff; padding: 3px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 4px; }
  .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
  .card-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
  .card-box h3 { font-size: 13px; color: #0369a1; margin-bottom: 6px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
  table.details { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.details th, table.details td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
  table.details th { background: #0f172a; color: #fff; font-size: 12.5px; }
  .highlight-sum { background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
  .sign-box { border: 1px solid #94a3b8; border-radius: 8px; padding: 14px; min-height: 90px; }
  .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  .btn-print { background: #0284c7; color: white; border: none; padding: 9px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; display: block; margin: 0 auto 16px; font-size: 14px; }
  @media print { body { background: #fff; padding: 0; } .paper { box-shadow: none; max-width: 100%; margin: 0; padding: 10mm; } .btn-print { display: none; } }
</style>
</head>
<body>
<button class="btn-print" onclick="window.print()">🖨️ طباعة سند القبض الرسمي (A4)</button>
<div class="paper">
  <div class="header">
    <div class="logo-title">
      <h1>سند قبض وتوريد مالي رسمي</h1>
      <p>منظومة كالكس الطبية الشاملة (Qalix Medical Universal OS) — مكتب الوكيل المعتمد</p>
    </div>
    <div class="meta">
      <span class="badge-rec">رقم السند: ${d.receiptNo}</span>
      <div style="font-size:11.5px; color:#475569;">التاريخ: <b>${d.receiptDate}</b></div>
    </div>
  </div>

  <div class="grid-info">
    <div class="card-box">
      <h3>بيانات المنشأة الطبية (العميل)</h3>
      <div>العيادة / المركز: <b>${d.clinicName}</b></div>
      <div>الطبيب المسؤول: <b>${d.doctorName}</b></div>
      <div>المدينة / المحافظة: <b>${d.city} (${d.governorate})</b></div>
      <div>هاتف التواصل: <b dir="ltr">${d.clinicPhone}</b></div>
    </div>
    <div class="card-box">
      <h3>بيانات المعاملة والترخيص</h3>
      <div>الباقة المشتراة: <b>${d.tierNameAr} (ترخيص دائم مدى الحياة)</b></div>
      <div>الموزع المعتمد: <b>${d.distributorName} (${d.distributorCode})</b></div>
      <div>قناة السداد: <b>${d.channelNameAr}</b></div>
      <div>رقم المعاملة المرجعي: <b dir="ltr" style="color:#0284c7;">${d.referenceId || 'سداد نقدي مباشر'}</b></div>
    </div>
  </div>

  <table class="details">
    <thead>
      <tr>
        <th>بيان العملية</th>
        <th>السعر الرسمي الثابت</th>
        <th>الخصم المعتمد</th>
        <th>المبلغ المسدد فعلياً</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <b>ترخيص دائم لمنظومة كالكس الطبية — ${d.tierNameAr}</b>
          <div style="font-size:11px; color:#64748b;">شامل التثبيت والتدريب وضمان الاستقرار الفني لمدة 12 شهراً مجاناً</div>
        </td>
        <td>${d.standardPrice.toLocaleString('en-US')} ج.م</td>
        <td style="color:${d.isAssiut ? '#dc2626' : '#64748b'}; font-weight:bold;">
          ${d.isAssiut ? 'خصم 40% (دعم أسيوط)' : 'سعر رسمي'}
        </td>
        <td style="font-size:15px; font-weight:bold; color:#15803d;">
          ${d.amountPaid.toLocaleString('en-US')} ج.م
        </td>
      </tr>
    </tbody>
  </table>

  <div class="highlight-sum">
    <div>
      <div style="font-size:12px; color:#475569;">المبلغ المستلم بالحروف:</div>
      <b style="font-size:14px; color:#166534;">فقط ${d.amountPaidInWords} جنيهاً مصرياً لا غير.</b>
    </div>
    <div style="text-align:left;">
      <div style="font-size:12px; color:#475569;">حالة المعاملة:</div>
      <b style="color:#16a34a; font-size:14px;">✔ تم التحصيل والاعتماد</b>
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:18px;">
    <div>
      <div style="font-size:11.5px; color:#475569;">بصمة التوثيق الجنائية لسند القبض (SHA-256):</div>
      <code style="font-size:10.5px; color:#0284c7; word-break:break-all;">${d.sha256}</code>
    </div>
    <div>${qrSvg}</div>
  </div>

  <div class="signatures">
    <div class="sign-box">
      <div style="font-weight:bold; margin-bottom:30px;">توقيع وخاتم وكيل المنظومة المعتمد:</div>
      <div style="font-size:11px; color:#64748b;">مكتب وكيل منظومة كالكس الطبية (01122166076 / 01122166704)</div>
    </div>
    <div class="sign-box">
      <div style="font-weight:bold; margin-bottom:30px;">توقيع مستلم الخدمة / الطبيب المسؤول:</div>
      <div style="font-size:11px; color:#64748b;">أقر بسداد المبلغ المذكور أعلاه واستلام الترخيص والمنظومة</div>
    </div>
  </div>

  <div class="footer">
    صدر هذا السند إلكترونياً من منصة كالكس الطبية — خط المبيعات: 01122166704 | خط الوكيل والدعم الفني: 01122166076
  </div>
</div>
</body>
</html>`;
}

module.exports = {
  PAYMENT_CHANNELS,
  generateReceiptHtml
};

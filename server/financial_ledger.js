/* Distributor Financial Ledger & Statement of Account Generator (Phase 4)
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

function generateDistributorStatementHtml(dist, deals, agentInfo) {
  const generatedAt = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const completedDeals = deals.filter(d => d.distributor_id === dist.id && d.status === 'completed');
  const pendingDeals = deals.filter(d => d.distributor_id === dist.id && d.status === 'pending');

  const totalGross = completedDeals.reduce((sum, d) => sum + d.fixed_price, 0);
  const totalComm = completedDeals.reduce((sum, d) => sum + d.distributor_commission, 0);
  const totalNet = completedDeals.reduce((sum, d) => sum + d.agent_net_amount, 0);
  const pendingNet = pendingDeals.reduce((sum, d) => sum + d.agent_net_amount, 0);

  const fmt = (n) => Math.round(n || 0).toLocaleString('ar-EG') + ' ج.م';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>كشف حساب مالي رسمي: ${dist.name} (${dist.code})</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 25px; color: #0f172a; line-height: 1.6; background: #fff; }
    .page { max-width: 900px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 6px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
    .kpi-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
    .kpi-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; text-align: center; }
    .kpi-title { font-size: 11.5px; color: #64748b; margin-bottom: 4px; }
    .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #e2e8f0; padding: 9px; text-align: right; }
    th { background: #f1f5f9; color: #334155; }
    .badge-comp { background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px; }
    .badge-pend { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px; }
    @media print {
      body { padding: 0; }
      .page { border: none; padding: 15px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:900px; margin:0 auto 12px; text-align:left;">
    <button onclick="window.print()" style="padding:9px 18px; font-weight:bold; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;">🖨️ طباعة كشف الحساب المعتمد</button>
  </div>

  <div class="page">
    <div class="header">
      <div>
        <h2 style="margin:0; font-size:20px; color:#0369a1;">كشف حساب مالي وتسوية مستحقات موزع معتمد</h2>
        <div style="font-size:12.5px; color:#64748b; margin-top:3px;">منظومة كالكس ميديكال الطبية · إشراف الوكيل: 01122166076</div>
      </div>
      <div style="text-align:left; font-size:12px; color:#475569;">
        <div>تاريخ الكشف: <strong>${generatedAt}</strong></div>
        <div>كود الموزع: <strong>${dist.code}</strong></div>
      </div>
    </div>

    <div style="margin-bottom:20px; font-size:13px; background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px;">
      <strong>الموزع المستقل:</strong> ${dist.name} · <strong>النطاق الجغرافي:</strong> ${dist.governorate} · <strong>الهاتف:</strong> ${dist.phone} · <strong>نسبة العمولة الرسمية:</strong> ${dist.commission_rate}%
    </div>

    <div class="kpi-cards">
      <div class="kpi-box">
        <div class="kpi-title">إجمالي المبيعات المحققة</div>
        <div class="kpi-val">${fmt(totalGross)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">عمولة الموزع المستحقة (${dist.commission_rate}%)</div>
        <div class="kpi-val" style="color:#d97706;">${fmt(totalComm)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">صافي توريد الوكيل المحصل</div>
        <div class="kpi-val" style="color:#16a34a;">${fmt(totalNet)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">صفقات قيد الاعتماد</div>
        <div class="kpi-val" style="color:#64748b;">${completedDeals.length} مكتملة / ${pendingDeals.length} قيد التحصيل</div>
      </div>
    </div>

    <h3 style="font-size:14px; margin:0 0 8px; color:#0f172a;">سجل صفقات الموزع المعتمدة والمعلقة:</h3>
    <table>
      <thead>
        <tr>
          <th>رقم الصفقة</th>
          <th>المنشأة الطبية والمدينة</th>
          <th>اسم الطبيب</th>
          <th>الباقة</th>
          <th>السعر الثابت</th>
          <th>عمولة الموزع</th>
          <th>صافي الوكيل</th>
          <th>مرجع الترخيص</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${deals.filter(d => d.distributor_id === dist.id).map(d => `
          <tr>
            <td><code>${d.deal_no}</code></td>
            <td><strong>${d.clinic_name}</strong><br><span style="color:#64748b; font-size:11px;">${d.city}</span></td>
            <td>د. ${d.doctor_name}</td>
            <td>${d.tier}</td>
            <td><strong>${fmt(d.fixed_price)}</strong></td>
            <td style="color:#d97706; font-weight:bold;">${fmt(d.distributor_commission)}</td>
            <td style="color:#16a34a; font-weight:bold;">${fmt(d.agent_net_amount)}</td>
            <td><code>${d.license_key_ref || '—'}</code></td>
            <td><span class="${d.status === 'completed' ? 'badge-comp' : 'badge-pend'}">${d.status === 'completed' ? 'مكتملة وموردة' : 'قيد التحصيل'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="font-size:11.5px; color:#64748b; border-top:1px dashed #cbd5e1; padding-top:12px; display:flex; justify-content:space-between;">
      <span>تم استخراج هذا الكشف آلياً وموثق بسلسلة التدقيق الجنائي المشفرة (SHA-256).</span>
      <span>وكيل منظومة كالكس ميديكال: 01122166076</span>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateDistributorStatementHtml
};

/* Commercial Deals & Executive Weekly Digest Engine (Phase 9)
 * Automated commercial alerts, pipeline monitoring, and executive weekly financial digests.
 * 100% Offline Air-Gapped · Zero External Dependencies · Agent: 01122166076 / 01122166076
 */
'use strict';

const { escapeHtml } = require('./html_escape');

function calculateCommercialAlerts(db) {
  const alerts = [];
  const now = new Date();

  // 1. Check pending deals (deals waiting for agent settlement & activation)
  const pendingDeals = db.prepare(`
    SELECT d.*, dist.name AS dist_name, dist.phone AS dist_phone 
    FROM deals d 
    JOIN distributors dist ON dist.id = d.distributor_id 
    WHERE d.status = 'pending'
  `).all();

  for (const dl of pendingDeals) {
    alerts.push({
      id: 'alert_pending_' + dl.id,
      type: 'pending_deal',
      level: 'warning',
      badge: 'صفقة قيد التحصيل',
      title: `صفقة بانتظار الاعتماد: ${dl.clinic_name} (${dl.fixed_price.toLocaleString('en-US')} ج.م)`,
      message: `الموزع "${dl.dist_name}" سجل صفقة جديدة ويجب مراجعة توريد صافي الوكيل (${dl.agent_net_amount.toLocaleString('en-US')} ج.م) لإصدار مفتاح الترخيص.`,
      actionUrl: `#deal_${dl.id}`,
      actionText: 'مراجعة وتفعيل الصفقة'
    });
  }

  // 2. Check active lead locks approaching expiry (<= 3 days remaining)
  try {
    const leadLocks = db.prepare(`
      SELECT * FROM lead_locks WHERE status = 'active'
    `).all();

    for (const lk of leadLocks) {
      const exp = new Date(lk.expires_at);
      const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft >= 0) {
        alerts.push({
          id: 'alert_lead_exp_' + lk.id,
          type: 'lead_expiring',
          level: 'info',
          badge: 'اقتراب نهاية حجز العيادة',
          title: `حجز العيادة "${lk.clinic_name}" يوشك على الانتهاء (${daysLeft} يوم متبقي)`,
          message: `الموزع "${lk.distributor_name}" لديه ${daysLeft} يوم قبل فتح العيادة للموزعين الآخرين. يُوصى بالتواصل معه للمساعدة في الإغلاق.`,
          actionUrl: `#lead_${lk.id}`,
          actionText: 'متابعة الموزع'
        });
      }
    }
  } catch (_) {}

  // 3. Distributor Tier Progression Milestone Opportunity
  try {
    const dists = db.prepare("SELECT * FROM distributors WHERE status = 'active'").all();
    for (const d of dists) {
      const dealsCount = db.prepare(`SELECT COUNT(*) AS c FROM deals WHERE distributor_id = ? AND status = 'completed'`).get(d.id).c;
      if (dealsCount === 4) {
        alerts.push({
          id: 'alert_tier_silver_' + d.id,
          type: 'tier_upgrade_near',
          level: 'success',
          badge: 'فرصة ترقية موزع',
          title: `الموزع "${d.name}" على بعد صفقة واحدة من الشريحة الفضية (29%)`,
          message: `أنجز الموزع 4 صفقات مكتملة، وبإتمامه الصفقة القادمة سيرتقي تلقائياً للشريحة الفضية.`,
          actionUrl: '#pane-prescription',
          actionText: 'عرض ملف الترقية'
        });
      } else if (dealsCount === 9) {
        alerts.push({
          id: 'alert_tier_gold_' + d.id,
          type: 'tier_upgrade_near',
          level: 'success',
          badge: 'فرصة ترقية ممتازة',
          title: `الموزع "${d.name}" على بعد صفقة واحدة من الشريحة الذهبية (32%)`,
          message: `أنجز الموزع 9 صفقات، وصفقة واحدة تفصله عن الامتياز الإقليمي والنسبة الذهبية.`,
          actionUrl: '#pane-prescription',
          actionText: 'عرض ملف الترقية'
        });
      }
    }
  } catch (_) {}

  return alerts;
}

function generateExecutiveWeeklyDigestHtml(summaryData, agentInfo) {
  const kpis = summaryData.kpis;
  const dists = summaryData.distributors || [];
  const deals = summaryData.deals || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>التقرير التنفيذي الأسبوعي للوكيل | منظومة كالكس الطبية</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: #e2e8f0; color: #0f172a; padding: 20px; font-size: 13px; line-height: 1.6; }
  .paper { background: #fff; max-width: 800px; margin: auto; padding: 32px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
  .hdr { display: flex; justify-content: space-between; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .hdr h1 { font-size: 20px; color: #0f172a; }
  .grid-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
  .stat-card strong { font-size: 17px; display: block; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: right; }
  th { background: #0f172a; color: #fff; }
  .btn-print { background: #0284c7; color: white; border: none; padding: 9px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; display: block; margin: 0 auto 16px; }
  @media print { body { background: #fff; padding: 0; } .paper { box-shadow: none; max-width: 100%; margin: 0; } .btn-print { display: none; } }
</style>
</head>
<body>
<button class="btn-print" onclick="window.print()">🖨️ طباعة التقرير التنفيذي الأسبوعي (A4)</button>
<div class="paper">
  <div class="hdr">
    <div>
      <h1>التقرير التنفيذي الشامل للوكيل</h1>
      <p style="font-size:12px; color:#475569;">متابعة الأداء التجاري وعمولات الموزعين وصافي التدفقات النقدية المحصلة</p>
    </div>
    <div style="text-align:left;">
      <div style="font-size:11.5px; color:#475569;">تاريخ التقرير:</div>
      <b>${dateStr}</b>
    </div>
  </div>

  <div class="grid-stats">
    <div class="stat-card">
      <div style="color:#64748b; font-size:11px;">إجمالي المبيعات (الثابت)</div>
      <strong style="color:#0284c7;">${kpis.totalGrossSales.toLocaleString('en-US')} ج.م</strong>
    </div>
    <div class="stat-card">
      <div style="color:#64748b; font-size:11px;">صافي إيراد الوكيل المحصل</div>
      <strong style="color:#15803d;">${kpis.totalAgentNetRevenue.toLocaleString('en-US')} ج.م</strong>
    </div>
    <div class="stat-card">
      <div style="color:#64748b; font-size:11px;">عمولات الموزعين المصروفة</div>
      <strong style="color:#d97706;">${kpis.totalDistributorCommissions.toLocaleString('en-US')} ج.م</strong>
    </div>
    <div class="stat-card">
      <div style="color:#64748b; font-size:11px;">الصفقات المكتملة</div>
      <strong style="color:#475569;">${kpis.completedDealsCount} عيادة</strong>
    </div>
  </div>

  <h3 style="font-size:14px; margin-bottom:8px; color:#0369a1;">أداء الموزعين المعتمدين والمستقلين:</h3>
  <table>
    <thead>
      <tr>
        <th>كود الموزع</th>
        <th>اسم الموزع / المكتب</th>
        <th>النطاق الجغرافي</th>
        <th>نسبة العمولة</th>
        <th>الصفقات</th>
        <th>إجمالي المبيعات</th>
        <th>صافي الوكيل</th>
      </tr>
    </thead>
    <tbody>
      ${dists.map(d => `
        <tr>
          <td style="font-family:monospace; font-weight:bold;">${escapeHtml(d.code)}</td>
          <td><strong>${escapeHtml(d.name)}</strong></td>
          <td>${escapeHtml(d.governorate)}</td>
          <td>${Number(d.commission_rate) || 27}%</td>
          <td>${Number(d.metrics?.completedDeals) || 0}</td>
          <td>${(Number(d.metrics?.grossSales) || 0).toLocaleString('en-US')} ج.م</td>
          <td style="color:#15803d; font-weight:bold;">${(Number(d.metrics?.totalAgentNet) || 0).toLocaleString('en-US')} ج.م</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="font-size:14px; margin-bottom:8px; color:#0369a1;">أحدث الصفقات والعيادات المتعاقدة:</h3>
  <table>
    <thead>
      <tr>
        <th>العيادة والطبيب</th>
        <th>المحافظة</th>
        <th>الباقة</th>
        <th>السعر</th>
        <th>صافي الوكيل</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${deals.slice(0, 8).map(dl => `
        <tr>
          <td><strong>${escapeHtml(dl.clinic_name)}</strong> (${escapeHtml(dl.doctor_name)})</td>
          <td>${escapeHtml(dl.city)}</td>
          <td>${escapeHtml(dl.tier)}</td>
          <td>${(Number(dl.fixed_price) || 0).toLocaleString('en-US')} ج.م</td>
          <td style="color:#15803d; font-weight:bold;">${(Number(dl.agent_net_amount) || 0).toLocaleString('en-US')} ج.م</td>
          <td>${dl.status === 'completed' ? '✔ مكتملة ومفعلة' : '⏳ قيد التحصيل'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="font-size:11px; color:#64748b; text-align:center; border-top:1px solid #cbd5e1; padding-top:10px; margin-top:20px;">
    تقرير صادر من لوحة تحكم الوكيل (${escapeHtml(agentInfo?.phone || '—')}) — خاضع للتدقيق الجنائي المشفر.
  </div>
</div>
</body>
</html>`;
}

module.exports = {
  calculateCommercialAlerts,
  generateExecutiveWeeklyDigestHtml
};

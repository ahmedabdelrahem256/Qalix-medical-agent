/* Qalix Medical Agent — Distributor Tier Progression & Regional Franchise Engine (Phase 7)
 * 100% Offline Air-Gapped · Zero External Dependencies · A4 Tier Upgrade Promotion Letter
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const crypto = require('node:crypto');
const { generateSimpleSvgQr } = require('./network_diagnostics');
const { escapeHtml } = require('./html_escape');

const COMMISSION_TIERS = {
  bronze: {
    id: 'bronze',
    nameAr: 'موزع معتمد برونزي (Bronze)',
    badgeColor: '#cd7f32',
    minDeals: 0,
    maxDeals: 4,
    commissionRate: 27,
    perks: ['عمولة افتتاحية 27%', 'بوابة موزع مستقلة كاملة', 'الأسعار الرسمية الثابتة', 'دعم فني مباشر على مدار الساعة']
  },
  silver: {
    id: 'silver',
    nameAr: 'موزع إقليمي فضي (Silver)',
    badgeColor: '#94a3b8',
    minDeals: 5,
    maxDeals: 9,
    commissionRate: 29,
    perks: ['عمولة ترقية 29% (+2% إضافية)', 'حزمة مطبوعات تسويقية مجانية A4', 'شهادة اعتماد وتوصية رسمية']
  },
  gold: {
    id: 'gold',
    nameAr: 'وكيل معتمد ذهبي (Gold Master)',
    badgeColor: '#f59e0b',
    minDeals: 10,
    maxDeals: 19,
    commissionRate: 32,
    perks: ['عمولة مميزة 32% (+5% إضافية)', 'أولوية توجيه صفقات المحافظة الواردة للوكيل', 'درع التميز السنوي']
  },
  platinum: {
    id: 'platinum',
    nameAr: 'امتياز إقليمي حصري بلاتيني (Platinum Franchise)',
    badgeColor: '#38bdf8',
    minDeals: 20,
    maxDeals: 9999,
    commissionRate: 35,
    perks: ['عمولة قصوى 35% (+8% إضافية)', 'حماية حصرية للنطاق الجغرافي', 'مكافأة سنوية إضافية على حجم المبيعات']
  }
};

function calculateDistributorTier(dealsCount) {
  const count = Number(dealsCount) || 0;
  if (count >= 20) return { current: COMMISSION_TIERS.platinum, next: null, dealsNeededForNext: 0 };
  if (count >= 10) return { current: COMMISSION_TIERS.gold, next: COMMISSION_TIERS.platinum, dealsNeededForNext: 20 - count };
  if (count >= 5)  return { current: COMMISSION_TIERS.silver, next: COMMISSION_TIERS.gold, dealsNeededForNext: 10 - count };
  return { current: COMMISSION_TIERS.bronze, next: COMMISSION_TIERS.silver, dealsNeededForNext: 5 - count };
}

function getDistributorHierarchyProfile(distributor, deals) {
  const completedDeals = deals.filter(d => d.distributor_id === distributor.id && d.status === 'completed');
  const count = completedDeals.length;
  const grossSales = completedDeals.reduce((sum, d) => sum + (Number(d.fixed_price) || 0), 0);
  const totalComm = completedDeals.reduce((sum, d) => sum + (Number(d.distributor_commission) || 0), 0);

  const tierInfo = calculateDistributorTier(count);

  return {
    distributorId: distributor.id,
    code: distributor.code,
    name: distributor.name,
    governorate: distributor.governorate,
    currentTier: tierInfo.current,
    nextTier: tierInfo.next,
    completedDealsCount: count,
    grossSales,
    totalCommissionEarned: totalComm,
    dealsNeededForNext: tierInfo.dealsNeededForNext,
    unlockedPerks: tierInfo.current.perks
  };
}

function generateTierPromotionLetterHtml(profile, agentInfo) {
  const dateStr = new Date().toISOString().split('T')[0];
  const refNo = `QMA-TIER-${dateStr.replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const qrSvg = generateSimpleSvgQr(`TIER:${profile.currentTier.id}|DIST:${profile.code}|NAME:${profile.name}|AGENT:01122166076`);
  const safeName = escapeHtml(profile.name);
  const safeCode = escapeHtml(profile.code);
  const safeGov = escapeHtml(profile.governorate);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>خطاب ترقية واعتماد شريحة التميز — ${safeName} (${safeCode})</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif; }
    body { background: #f8fafc; color: #0f172a; margin: 0; padding: 25px; font-size: 13.5px; line-height: 1.6; }
    .page-container { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 36px 44px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #0f766e; margin: 0 0 4px; }
    .doc-headline { text-align: center; margin: 16px 0 24px; background: #f0fdfa; border: 1px dashed #0d9488; border-radius: 8px; padding: 12px; }
    .doc-headline h1 { margin: 0; font-size: 18px; color: #115e59; }
    .tier-badge-box { text-align: center; margin: 20px 0; }
    .tier-pill { display: inline-block; padding: 8px 24px; border-radius: 999px; font-size: 16px; font-weight: 800; color: #fff; background: ${profile.currentTier.badgeColor}; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
    .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .perks-list { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .perks-list h4 { margin: 0 0 10px; color: #0f766e; font-size: 14px; }
    .sig-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; margin-top: 35px; border-top: 1.5px dashed #cbd5e1; padding-top: 18px; }
    .sig-col { text-align: center; font-size: 12px; color: #475569; }
    .sig-col .line { margin-top: 45px; border-top: 1px solid #94a3b8; width: 75%; margin-left: auto; margin-right: auto; }
    .btn { background: #0f766e; color: #fff; padding: 10px 24px; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; }
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
        <p style="margin:0; font-size:12px; color:#64748b;">إدارة شبكة التوزيع الإقليمي والامتياز التجاري المعتمد</p>
      </div>
      <div style="text-align:left; font-size:12px; color:#334155;">
        <strong>وكيل المنظومة الرسمي</strong><br>
        هاتف / واتساب: <strong>01122166076</strong>
      </div>
    </div>

    <div class="doc-headline">
      <h1>خــطـاب تـرقــيـة واعــتـمـاد شــريـحـة الـتـمـيـز الـتـجـاري</h1>
      <div style="font-size:11.5px; color:#64748b; margin-top:4px;">
        الرقم المرجعي: <strong>${refNo}</strong> &nbsp;|&nbsp; التاريخ: <strong>${dateStr}</strong>
      </div>
    </div>

    <p>
      بناءً على الأداء الميداني المتميز والالتزام الصارم بقواعد حماية الأسعار الثابتة لمنظومة كالكس ميديكال الطبية، يسر إدارة الوكيل العام اعتماد ترقية الموزع المعتمد:
    </p>

    <div class="tier-badge-box">
      <div style="font-size:18px; font-weight:bold; margin-bottom:8px; color:#0f766e;">${safeName} (${safeCode})</div>
      <span class="tier-pill">${profile.currentTier.nameAr}</span>
    </div>

    <table class="meta-table">
      <tr><td><strong>النطاق الجغرافي المعتمد:</strong></td><td>${safeGov}</td></tr>
      <tr><td><strong>نسبة العمولة المعتمدة الجديدة:</strong></td><td style="color:#0f766e; font-weight:bold; font-size:15px;">${profile.currentTier.commissionRate}% من سعر البيع الثابت</td></tr>
      <tr><td><strong>عدد الصفقات المكتملة المسجلة:</strong></td><td>${profile.completedDealsCount} عيادة ومركز طبي</td></tr>
      <tr><td><strong>إجمالي المبيعات المحققة بالسعر الثابت:</strong></td><td style="font-weight:bold;">${profile.grossSales.toLocaleString('en-US')} ج.م</td></tr>
      <tr><td><strong>إجمالي العمولات المستحقة والمصروفة:</strong></td><td style="color:#f59e0b; font-weight:bold;">${profile.totalCommissionEarned.toLocaleString('en-US')} ج.م</td></tr>
    </table>

    <div class="perks-list">
      <h4>المزايا والحوافز التشغيلية الممنوحة لهذه الشريحة:</h4>
      <ul>
        ${profile.unlockedPerks.map(p => `<li><strong>${p}</strong></li>`).join('')}
      </ul>
      ${profile.nextTier ? `<div style="margin-top:10px; font-size:12px; color:#0f766e;">⚡ متبقي فقط <strong>${profile.dealsNeededForNext} صفقات</strong> للترقية إلى شريحة <strong>${profile.nextTier.nameAr}</strong>.</div>` : '<div style="margin-top:10px; font-size:12px; color:#0f766e;">🌟 تهانينا! لقد بلغت أعلى شريحة تميز وتتمتع بالامتياز الإقليمي الحصري.</div>'}
    </div>

    <div class="sig-grid">
      <div class="sig-col">
        <strong>الموزع المعتمد / الشريك الإقليمي</strong>
        <p style="margin:2px 0; font-size:11px;">${safeName}</p>
        <div class="line"></div>
      </div>
      <div style="text-align:center;">
        ${qrSvg}
        <div style="font-size:9.5px; color:#64748b;">التحقق الرسمي المشفر</div>
      </div>
      <div class="sig-col">
        <strong>اعتماد وكيل المنظومة الرسمي</strong>
        <p style="margin:2px 0; font-size:11px; font-weight:bold; color:#0f766e;">01122166076</p>
        <div class="line"></div>
      </div>
    </div>

    <div class="actions" style="text-align:center; margin-top:20px;">
      <button class="btn" onclick="window.print()">🖨️ طباعة خطاب الترقية الرسمي (A4)</button>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  COMMISSION_TIERS,
  calculateDistributorTier,
  getDistributorHierarchyProfile,
  generateTierPromotionLetterHtml
};

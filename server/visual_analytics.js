/* Qalix Medical Agent — Pure Zero-Dependency SVG Data Visualization Engine (Phase 6)
 * 100% Offline Air-Gapped · Zero External Dependencies · Responsive SVG Charts
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

function generateSalesByTierBarChart(deals) {
  const counts = { basic: 0, professional: 0, enterprise: 0 };
  const revenue = { basic: 0, professional: 0, enterprise: 0 };

  for (const d of deals) {
    const t = d.package_tier || d.tier || 'professional';
    if (counts[t] !== undefined) {
      counts[t]++;
      revenue[t] += Number(d.fixed_price) || 0;
    }
  }

  const maxRev = Math.max(1, revenue.basic, revenue.professional, revenue.enterprise);
  const tiers = [
    { key: 'basic', label: 'الأساسية', color: '#38bdf8', count: counts.basic, rev: revenue.basic },
    { key: 'professional', label: 'التخصصية', color: '#10b981', count: counts.professional, rev: revenue.professional },
    { key: 'enterprise', label: 'المراكز الكبرى', color: '#a855f7', count: counts.enterprise, rev: revenue.enterprise }
  ];

  const barHeight = 28;
  const gap = 20;
  const totalHeight = tiers.length * (barHeight + gap) + 50;
  const chartWidth = 500;
  const maxBarWidth = 280;

  const bars = tiers.map((t, idx) => {
    const y = 35 + idx * (barHeight + gap);
    const barWidth = Math.max(10, Math.round((t.rev / maxRev) * maxBarWidth));
    return `
      <g>
        <text x="140" y="${y + 19}" fill="#94a3b8" font-size="12.5" font-weight="bold" text-anchor="end">${t.label} (${t.count})</text>
        <rect x="150" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${t.color}" opacity="0.9">
          <title>${t.label}: ${t.rev.toLocaleString('en-US')} ج.م (${t.count} صفقات)</title>
        </rect>
        <text x="${160 + barWidth}" y="${y + 19}" fill="#f8fafc" font-size="12" font-weight="bold">${t.rev.toLocaleString('en-US')} ج.م</text>
      </g>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${chartWidth} ${totalHeight}" width="100%" height="${totalHeight}" style="background:rgba(15,23,42,0.6); border-radius:12px; font-family:-apple-system, Cairo, sans-serif;">
      <text x="250" y="22" fill="#38bdf8" font-size="13.5" font-weight="bold" text-anchor="middle">توزيع الإيرادات المحققة حسب الباقات الطبية</text>
      ${bars}
    </svg>
  `;
}

function generateGeographicDonutChart(deals) {
  let assiutCount = 0;
  let otherCount = 0;
  let assiutRev = 0;
  let otherRev = 0;

  for (const d of deals) {
    const isAssiut = d.is_assiut === 1 || d.is_assiut === true || (d.city && (d.city.includes('أسيوط') || d.city.includes('اسيوط')));
    const price = Number(d.fixed_price) || 0;
    if (isAssiut) {
      assiutCount++;
      assiutRev += price;
    } else {
      otherCount++;
      otherRev += price;
    }
  }

  const total = assiutRev + otherRev;
  const assiutPct = total > 0 ? Math.round((assiutRev / total) * 100) : 50;
  const otherPct = 100 - assiutPct;

  // Circumference of radius 54 is ~339.29
  const C = 339.29;
  const assiutDash = (assiutPct / 100) * C;
  const otherDash = C - assiutDash;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 180" width="100%" height="180" style="background:rgba(15,23,42,0.6); border-radius:12px; font-family:-apple-system, Cairo, sans-serif;">
      <text x="190" y="22" fill="#10b981" font-size="13.5" font-weight="bold" text-anchor="middle">التوزيع الجغرافي (أسيوط والصعيد 40% مقابل باقي المحافظات)</text>
      
      <!-- Donut Circle -->
      <g transform="translate(90, 100)">
        <circle cx="0" cy="0" r="54" fill="none" stroke="#1e293b" stroke-width="24" />
        <circle cx="0" cy="0" r="54" fill="none" stroke="#f59e0b" stroke-width="24"
                stroke-dasharray="${assiutDash} ${C}" stroke-dashoffset="0" transform="rotate(-90)" />
        <circle cx="0" cy="0" r="54" fill="none" stroke="#0ea5e9" stroke-width="24"
                stroke-dasharray="${otherDash} ${C}" stroke-dashoffset="-${assiutDash}" transform="rotate(-90)" />
        <text x="0" y="5" fill="#f8fafc" font-size="14" font-weight="800" text-anchor="middle">${total.toLocaleString('en-US')}</text>
        <text x="0" y="18" fill="#94a3b8" font-size="9" text-anchor="middle">ج.م</text>
      </g>

      <!-- Legend -->
      <g transform="translate(200, 70)">
        <rect x="0" y="0" width="14" height="14" rx="3" fill="#f59e0b" />
        <text x="22" y="12" fill="#f8fafc" font-size="12" font-weight="bold">أسيوط والصعيد (${assiutPct}%)</text>
        <text x="22" y="28" fill="#94a3b8" font-size="11">${assiutRev.toLocaleString('en-US')} ج.م (${assiutCount} عيادة)</text>

        <rect x="0" y="44" width="14" height="14" rx="3" fill="#0ea5e9" />
        <text x="22" y="56" fill="#f8fafc" font-size="12" font-weight="bold">باقي المحافظات (${otherPct}%)</text>
        <text x="22" y="72" fill="#94a3b8" font-size="11">${otherRev.toLocaleString('en-US')} ج.م (${otherCount} عيادة)</text>
      </g>
    </svg>
  `;
}

function generateCashFlowWaterfallChart(kpis) {
  const gross = Number(kpis.totalGrossSales) || 0;
  const comm = Number(kpis.totalDistributorCommissions) || 0;
  const net = Number(kpis.totalAgentNetRevenue) || 0;
  const pending = Number(kpis.pendingAgentNetRevenue) || 0;

  const maxVal = Math.max(1, gross, (net + pending));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 180" width="100%" height="180" style="background:rgba(15,23,42,0.6); border-radius:12px; font-family:-apple-system, Cairo, sans-serif;">
      <text x="240" y="22" fill="#a855f7" font-size="13.5" font-weight="bold" text-anchor="middle">مخطط تدفق السيولة وتوزيع العمولات وصافي الوكيل</text>

      <g transform="translate(30, 45)">
        <!-- Step 1: Gross Sales -->
        <rect x="20" y="10" width="70" height="90" rx="6" fill="#38bdf8" opacity="0.85" />
        <text x="55" y="55" fill="#082f49" font-size="11" font-weight="bold" text-anchor="middle">${gross.toLocaleString('en-US')}</text>
        <text x="55" y="118" fill="#94a3b8" font-size="10.5" text-anchor="middle">المبيعات</text>

        <!-- Arrow 1 -->
        <text x="105" y="60" fill="#64748b" font-size="16" text-anchor="middle">→</text>

        <!-- Step 2: Commissions (Deducted) -->
        <rect x="120" y="35" width="70" height="65" rx="6" fill="#f59e0b" opacity="0.85" />
        <text x="155" y="70" fill="#451a03" font-size="11" font-weight="bold" text-anchor="middle">-${comm.toLocaleString('en-US')}</text>
        <text x="155" y="118" fill="#94a3b8" font-size="10.5" text-anchor="middle">عمولات الموزعين</text>

        <!-- Arrow 2 -->
        <text x="205" y="60" fill="#64748b" font-size="16" text-anchor="middle">→</text>

        <!-- Step 3: Net Collected -->
        <rect x="220" y="20" width="80" height="80" rx="6" fill="#10b981" opacity="0.9" />
        <text x="260" y="65" fill="#052e16" font-size="12" font-weight="bold" text-anchor="middle">${net.toLocaleString('en-US')}</text>
        <text x="260" y="118" fill="#10b981" font-size="10.5" font-weight="bold" text-anchor="middle">صافي محصل</text>

        <!-- Arrow 3 -->
        <text x="315" y="60" fill="#64748b" font-size="16" text-anchor="middle">+</text>

        <!-- Step 4: Pending in Pipeline -->
        <rect x="330" y="40" width="80" height="60" rx="6" fill="#64748b" opacity="0.6" stroke="#94a3b8" stroke-dasharray="4" />
        <text x="370" y="72" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">${pending.toLocaleString('en-US')}</text>
        <text x="370" y="118" fill="#94a3b8" font-size="10.5" text-anchor="middle">قيد التحصيل</text>
      </g>
    </svg>
  `;
}

function getAnalyticsPayload(deals, distributors, kpis) {
  return {
    barChartSvg: generateSalesByTierBarChart(deals),
    donutChartSvg: generateGeographicDonutChart(deals),
    waterfallChartSvg: generateCashFlowWaterfallChart(kpis)
  };
}

module.exports = {
  generateSalesByTierBarChart,
  generateGeographicDonutChart,
  generateCashFlowWaterfallChart,
  getAnalyticsPayload
};

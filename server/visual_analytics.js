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

  const chartWidth = 460;
  const chartHeight = 220;
  const trackX = 126;
  const trackW = 200;
  const barHeight = 24;
  const gap = 24;
  const startY = 58;
  const totalDeals = counts.basic + counts.professional + counts.enterprise;
  const totalRev = revenue.basic + revenue.professional + revenue.enterprise;

  const bars = tiers.map((t, idx) => {
    const y = startY + idx * (barHeight + gap);
    const ratio = totalRev > 0 ? (t.rev / maxRev) : 0;
    const barWidth = t.rev > 0 ? Math.max(10, Math.round(ratio * trackW)) : 0;
    const barX = trackX + (trackW - barWidth);
    const revStr = `\u200F${t.rev.toLocaleString('en-US')} ج.م`;

    return `
      <g>
        <text x="116" y="${y + 16}" fill="${t.rev > 0 ? '#f8fafc' : '#94a3b8'}" font-size="11.5" font-weight="700" text-anchor="end">${revStr}</text>
        <rect x="${trackX}" y="${y}" width="${trackW}" height="${barHeight}" rx="6" fill="#162238" stroke="#334155" stroke-width="0.8" />
        ${barWidth > 0 ? `<rect x="${barX}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${t.color}" opacity="0.92"><title>${t.label}: ${revStr} (${t.count} صفقات)</title></rect>` : ''}
        <text x="442" y="${y + 16}" fill="#cbd5e1" font-size="12" font-weight="700" text-anchor="end">&#x200F;${t.label} (${t.count})</text>
      </g>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${chartWidth} ${chartHeight}" width="100%" direction="ltr" style="width:100%; height:auto; display:block; direction:ltr; background:#0b1324; border:1px solid rgba(148,163,184,0.14); border-radius:12px; font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
      <text x="${chartWidth / 2}" y="28" fill="#38bdf8" font-size="13.5" font-weight="800" text-anchor="middle">توزيع الإيرادات المحققة حسب الباقات الطبية</text>
      ${bars}
      <text x="${chartWidth / 2}" y="204" fill="#64748b" font-size="10.5" text-anchor="middle">إجمالي الصفقات: ${totalDeals} · القيمة: ${totalRev.toLocaleString('en-US')} ج.م</text>
    </svg>
  `;
}

function generateGeographicDonutChart(deals) {
  let assiutCount = 0;
  let otherCount = 0;
  let assiutRev = 0;
  let otherRev = 0;

  for (const d of deals) {
    const isAssiut = d.is_assiut === 1 || d.is_assiut === true ||
      (d.city && (d.city.includes('أسيوط') || d.city.includes('اسيوط'))) ||
      (d.governorate && /أسيوط|اسيوط|سوهاج|قنا|المنيا|الأقصر|اسوان|أسوان/i.test(String(d.governorate)));
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
  const assiutPct = total > 0 ? Math.round((assiutRev / total) * 100) : 0;
  const otherPct = total > 0 ? (100 - assiutPct) : 0;

  const radius = 52;
  const C = +(2 * Math.PI * radius).toFixed(2);
  const assiutDash = total > 0 ? +((assiutPct / 100) * C).toFixed(2) : 0;
  const otherDash = total > 0 ? +(C - assiutDash).toFixed(2) : 0;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 220" width="100%" direction="ltr" style="width:100%; height:auto; display:block; direction:ltr; background:#0b1324; border:1px solid rgba(148,163,184,0.14); border-radius:12px; font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
      <text x="230" y="28" fill="#10b981" font-size="13.5" font-weight="800" text-anchor="middle">التوزيع الجغرافي للمبيعات (أسيوط والصعيد مقابل المحافظات)</text>

      <!-- Donut Circle -->
      <g transform="translate(106, 126)">
        <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#1e293b" stroke-width="20" />
        ${total > 0 && assiutDash > 0 ? `<circle cx="0" cy="0" r="${radius}" fill="none" stroke="#f59e0b" stroke-width="20" stroke-dasharray="${assiutDash} ${C}" stroke-dashoffset="0" transform="rotate(-90)" />` : ''}
        ${total > 0 && otherDash > 0 ? `<circle cx="0" cy="0" r="${radius}" fill="none" stroke="#0ea5e9" stroke-width="20" stroke-dasharray="${otherDash} ${C}" stroke-dashoffset="-${assiutDash}" transform="rotate(-90)" />` : ''}
        <text x="0" y="4" fill="#f8fafc" font-size="14" font-weight="800" text-anchor="middle">${total.toLocaleString('en-US')}</text>
        <text x="0" y="20" fill="#94a3b8" font-size="9.5" text-anchor="middle">${total > 0 ? 'ج.م' : 'لا مبيعات بعد'}</text>
      </g>

      <!-- Legend (strictly right half, RTL-aligned) -->
      <g transform="translate(0, 82)">
        <rect x="426" y="0" width="14" height="14" rx="4" fill="#f59e0b" />
        <text x="416" y="12" fill="#f8fafc" font-size="12.5" font-weight="700" text-anchor="end">&#x200F;أسيوط والصعيد (${assiutPct}%)</text>
        <text x="416" y="30" fill="#94a3b8" font-size="11" text-anchor="end">&#x200F;${assiutRev.toLocaleString('en-US')} ج.م&#x200F; (${assiutCount} عيادة)</text>

        <rect x="426" y="54" width="14" height="14" rx="4" fill="#0ea5e9" />
        <text x="416" y="66" fill="#f8fafc" font-size="12.5" font-weight="700" text-anchor="end">&#x200F;باقي المحافظات (${otherPct}%)</text>
        <text x="416" y="84" fill="#94a3b8" font-size="11" text-anchor="end">&#x200F;${otherRev.toLocaleString('en-US')} ج.م&#x200F; (${otherCount} عيادة)</text>
      </g>
    </svg>
  `;
}

function generateCashFlowWaterfallChart(kpis) {
  const gross = Number(kpis.totalGrossSales) || 0;
  const comm = Number(kpis.totalDistributorCommissions) || 0;
  const net = Number(kpis.totalAgentNetRevenue) || 0;
  const pending = Number(kpis.pendingAgentNetRevenue) || 0;

  const maxVal = Math.max(1, gross, comm, net, pending);
  const baseY = 176;
  const maxBarH = 92;
  const barH = (val) => (val > 0 ? Math.max(18, Math.round((val / maxVal) * maxBarH)) : 12);

  const grossH = barH(gross);
  const commH = barH(comm);
  const netH = barH(net);
  const pendH = barH(pending);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 220" width="100%" direction="ltr" style="width:100%; height:auto; display:block; direction:ltr; background:#0b1324; border:1px solid rgba(148,163,184,0.14); border-radius:12px; font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
      <text x="230" y="28" fill="#a855f7" font-size="13.5" font-weight="800" text-anchor="middle">مخطط تدفق السيولة وتوزيع العمولات وصافي الوكيل</text>

      <!-- Baseline -->
      <line x1="16" y1="${baseY}" x2="444" y2="${baseY}" stroke="#334155" stroke-width="1.2" />

      <!-- Step 1 (Rightmost in RTL flow): Gross Sales -->
      <rect x="360" y="${baseY - grossH}" width="78" height="${grossH}" rx="6" fill="#38bdf8" opacity="0.9" />
      <text x="399" y="${baseY - grossH - 8}" fill="#38bdf8" font-size="11.5" font-weight="800" text-anchor="middle">${gross.toLocaleString('en-US')}</text>
      <text x="399" y="196" fill="#cbd5e1" font-size="11" font-weight="700" text-anchor="middle">المبيعات</text>

      <!-- Operator 1 -->
      <text x="342" y="140" fill="#64748b" font-size="15" font-weight="700" text-anchor="middle">←</text>

      <!-- Step 2: Distributor Commissions -->
      <rect x="246" y="${baseY - commH}" width="78" height="${commH}" rx="6" fill="#f59e0b" opacity="0.9" />
      <text x="285" y="${baseY - commH - 8}" fill="#fbbf24" font-size="11.5" font-weight="800" text-anchor="middle"><tspan direction="ltr">${comm > 0 ? '-' : ''}${comm.toLocaleString('en-US')}</tspan></text>
      <text x="285" y="196" fill="#cbd5e1" font-size="10.5" font-weight="700" text-anchor="middle">عمولات الموزعين</text>

      <!-- Operator 2 -->
      <text x="228" y="140" fill="#64748b" font-size="15" font-weight="700" text-anchor="middle">=</text>

      <!-- Step 3: Net Collected -->
      <rect x="132" y="${baseY - netH}" width="78" height="${netH}" rx="6" fill="#10b981" opacity="0.92" />
      <text x="171" y="${baseY - netH - 8}" fill="#34d399" font-size="11.5" font-weight="800" text-anchor="middle">${net.toLocaleString('en-US')}</text>
      <text x="171" y="196" fill="#10b981" font-size="11" font-weight="800" text-anchor="middle">صافي محصل</text>

      <!-- Operator 3 -->
      <text x="114" y="140" fill="#64748b" font-size="15" font-weight="700" text-anchor="middle">+</text>

      <!-- Step 4 (Leftmost): Pending -->
      <rect x="18" y="${baseY - pendH}" width="78" height="${pendH}" rx="6" fill="#334155" opacity="0.7" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />
      <text x="57" y="${baseY - pendH - 8}" fill="#e2e8f0" font-size="11.5" font-weight="800" text-anchor="middle">${pending.toLocaleString('en-US')}</text>
      <text x="57" y="196" fill="#94a3b8" font-size="10.5" font-weight="700" text-anchor="middle">قيد التحصيل</text>
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

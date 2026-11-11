/* Qalix Medical Agent — Strategic Financial Forecasting & Revenue Projection Engine (Phase 7)
 * 100% Offline Air-Gapped · Zero External Dependencies · 12-Month Projections
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const SCENARIOS = {
  conservative: {
    id: 'conservative',
    nameAr: 'السيناريو المتحفظ (الحد الأدنى)',
    monthlyStandardDeals: 5,
    avgDistCommissionRate: 27,
    desc: 'معدل بيع 5 عيادات شهرياً عبر 2 موزعين نشطين فقط.'
  },
  balanced: {
    id: 'balanced',
    nameAr: 'السيناريو المتوازن (المستهدف التشغيلي الرسمي)',
    monthlyStandardDeals: 12,
    avgDistCommissionRate: 29,
    desc: 'معدل بيع 12 عيادة شهرياً بتغطية أسيوط، القاهرة، والجيزة، والدلتا.'
  },
  aggressive: {
    id: 'aggressive',
    nameAr: 'السيناريو التوسعي (الريادة والانتشار الشامل)',
    monthlyStandardDeals: 25,
    avgDistCommissionRate: 32,
    desc: 'معدل بيع 25 عيادة شهرياً بتغطية محافظات الصعيد والدلتا والقناة.'
  }
};

function calculate12MonthForecast(scenarioKey = 'balanced') {
  const scen = SCENARIOS[scenarioKey] || SCENARIOS.balanced;
  
  // Unified standard official price: Professional 8,500 EGP
  const standardPrice = 8500;

  const monthlyGross = scen.monthlyStandardDeals * standardPrice;
  const monthlyDistComm = Math.round(monthlyGross * (scen.avgDistCommissionRate / 100));
  const monthlyAgentNet = monthlyGross - monthlyDistComm;

  const months = [];
  let cumGross = 0;
  let cumComm = 0;
  let cumNet = 0;

  for (let m = 1; m <= 12; m++) {
    // 3% slight compound growth after month 3 as network matures
    const growthFactor = m > 3 ? 1 + ((m - 3) * 0.02) : 1;
    const mGross = Math.round(monthlyGross * growthFactor);
    const mComm = Math.round(mGross * (scen.avgDistCommissionRate / 100));
    const mNet = mGross - mComm;

    cumGross += mGross;
    cumComm += mComm;
    cumNet += mNet;

    months.push({
      monthNumber: m,
      monthNameAr: `الشهر ${m}`,
      grossSales: mGross,
      distributorCommission: mComm,
      agentNetRevenue: mNet,
      cumulativeNetRevenue: cumNet
    });
  }

  // Potential Year 2 optional maintenance support contract (10% of license value)
  const totalClinicsYear1 = Math.round(scen.monthlyStandardDeals * 12 * 1.08);
  const optionalAnnualMaintenancePool = Math.round(cumGross * 0.12);

  const forecastSvgChart = generateForecastSvgChart(months);

  return {
    scenario: scen,
    totalClinicsYear1,
    annualGrossSales: cumGross,
    annualDistributorCommissions: cumComm,
    annualAgentNetRevenue: cumNet,
    optionalAnnualMaintenancePool,
    months,
    forecastSvgChart
  };
}

function generateForecastSvgChart(months) {
  const width = 600;
  const height = 230;
  const padLeft = 66;
  const padTop = 58;
  const padRight = 24;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(...months.map(m => m.grossSales), 1);
  const midVal = Math.round(maxVal / 2);
  const stepX = chartW / (months.length - 1);

  const grossCoords = months.map((m, i) => ({
    x: +(padLeft + i * stepX).toFixed(1),
    y: +(padTop + chartH - (m.grossSales / maxVal) * chartH).toFixed(1)
  }));
  const netCoords = months.map((m, i) => ({
    x: +(padLeft + i * stepX).toFixed(1),
    y: +(padTop + chartH - (m.agentNetRevenue / maxVal) * chartH).toFixed(1)
  }));

  const pointsGross = grossCoords.map(p => `${p.x},${p.y}`).join(' ');
  const pointsNet = netCoords.map(p => `${p.x},${p.y}`).join(' ');
  const areaNet = `${padLeft},${padTop + chartH} ${pointsNet} ${padLeft + chartW},${padTop + chartH}`;

  const dotsGross = grossCoords.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#38bdf8"><title>شهر ${months[i].monthNumber}: ${months[i].grossSales.toLocaleString('en-US')} ج.م</title></circle>`).join('');
  const dotsNet = netCoords.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#10b981"><title>شهر ${months[i].monthNumber}: ${months[i].agentNetRevenue.toLocaleString('en-US')} ج.م</title></circle>`).join('');

  const labels = months.map((m, i) => {
    const x = +(padLeft + i * stepX).toFixed(1);
    return `<text x="${x}" y="${height - 12}" fill="#94a3b8" font-size="9.5" text-anchor="middle">ش ${m.monthNumber}</text>`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" direction="ltr" style="width:100%; height:auto; display:block; direction:ltr; background:#0b1324; border:1px solid rgba(148,163,184,0.14); border-radius:12px; font-family:'Cairo','Segoe UI',Tahoma,sans-serif;">
      <text x="${width / 2}" y="22" fill="#38bdf8" font-size="13" font-weight="800" text-anchor="middle">المسار التنبؤي لإيرادات الوكيل وصافي التدفق السنوي (12 شهراً)</text>

      <!-- Legend (right-aligned, zero text overlap) -->
      <g>
        <rect x="556" y="34" width="16" height="4" rx="2" fill="#38bdf8" />
        <text x="548" y="39" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="end">إجمالي المبيعات</text>

        <rect x="418" y="34" width="16" height="4" rx="2" fill="#10b981" />
        <text x="410" y="39" fill="#10b981" font-size="10.5" font-weight="700" text-anchor="end">صافي إيراد الوكيل</text>
      </g>

      <!-- Y-axis scale ticks & Grid lines -->
      <text x="${padLeft - 8}" y="${padTop + 4}" fill="#64748b" font-size="9.5" text-anchor="end">${maxVal.toLocaleString('en-US')}</text>
      <line x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}" stroke="#1e293b" stroke-dasharray="3" />

      <text x="${padLeft - 8}" y="${padTop + chartH / 2 + 4}" fill="#64748b" font-size="9.5" text-anchor="end">${midVal.toLocaleString('en-US')}</text>
      <line x1="${padLeft}" y1="${padTop + chartH / 2}" x2="${width - padRight}" y2="${padTop + chartH / 2}" stroke="#1e293b" stroke-dasharray="3" />

      <text x="${padLeft - 8}" y="${padTop + chartH + 4}" fill="#64748b" font-size="9.5" text-anchor="end">0</text>
      <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#334155" />

      <!-- Net Agent Subtle Area -->
      <polygon fill="#10b981" opacity="0.1" points="${areaNet}" />

      <!-- Polylines & Data Points -->
      <polyline fill="none" stroke="#38bdf8" stroke-width="2.5" points="${pointsGross}" />
      <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="${pointsNet}" />
      ${dotsGross}
      ${dotsNet}

      <!-- Month Labels -->
      ${labels}
    </svg>
  `;
}

module.exports = {
  SCENARIOS,
  calculate12MonthForecast
};

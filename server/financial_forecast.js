/* Qalix Medical Agent — Strategic Financial Forecasting & Revenue Projection Engine (Phase 7)
 * 100% Offline Air-Gapped · Zero External Dependencies · 12-Month Projections
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const SCENARIOS = {
  conservative: {
    id: 'conservative',
    nameAr: 'السيناريو المتحفظ (الحد الأدنى)',
    monthlyAssiutDeals: 3,
    monthlyStandardDeals: 2,
    avgDistCommissionRate: 20,
    desc: 'معدل بيع 5 عيادات شهرياً عبر 2 موزعين نشطين فقط.'
  },
  balanced: {
    id: 'balanced',
    nameAr: 'السيناريو المتوازن (المستهدف التشغيلي الرسمي)',
    monthlyAssiutDeals: 7,
    monthlyStandardDeals: 5,
    avgDistCommissionRate: 22,
    desc: 'معدل بيع 12 عيادة شهرياً بتغطية أسيوط، القاهرة، والجيزة، والدلتا.'
  },
  aggressive: {
    id: 'aggressive',
    nameAr: 'السيناريو التوسعي (الريادة والانتشار الشامل)',
    monthlyAssiutDeals: 15,
    monthlyStandardDeals: 10,
    avgDistCommissionRate: 25,
    desc: 'معدل بيع 25 عيادة شهرياً بتغطية محافظات الصعيد والدلتا والقناة.'
  }
};

function calculate12MonthForecast(scenarioKey = 'balanced') {
  const scen = SCENARIOS[scenarioKey] || SCENARIOS.balanced;
  
  // Standard fixed prices: Professional 8,500, Assiut 5,100
  const assiutPrice = 5100;
  const standardPrice = 8500;

  const monthlyGross = (scen.monthlyAssiutDeals * assiutPrice) + (scen.monthlyStandardDeals * standardPrice);
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
  const totalClinicsYear1 = Math.round((scen.monthlyAssiutDeals + scen.monthlyStandardDeals) * 12 * 1.08);
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
  const width = 580;
  const height = 200;
  const padLeft = 50;
  const padBottom = 30;
  const chartW = width - padLeft - 20;
  const chartH = height - padBottom - 30;

  const maxVal = Math.max(...months.map(m => m.grossSales), 1);
  const stepX = chartW / (months.length - 1);

  const pointsGross = months.map((m, i) => {
    const x = padLeft + i * stepX;
    const y = 30 + chartH - (m.grossSales / maxVal) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const pointsNet = months.map((m, i) => {
    const x = padLeft + i * stepX;
    const y = 30 + chartH - (m.agentNetRevenue / maxVal) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const labels = months.filter((_, i) => i % 2 === 0).map((m, i) => {
    const x = padLeft + (i * 2) * stepX;
    return `<text x="${x}" y="${height - 10}" fill="#94a3b8" font-size="10" text-anchor="middle">ش ${m.monthNumber}</text>`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="background:rgba(15,23,42,0.6); border-radius:12px; font-family:-apple-system, Cairo, sans-serif;">
      <text x="${width / 2}" y="20" fill="#38bdf8" font-size="12.5" font-weight="bold" text-anchor="middle">المسار التنبؤي لإيرادات الوكيل وصافي التدفق السنوي (12 شهراً)</text>
      
      <!-- Grid lines -->
      <line x1="${padLeft}" y1="30" x2="${width - 20}" y2="30" stroke="#1e293b" stroke-dasharray="3" />
      <line x1="${padLeft}" y1="${30 + chartH / 2}" x2="${width - 20}" y2="${30 + chartH / 2}" stroke="#1e293b" stroke-dasharray="3" />
      <line x1="${padLeft}" y1="${30 + chartH}" x2="${width - 20}" y2="${30 + chartH}" stroke="#334155" />

      <!-- Polyline Gross Sales -->
      <polyline fill="none" stroke="#38bdf8" stroke-width="2.5" points="${pointsGross}" />
      
      <!-- Polyline Net Agent -->
      <polyline fill="none" stroke="#10b981" stroke-width="2.5" points="${pointsNet}" />

      <!-- Month Labels -->
      ${labels}

      <!-- Legend -->
      <g transform="translate(60, 40)">
        <line x1="0" y1="0" x2="16" y2="0" stroke="#38bdf8" stroke-width="2.5" />
        <text x="22" y="4" fill="#38bdf8" font-size="10" font-weight="bold">إجمالي المبيعات</text>

        <line x1="120" y1="0" x2="136" y2="0" stroke="#10b981" stroke-width="2.5" />
        <text x="142" y="4" fill="#10b981" font-size="10" font-weight="bold">صافي إيراد الوكيل</text>
      </g>
    </svg>
  `;
}

module.exports = {
  SCENARIOS,
  calculate12MonthForecast
};

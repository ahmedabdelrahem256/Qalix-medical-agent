/* R&D Proposals & Qalix Medical v2.0 Requirements Exporter (Phase 9)
 * Official printable A4 document compiling all clinic feedback & feature proposals for the development team.
 * 100% Offline Air-Gapped · Zero External Dependencies · Agent: 01122166076 / 01122166076
 */
'use strict';

const { escapeHtml } = require('./html_escape');

function generateProposalsDocumentHtml(proposalsList, agentInfo) {
  const byPillar = {
    product: { title: '1. تطوير المنظومة والمنتج السريري (Clinical Product R&D)', items: [] },
    presentation: { title: '2. العرض التقديمي والإبهار الميداني (Live Presentation)', items: [] },
    sales: { title: '3. استراتيجيات البيع وتنمية المبيعات (Sales Strategy)', items: [] },
    followup: { title: '4. المتابعة وخدمة ما بعد البيع (Retention & Customer Success)', items: [] },
    management: { title: '5. الحوكمة وإدارة شبكة الموزعين (Governance & Franchise)', items: [] }
  };

  for (const p of proposalsList) {
    if (byPillar[p.pillar]) {
      byPillar[p.pillar].items.push(p);
    } else {
      byPillar.product.items.push(p);
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>وثيقة متطلبات وتطوير الإصدار القادم | Qalix Medical v2.0 Blueprint</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; background: #e2e8f0; color: #0f172a; padding: 20px; font-size: 13px; line-height: 1.6; }
  .paper { background: #fff; max-width: 820px; margin: auto; padding: 36px 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
  .hdr h1 { font-size: 21px; color: #0f172a; }
  .tag { background: #0ea5e9; color: #fff; padding: 3px 12px; border-radius: 6px; font-weight: bold; font-size: 11.5px; }
  .pillar-sec { margin-bottom: 22px; page-break-inside: avoid; }
  .pillar-sec h2 { font-size: 15px; color: #0369a1; border-right: 4px solid #0ea5e9; padding-right: 8px; margin-bottom: 10px; }
  .prop-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
  .prop-card h3 { font-size: 13.5px; margin-bottom: 4px; color: #0f172a; }
  .prop-meta { display: flex; justify-content: space-between; font-size: 11.5px; margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 4px; }
  .btn-print { background: #0284c7; color: white; border: none; padding: 9px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; display: block; margin: 0 auto 16px; font-size: 14px; }
  @media print { body { background: #fff; padding: 0; } .paper { box-shadow: none; max-width: 100%; margin: 0; padding: 10mm; } .btn-print { display: none; } }
</style>
</head>
<body>
<button class="btn-print" onclick="window.print()">🖨️ طباعة وثيقة مقترحات الإصدار v2.0 (A4)</button>
<div class="paper">
  <div class="hdr">
    <div>
      <h1>وثيقة متطلبات وتطوير الإصدار القادم (Blueprint v2.0)</h1>
      <p style="font-size:12px; color:#475569;">حصيلة التغذية الراجعة الميدانية من الأطباء والمراكز وشبكة الموزعين المعتمدين</p>
    </div>
    <div style="text-align:left;">
      <span class="tag">لجنة التطوير والارتقاء</span>
      <div style="font-size:11.5px; color:#64748b; margin-top:4px;">تاريخ الصدور: <b>${dateStr}</b></div>
    </div>
  </div>

  <div style="background:#f0fdf4; border:1px solid #16a34a; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:12.5px;">
    <strong>📌 ميثاق النزاهة الهندسية:</strong>
    تؤكد هذه الوثيقة أن الإصدار الحالي <code>v1.0</code> ثابت سيادياً ومحمي تماماً، وأن كافة هذه المقترحات جُمعت من واقع الممارسة اليومية للعيادات لتُسلَّم رسمياً لفريق البرمجة كخارطة طريق للإصدار الرئيسي القادم <code>v2.0</code>.
  </div>

  ${Object.keys(byPillar).map(k => {
    const p = byPillar[k];
    if (p.items.length === 0) return '';
    return `
      <div class="pillar-sec">
        <h2>${p.title} (${p.items.length} مقترحات معتمدة)</h2>
        ${p.items.map(item => `
          <div class="prop-card">
            <h3>💡 ${escapeHtml(item.title)}</h3>
            <p style="font-size:12px; color:#334155; margin:4px 0;">${escapeHtml(item.description)}</p>
            <div class="prop-meta">
              <span style="color:#15803d; font-weight:bold;">الأثر المتوقع: ${escapeHtml(item.impact)}</span>
              <span style="color:#0284c7;">الأولوية: ${escapeHtml(item.priority)}</span>
              <span style="color:#64748b;">الحالة: ${escapeHtml(item.status)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('')}

  <div style="border-top:1.5px solid #0f172a; padding-top:14px; margin-top:24px; display:flex; justify-content:space-between; font-size:11.5px; color:#475569;">
    <div>جهة الإصدار: <b>فريق التطوير والتوزيع — منظومة كالكس الطبية (التواصل عبر الموزع المعتمد)</b></div>
    <div>المستودع الرسمي: <b>GitHub / Qalix-medical-agent</b></div>
  </div>
</div>
</body>
</html>`;
}

module.exports = {
  generateProposalsDocumentHtml
};

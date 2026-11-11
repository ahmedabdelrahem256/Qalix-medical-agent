/* Standalone Distributor Portal Generator (Phase 3)
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

const { escapeHtml } = require('./html_escape');
const { renderBattleCardA4 } = require('./marketing_kit');
const { renderTechnicalFieldSectionHtml } = require('./technical_field_guide');

function safeInlineJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function generateStandaloneDistributorPortalHtml(dist, agentInfo, systemCtx = {}) {
  const safeName = escapeHtml(dist.name);
  const safeCode = escapeHtml(dist.code);
  const safeGov = escapeHtml(dist.governorate);
  const safeRate = Number(dist.commission_rate) || 27;
  const safeMegaUrl = escapeHtml(agentInfo.megaTrialUrl || '');

  const activeSys = systemCtx.activeSystem || {
    id: 'qalix_medical',
    nameAr: agentInfo.titleAr ? agentInfo.titleAr.replace(/^وكيل\s*/, '') : 'منظومة كالكس ميديكال الطبية',
    projectName: agentInfo.projectName || 'Qalix Medical Agent',
    licensePrefix: 'QLX2'
  };
  const isMedical = activeSys.id === 'qalix_medical';
  const pricing = systemCtx.pricing || {
    basic:        { id: 'basic',        nameAr: 'الباقة الأساسية',     price: 4500 },
    professional: { id: 'professional', nameAr: 'الباقة التخصصية',     price: 8500 },
    enterprise:   { id: 'enterprise',   nameAr: 'باقة المراكز الكبرى', price: 18500 }
  };
  const agentPhone = String(agentInfo.phone || '01000000000').trim();
  const waAgentDigits = String(agentInfo.intlPhone || ('+2' + agentPhone)).replace(/[^0-9]/g, '');
  const payAccounts = systemCtx.paymentAccounts || {
    instapay: agentPhone,
    instapayName: agentInfo.titleAr || 'الوكيل المعتمد',
    vodafoneCash: agentPhone,
    bankName: '',
    bankAccount: '',
    cashNote: 'توريد نقدي مباشر أو عبر المندوب المعتمد'
  };

  const pBasic = Number(pricing.basic?.price || 4500);
  const pPro = Number(pricing.professional?.price || 8500);
  const pEnt = Number(pricing.enterprise?.price || 18500);

  const safeSysName = escapeHtml(activeSys.nameAr || 'المنظومة التجارية');
  const safeProjectName = escapeHtml(activeSys.projectName || 'Agent Platform');
  const safeAgentPhone = escapeHtml(agentPhone);

  const portalDistJson = safeInlineJson({
    id: String(dist.id || ''),
    name: String(dist.name || ''),
    code: String(dist.code || ''),
    governorate: String(dist.governorate || ''),
    phone: String(dist.phone || ''),
    rate: safeRate,
    megaTrialUrl: String(agentInfo.megaTrialUrl || ''),
    agentPhone,
    waAgentDigits,
    waDirectUrl: 'https://wa.me/' + waAgentDigits,
    systemId: activeSys.id,
    systemName: activeSys.nameAr || 'المنظومة',
    licensePrefix: activeSys.licensePrefix || 'QLX2',
    serverUrl: String(systemCtx.serverUrl || ''),
    lanUrl: String(systemCtx.lanUrl || '')
  });
  const battleCardB64 = Buffer.from(renderBattleCardA4(dist), 'utf8').toString('base64');
  const techSec = isMedical ? renderTechnicalFieldSectionHtml(dist, agentInfo) : '';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>حقيبة الموزع المستقل: ${safeName} | ${safeProjectName}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1120;
      --card: #111827;
      --card2: #1e293b;
      --border: #1f2937;
      --text: #f9fafb;
      --muted: #9ca3af;
      --accent: #10b981;
      --blue: #0ea5e9;
      --sky: #38bdf8;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
    body { margin: 0; padding: 24px; background: var(--bg); color: var(--text); line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
    .sub-card { background: var(--card2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(16,185,129,0.15); color: var(--accent); border: 1px solid rgba(16,185,129,0.3); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 16px; }
    input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: #0f172a; color: var(--text); font-size: 13px; margin-top: 4px; }
    select option, select optgroup { background-color: #0f172a; color: #f9fafb; }
    button { cursor: pointer; padding: 10px 16px; border-radius: 10px; border: none; font-weight: 700; font-size: 13px; background: var(--accent); color: #052e16; transition: 0.2s; }
    button:hover { opacity: 0.9; }
    .btn-blue { background: var(--blue); color: #082f49; }
    .btn-amber { background: var(--amber); color: #451a03; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px; border-bottom: 1px solid var(--border); text-align: right; }
    th { color: var(--muted); background: #0f172a; }
    @media (max-width: 768px) {
      body { padding: 12px; }
      .card { padding: 14px; }
      table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .no-print { display: none !important; }
      .card { border: 1px solid #ccc; background: white; color: black; page-break-inside: avoid; }
      th { background: #f0f0f0; color: black; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="badge">بوابة الموزع المستقل المعتمد · ${safeProjectName}</span>
      <h1 style="margin: 10px 0 4px; font-size: 22px;">${safeName} (${safeCode})</h1>
      <p style="margin: 0; color: var(--muted); font-size: 13px;">
        المنظومة: <strong>${safeSysName}</strong> · النطاق الجغرافي: <strong>${safeGov}</strong> · نسبة العمولة: <strong style="color:var(--accent)">${safeRate}%</strong> · هاتف الوكيل: <strong dir="ltr">${safeAgentPhone}</strong>
      </p>
    </div>

    <div class="grid">
      <div class="card">
        <h3 style="margin-top:0; color:var(--accent);">1. جدول الأسعار الرسمية الثابتة وعمولتك الفورية (${safeRate}%)</h3>
        <table>
          <thead>
            <tr><th>الباقة / الفئة</th><th>السعر الرسمي</th><th>عمولتك (${safeRate}%)</th><th>صافي التوريد للوكيل</th></tr>
          </thead>
          <tbody>
            <tr><td>${escapeHtml(pricing.basic?.nameAr || 'الباقة الأساسية')}</td><td>${pBasic.toLocaleString('ar-EG')} ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(pBasic * dist.commission_rate / 100)} ج.م</td><td>${pBasic - Math.round(pBasic * dist.commission_rate / 100)} ج.م</td></tr>
            <tr><td>${escapeHtml(pricing.professional?.nameAr || 'الباقة المتقدمة')}</td><td>${pPro.toLocaleString('ar-EG')} ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(pPro * dist.commission_rate / 100)} ج.م</td><td>${pPro - Math.round(pPro * dist.commission_rate / 100)} ج.م</td></tr>
            <tr><td>${escapeHtml(pricing.enterprise?.nameAr || 'باقة المؤسسات')}</td><td>${pEnt.toLocaleString('ar-EG')} ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(pEnt * dist.commission_rate / 100)} ج.م</td><td>${pEnt - Math.round(pEnt * dist.commission_rate / 100)} ج.م</td></tr>
          </tbody>
        </table>

        <!-- Agent Official Receiving Accounts -->
        <div class="sub-card" style="margin-top:14px; border-color:rgba(14,165,233,0.4);">
          <h4 style="margin:0 0 8px; font-size:13.5px; color:var(--sky);">💳 حسابات وقنوات دفع صافي التوريد إلى الوكيل:</h4>
          <div style="font-size:12.5px; line-height:1.75; color:var(--text);">
            ${payAccounts.instapay ? `<div>⚡ <strong>إنستاباي (InstaPay):</strong> <code dir="ltr">${escapeHtml(payAccounts.instapay)}</code> ${payAccounts.instapayName ? `(${escapeHtml(payAccounts.instapayName)})` : ''}</div>` : ''}
            ${payAccounts.vodafoneCash ? `<div>📱 <strong>فودافون كاش / محفظة:</strong> <code dir="ltr">${escapeHtml(payAccounts.vodafoneCash)}</code></div>` : ''}
            ${payAccounts.bankAccount ? `<div>🏛️ <strong>تحويل بنكي (${escapeHtml(payAccounts.bankName || 'البنك')}):</strong> <code dir="ltr">${escapeHtml(payAccounts.bankAccount)}</code></div>` : ''}
            <div>💵 <strong>الدفع النقدي:</strong> ${escapeHtml(payAccounts.cashNote || 'توريد مباشر مع إيصال استلام')}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0; color:var(--blue);">2. إتمام الصفقة وإرسال ريسيت الدفع لطلب مفتاح التفعيل (<span dir="ltr">${safeAgentPhone}</span>)</h3>
        <div style="display:grid; gap:10px;">
          <div><label style="font-size:12px;">${isMedical ? 'اسم العيادة / المركز الطبي:' : 'اسم العميل / المنشأة / الجهة:'}</label><input id="cName" placeholder="${isMedical ? 'مثال: عيادة الشفاء التخصصية' : 'مثال: شركة النور للتجارة'}" /></div>
          <div><label style="font-size:12px;">${isMedical ? 'اسم الطبيب وهاتفه:' : 'اسم المسؤول وهاتفه:'}</label><input id="dName" placeholder="${isMedical ? 'مثال: د. أحمد سامي - 010...' : 'مثال: أ. محمد محمود - 010...'}" /></div>
          <div><label style="font-size:12px;">${isMedical ? 'بصمة جهاز العيادة (Hardware ID من شاشة التفعيل):' : 'مرجع التفعيل / بصمة الجهاز / كود الطلب:'}</label><input id="hwId" placeholder="${isMedical ? '24 حرفاً ورقماً' : 'كود التفعيل أو بصمة الجهاز'}" dir="ltr" /></div>
          <div>
            <label style="font-size:12px;">الباقة / الفئة المتعاقد عليها:</label>
            <select id="tierSel">
              <option value="basic|${pBasic}">${escapeHtml(pricing.basic?.nameAr || 'الباقة الأساسية')} (${pBasic.toLocaleString('ar-EG')} ج.م)</option>
              <option value="pro|${pPro}" selected>${escapeHtml(pricing.professional?.nameAr || 'الباقة التخصصية')} (${pPro.toLocaleString('ar-EG')} ج.م)</option>
              <option value="ent|${pEnt}">${escapeHtml(pricing.enterprise?.nameAr || 'الباقة الكبرى')} (${pEnt.toLocaleString('ar-EG')} ج.م)</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <div>
              <label style="font-size:12px;">🧑‍💼 المندوب المسؤول (الزيارة الأولى):</label>
              <select id="dealRepSelect"><option value="">— بدون تحديد / مباشر —</option></select>
            </div>
            <div>
              <label style="font-size:12px;">🛠️ الفني المكلّف بالتنفيذ لاحقاً:</label>
              <select id="dealTechSelect"><option value="">— يُحدد عند صدور المفتاح —</option></select>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <div>
              <label style="font-size:12px;">طريقة الدفع للوكيل:</label>
              <select id="payChannel">
                <option value="إنستاباي (InstaPay)">⚡ إنستاباي (InstaPay)</option>
                <option value="فودافون كاش (Vodafone Cash)">📱 فودافون كاش / محفظة</option>
                <option value="تحويل بنكي رسمي">🏛️ تحويل بنكي رسمي</option>
                <option value="سداد وتوريد نقدي">💵 توريد نقدي</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;">رقم مرجع التحويل / العملية:</label>
              <input id="payRef" placeholder="مثال: IPN-849201" dir="ltr" />
            </div>
          </div>
          <div class="sub-card" style="padding:10px; border:1px dashed rgba(16,185,129,0.45); margin:0;">
            <label style="font-size:12px; color:var(--accent); font-weight:700;">🧾 إرفاق صورة ريسيت الدفع (إيصال التحويل / Screenshot):</label>
            <input type="file" id="payReceiptFile" accept="image/*,.pdf" onchange="handlePortalReceiptUpload(this)" style="margin-top:6px; padding:6px; font-size:12px;" />
            <div id="payReceiptPreviewBox" style="display:none; margin-top:8px; text-align:center;">
              <img id="payReceiptImg" src="" alt="معاينة ريسيت الدفع" style="max-height:130px; max-width:100%; border-radius:8px; border:1px solid var(--border);" />
              <div id="payReceiptMeta" style="font-size:11px; color:var(--accent); margin-top:4px;"></div>
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="submitPaymentReceiptRequest(true)" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:#fff;">💳 إرسال ريسيت الدفع وطلب التفعيل للوكيل (<span dir="ltr">${safeAgentPhone}</span>)</button>
            <button type="button" onclick="sendRequestToAgentWa()" class="btn-amber" style="color:#451a03;">📲 إرسال واتساب</button>
            <button type="button" onclick="genRequest()" class="btn-blue" style="color:#fff;">📋 نسخ النص</button>
          </div>
          <textarea id="outMsg" rows="5" readonly placeholder="ستظهر رسالة طلب التفعيل وتفاصيل الريسيت هنا..."></textarea>
        </div>
      </div>
    </div>

    <!-- Waiting Room for Agent Payment Confirmation & Activation Key -->
    <div class="card no-print" style="border:1px solid rgba(245,158,11,0.45);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
        <div>
          <h3 style="margin:0; color:var(--amber);">⏳ متابعة طلبات الريسيت وانتظار مفتاح التفعيل من الوكيل</h3>
          <p style="margin:3px 0 0; font-size:12px; color:var(--muted);">بعد إرسال الريسيت يظهر طلبك هنا بحالة «قيد الانتظار» حتى يؤكد الوكيل الدفع ويصدر لك مفتاح التفعيل (تحديث تلقائي عبر الشبكة أو لصق يدوي من واتساب).</p>
        </div>
        <button type="button" onclick="refreshAllWaitingRequests()" class="btn-blue" style="padding:7px 12px; font-size:12px; color:#fff;">🔄 تحديث حالة كل الطلبات الآن</button>
      </div>
      <div id="waitingKeysContainer" style="display:grid; gap:10px;"></div>
    </div>

    <!-- Distributor Field Team & 2-Stage Operations Workflow (Rep First -> Tech Execution) -->
    <div id="distFieldTeamSection" class="card no-print" style="border:1px solid rgba(56,189,248,0.45);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <h3 style="margin:0; color:var(--sky);">👥 إدارة فريق عمل الموزع في النطاق الجغرافي (<span style="color:var(--accent);">${safeGov}</span>): المناديب أولاً ثم الفنيين</h3>
          <p style="margin:4px 0 0; font-size:12.5px; color:var(--muted);">
            لا يتجه الموزع بنفسه للعميل؛ بل يدير من هنا فريق <strong>المناديب</strong> (للزيارة الأولى والعرض والتعاقد) ثم فريق <strong>الفنيين</strong> (للتركيب والتشغيل وإنجاز العمل) داخل نطاق محافظة <strong>${safeGov}</strong>.
          </p>
        </div>
      </div>

      <!-- Field Team KPIs -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:8px; margin-bottom:14px;">
        <div class="sub-card" style="text-align:center; padding:10px;">
          <div style="font-size:11px; color:var(--muted);">🧑‍💼 المناديب المعتمدون</div>
          <div id="teamRepCount" style="font-size:20px; font-weight:800; color:var(--sky);">0</div>
        </div>
        <div class="sub-card" style="text-align:center; padding:10px;">
          <div style="font-size:11px; color:var(--muted);">🛠️ الفنيون الميدانيون</div>
          <div id="teamTechCount" style="font-size:20px; font-weight:800; color:var(--accent);">0</div>
        </div>
        <div class="sub-card" style="text-align:center; padding:10px;">
          <div style="font-size:11px; color:var(--muted);">1️⃣ مرحلة المندوب (أولاً)</div>
          <div id="teamStageRepCount" style="font-size:20px; font-weight:800; color:var(--amber);">0</div>
        </div>
        <div class="sub-card" style="text-align:center; padding:10px;">
          <div style="font-size:11px; color:var(--muted);">2️⃣ مرحلة الفني (التنفيذ)</div>
          <div id="teamStageTechCount" style="font-size:20px; font-weight:800; color:var(--purple);">0</div>
        </div>
        <div class="sub-card" style="text-align:center; padding:10px;">
          <div style="font-size:11px; color:var(--muted);">✅ مهام مكتملة 100%</div>
          <div id="teamDoneCount" style="font-size:20px; font-weight:800; color:#34d399;">0</div>
        </div>
      </div>

      <!-- Mandatory Trial Edition Registration & Stage Transition Agent Notification -->
      <div id="trialRegistrationCard" class="sub-card" style="padding:12px; border:1px solid rgba(245,158,11,0.5); background:rgba(245,158,11,0.06); margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
          <div>
            <h4 style="margin:0; color:var(--amber); font-size:14.5px;">🧪 تسجيل نسخة المرحلة التجريبية (إلزامي إرسال البيانات للوكيل + تحديث البطاقة عند كل انتقال مرحلة)</h4>
            <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">أي عميل يتسلم نسخة تجريبية (14 يوماً) يجب تسجيل بياناته وإرسال بطاقته للوكيل فوراً؛ وعند انتقال العميل لأي مرحلة تالية تتحدث بطاقته تلقائياً وتُرسل للوكيل.</p>
          </div>
          <span style="background:rgba(245,158,11,0.2); color:#fbbf24; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:bold;">إخطار إلزامي للوكيل</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap:8px; margin-bottom:10px;">
          <div>
            <label style="font-size:11px; color:var(--muted);">اسم العميل / المنشأة (مرحلة التجريب):</label>
            <input id="trlCustomerName" placeholder="مثال: مركز السلام التخصصي" style="padding:6px; font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">بيانات التواصل والمنطقة:</label>
            <input id="trlContactInfo" placeholder="هاتف العميل + المنطقة..." style="padding:6px; font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">مرجع النسخة التجريبية / بصمة الجهاز:</label>
            <input id="trlDevice" dir="ltr" placeholder="TRIAL-HW / Device ID" style="padding:6px; font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">تاريخ بدء التجربة (14 يوماً):</label>
            <input id="trlStartDate" type="date" dir="ltr" style="padding:6px; font-size:12px;" />
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">المندوب المشرف على التجربة:</label>
            <select id="trlRepSelect" style="padding:6px; font-size:12px;"></select>
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">الفني المرشح عند التفعيل:</label>
            <select id="trlTechSelect" style="padding:6px; font-size:12px;"></select>
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">المرحلة الحالية:</label>
            <select id="trlStageSelect" style="padding:6px; font-size:12px;">
              <option value="trial_installed" selected>🧪 في مرحلة التجريب (تم التثبيت للعميل)</option>
              <option value="rep_pending">1️⃣ مجدول لزيارة المندوب</option>
              <option value="rep_visited">🤝 تمت زيارة المندوب والعرض</option>
              <option value="tech_assigned">🛠️ جاري الإعداد للتنفيذ مع الفني</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px; color:var(--muted);">ملاحظات البطاقة / التحديث:</label>
            <input id="trlNotes" placeholder="تم تثبيت التجريبية وطلب العميل متابعة..." style="padding:6px; font-size:12px;" />
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="submitTrialCardAndNotifyAgent(false)" style="background:linear-gradient(135deg,#d97706,#b45309); color:#fff; padding:8px 14px; font-size:12px; width:auto;">📡 حفظ بيانات النسخة التجريبية وإخطار الوكيل مباشرة</button>
          <button type="button" onclick="submitTrialCardAndNotifyAgent(true)" style="background:linear-gradient(135deg,#10b981,#059669); color:#fff; padding:8px 14px; font-size:12px; width:auto;">📲 حفظ + إرسال بطاقة التجربة لواتساب الوكيل</button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:14px;">
        <!-- Column 1: Team Roster (Reps & Technicians in Geographic Zone) -->
        <div class="sub-card" style="padding:12px; border:1px solid rgba(56,189,248,0.3); margin:0;">
          <h4 style="margin:0 0 8px; color:var(--sky); font-size:14px;">📋 سجل المناديب والفنيين في نطاق (${safeGov})</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div>
              <label style="font-size:11px; color:var(--muted);">الاسم الكامل:</label>
              <input id="tmName" placeholder="مثال: م. كريم عادل" style="padding:6px; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">الدور / التخصص:</label>
              <select id="tmRole" style="padding:6px; font-size:12px;">
                <option value="rep">🧑‍💼 مندوب (زيارة أولى وإقناع)</option>
                <option value="tech">🛠️ فني (تركيب وإنجاز العمل)</option>
              </select>
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">رقم الموبايل / واتساب:</label>
              <input id="tmPhone" dir="ltr" placeholder="010..." style="padding:6px; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">النطاق / المركز داخل ${safeGov}:</label>
              <input id="tmZone" placeholder="مثال: وسط المدينة / المراكز" style="padding:6px; font-size:12px;" />
            </div>
            <div style="grid-column:1 / -1; display:flex; gap:8px; align-items:flex-end;">
              <div style="flex:1;">
                <label style="font-size:11px; color:var(--muted);">بدل / عمولة المهمة (ج.م):</label>
                <input id="tmFee" type="number" value="300" dir="ltr" style="padding:6px; font-size:12px;" />
              </div>
              <button type="button" onclick="addDistTeamMember()" class="btn-blue" style="padding:8px 14px; font-size:12px; color:#fff; width:auto;">➕ إضافة للفريق</button>
            </div>
          </div>

          <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
            <button type="button" onclick="setTeamRoleFilter('all')" id="fltTeamAll" class="btn-blue" style="padding:4px 10px; font-size:11px; color:#fff; width:auto;">الكل</button>
            <button type="button" onclick="setTeamRoleFilter('rep')" id="fltTeamRep" style="padding:4px 10px; font-size:11px; background:#1e293b; color:#cbd5e1; width:auto;">🧑‍💼 المناديب فقط</button>
            <button type="button" onclick="setTeamRoleFilter('tech')" id="fltTeamTech" style="padding:4px 10px; font-size:11px; background:#1e293b; color:#cbd5e1; width:auto;">🛠️ الفنيين فقط</button>
          </div>
          <div id="distTeamMembersList" style="max-height:290px; overflow-y:auto; display:grid; gap:8px;"></div>
        </div>

        <!-- Column 2: 2-Stage Dispatch Board (Step 1: Rep -> Step 2: Technician) -->
        <div class="sub-card" style="padding:12px; border:1px solid rgba(16,185,129,0.35); margin:0;">
          <h4 style="margin:0 0 8px; color:var(--accent); font-size:14px;">🚀 مسار تنفيذ العملاء: (1) إرسال المندوب ← (2) إرسال الفني</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div>
              <label style="font-size:11px; color:var(--muted);">اسم العميل / المنشأة:</label>
              <input id="wfCustomerName" placeholder="اسم العميل أو العيادة..." style="padding:6px; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">المنطقة والهاتف داخل ${safeGov}:</label>
              <input id="wfCustomerPhone" placeholder="المنطقة + رقم الهاتف..." style="padding:6px; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">1️⃣ المندوب (الزيارة الأولى):</label>
              <select id="wfRepSelect" style="padding:6px; font-size:12px;"></select>
            </div>
            <div>
              <label style="font-size:11px; color:var(--muted);">2️⃣ الفني (لإنجاز العمل بعده):</label>
              <select id="wfTechSelect" style="padding:6px; font-size:12px;"></select>
            </div>
            <div style="grid-column:1 / -1; display:flex; gap:8px; align-items:flex-end;">
              <div style="flex:1;">
                <label style="font-size:11px; color:var(--muted);">المرحلة الابتدائية / ملاحظات:</label>
                <input id="wfNotes" placeholder="مثال: موعد الزيارة الساعة 4 مساءً + متطلب العميل" style="padding:6px; font-size:12px;" />
              </div>
              <button type="button" onclick="addFieldWorkflowTask()" style="background:linear-gradient(135deg,#10b981,#059669); color:#fff; padding:8px 14px; font-size:12px; width:auto;">📌 تكليف وإدراج</button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
            <span style="font-size:11.5px; color:var(--accent);">🔗 كل حركة للمندوب أو الفني تُربط آلياً في السجل الموحد بالوكيل:</span>
            <button type="button" onclick="syncUnifiedPortalFromAgent(true)" style="padding:4px 10px; font-size:11px; background:#0369a1; color:#fff; width:auto;">🔄 مزامنة السجل الموحد مع الوكيل</button>
          </div>
          <div id="distWorkflowTasksList" style="max-height:360px; overflow-y:auto; display:grid; gap:8px;"></div>
        </div>
      </div>
    </div>

    <!-- Agent-Distributor Direct Hub: Replies, Lead Lock Requests & Remittances -->
    <div class="card no-print">
      <h3 style="margin-top:0; color:var(--sky);">مركز الردود السريعة، طلبات الحجز، وإشعارات توريد المبالغ إلى الوكيل (${safeAgentPhone})</h3>
      <p style="font-size:12.5px; color:var(--muted); margin-top:-4px; margin-bottom:12px;">
        أرسل من هنا مباشرة أي رد على رسائل الوكيل، أو اطلب حجز عيادة جديدة (14 يوماً)، أو أرسل إشعار تحويل وتوريد مبالغ مالية للوكيل بنقرة واحدة (أوفلاين بالكامل عبر واتساب):
      </p>
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <div>
          <label style="font-size:12px;">نوع المراسلة / الطلب للوكيل:</label>
          <select id="distAgentActionType" onchange="toggleDistAgentFields()">
            <option value="remittance">💸 إشعار توريد مالي / تحويل صافي الوكيل</option>
            <option value="leadlock">🔒 طلب حجز وتأمين عيادة (14 يوماً Lead Lock)</option>
            <option value="reply">💬 رد على رسالة الوكيل / متابعة صفقة</option>
            <option value="support">🛠️ طلب دعم فني أو استشارة ميدانية</option>
            <option value="report">📊 تقرير زيارة عيادة / اعتراض طبيب</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;" id="distAgentSubjectLbl">اسم العيادة / عنوان المراسلة:</label>
          <input id="distAgentSubject" placeholder="مثال: عيادة النور التخصصية - أسيوط" />
        </div>
        <div id="distAgentAmountWrap">
          <label style="font-size:12px;">المبلغ المورد للوكيل (ج.م):</label>
          <input id="distAgentAmount" type="number" placeholder="مثال: 6205" dir="ltr" />
        </div>
        <div id="distAgentChannelWrap">
          <label style="font-size:12px;">وسيلة التحويل ورقم المرجع:</label>
          <input id="distAgentRemitRef" placeholder="مثال: إنستاباي - مرجع 552190" />
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="font-size:12px;">التفاصيل / الرد / الملاحظات للوكيل:</label>
        <textarea id="distAgentBody" rows="3" placeholder="اكتب ردك للوكيل أو تفاصيل الطلب أو بيانات الطبيب (الاسم والهاتف والعنوان)..."></textarea>
      </div>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" onclick="sendDistributorFeedbackToAgentWa()" style="background:linear-gradient(135deg,#10b981,#059669); color:#fff;">📲 إرسال لواتساب الوكيل (${safeAgentPhone}) فوراً</button>
        <button type="button" onclick="copyDistributorFeedbackMsg()" class="btn-amber">📋 نسخ نص الرسالة</button>
      </div>
    </div>

    <!-- 3. Trial Link & Quick Demo -->
    <div class="card">
      <h3 style="margin-top:0; color:var(--amber);">3. رابط النسخة التجريبية للعملاء (14 يوماً بكامل المزايا)</h3>
      <p style="font-size:13px; color:var(--muted); margin-bottom:8px;">أرسل هذا الرابط لأي طبيب لتثبيت النسخة وتجربتها فوراً (حساب المصنع: <code>admin</code> / كلمة المرور: <code>Qalix@11</code>):</p>
      <input readonly value="${safeMegaUrl}" dir="ltr" onclick="this.select()" />
    </div>

    <!-- 4. 5-Minute WOW Live Demo Script -->
    <div class="card">
      <h3 style="margin-top:0; color:var(--purple);">4. سيناريو العرض الميداني في 5 دقائق (The 5-Minute WOW Live Demo)</h3>
      <p style="font-size:13px; color:var(--muted);">خطوات العرض السريع أمام الطبيب أو السكرتيرة لإغلاق الاقتناع الفوري:</p>
      <div class="sub-card">
        <strong style="color:var(--sky);">الدقيقة 1: مسح الـ QR والنداء الصوتي الذكي</strong>
        <p style="margin:4px 0 0; font-size:12.5px;">امسح QR بالهاتف ليفتح دور المريض على الشبكة المحلية، واضغط استدعاء لسماع النداء الصوتي العربي باسم المريض.</p>
      </div>
      <div class="sub-card">
        <strong style="color:var(--rose);">الدقيقة 2: صمام أمان التداخلات الدوائية</strong>
        <p style="margin:4px 0 0; font-size:12.5px;">اكتب Warfarin مع Aspirin أو Ketolac في الروشتة لتظهر شاشة التنبيه الدوائي الفوري بحماية المريض من النزيف.</p>
      </div>
      <div class="sub-card">
        <strong style="color:var(--accent);">الدقيقة 3: الشات الداخلي المشفر بالصوت والنص</strong>
        <p style="margin:4px 0 0; font-size:12.5px;">أرسل تسجيلاً صوتياً من هاتفك للاستقبال يثبت التواصل السلس داخل العيادة بدون أجهزة إنتركم وبدون إنترنت.</p>
      </div>
      <div class="sub-card">
        <strong style="color:var(--amber);">الدقيقة 4: فصل كابل الإنترنت تماماً</strong>
        <p style="margin:4px 0 0; font-size:12.5px;">افصل الإنترنت وأجرِ كشفاً وطباعة روشتة لإثبات أن المنظومة تعمل 100% بدون توقف وبسرية عسكرية.</p>
      </div>
      <div class="sub-card">
        <strong style="color:var(--emerald);">الدقيقة 5: المقارنة المالية وإغلاق التجربة الفورية</strong>
        <p style="margin:4px 0 0; font-size:12.5px;">قارن تكلفة كالكس (ترخيص دائم) مع اشتراكات السحابة (50,000+ ج.م في 3 سنين)، وابدأ تثبيت تجربة الـ 14 يوماً فوراً.</p>
      </div>
    </div>

    <!-- 5. One-Click WhatsApp Sales Pitch -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; color:var(--accent);">5. رسائل واتساب البيعية الجاهزة للإرسال للأطباء</h3>
        <button type="button" onclick="openPortalDocPreview({ title: '📄 كتالوج رسائل واتساب البيعية كاملاً (A4)', subtitle: 'معاينة الكتالوج قبل الطباعة أو التحميل', url: '/api/marketing/whatsapp-catalog', downloadUrl: '/api/marketing/whatsapp-catalog?download=1', downloadFilename: 'Qalix-WhatsApp-Sales-Catalog.html' })" style="background:#0284c7; color:white; font-size:12px; padding:6px 12px; border-radius:6px; cursor:pointer; border:none;">📄 معاينة / تحميل كتالوج الرسائل (A4)</button>
      </div>
      <div class="grid">
        <div class="sub-card">
          <strong style="color:var(--sky);">رسالة التعارف والتجربة المجانية 14 يوماً</strong>
          <p style="font-size:12px; color:var(--muted); margin:4px 0;">جاهزة بنقرة واحدة متضمنة كود الموزع ${safeCode} ورابط التجربة.</p>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button onclick="openPitchWhatsApp(1)" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">📲 فتح في واتساب</button>
            <button onclick="copyPitch(1)" style="flex:1; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">📋 نسخ النص</button>
          </div>
        </div>
        <div class="sub-card">
          <strong style="color:var(--amber);">الرد على اعتراض النظام السحابي (Cloud SaaS)</strong>
          <p style="font-size:12px; color:var(--muted); margin:4px 0;">تفنيد تكلفة 50 ألف جنيه وتوقف العيادة عند انقطاع الإنترنت وسرية الإيرادات.</p>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button onclick="openPitchWhatsApp(2)" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">📲 فتح في واتساب</button>
            <button onclick="copyPitch(2)" class="btn-amber" style="flex:1; border:none; padding:8px; border-radius:6px; font-weight:bold; cursor:pointer;">📋 نسخ النص</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. Printable A4 Battle Card Button -->
    <div class="card no-print">
      <h3 style="margin-top:0; color:var(--blue);">6. بطاقة المقارنة التنافسية المطبوعة (A4 Battle Card)</h3>
      <p style="font-size:13px; color:var(--muted);">اطبع بطاقة المقارنة الملونة على ورق A4 منفصلة تماماً (توضح توفير 40,000+ ج.م مقابل الأنظمة السحابية) وضعها في ملف الزيارات الميدانية:</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button onclick="printBattleCardA4(true)" class="btn-blue" style="max-width:280px;">🖨️ طباعة بطاقة المقارنة A4 الآن</button>
        <button onclick="printBattleCardA4(false)" style="background:#0f172a; color:#38bdf8; border:1px solid #38bdf8; max-width:240px;">👁️ معاينة بطاقة المقارنة A4</button>
      </div>
    </div>

    <!-- 7. Official Quotation Generator for Distributors (Phase 5) -->
    <div class="card no-print">
      <h3 style="margin-top:0; color:var(--accent);">7. مولد عروض الأسعار الرسمية المعتمدة للعيادات (A4 Official Quotation)</h3>
      <p style="font-size:12.5px; color:var(--muted); margin-bottom:12px;">أصدر عرض سعر رسمي فورياً باسم الموزع المعتمد (${safeName} - ${safeCode}) يحمل التسعيرة الرسمية المعتمدة وخاتم التحقق الرقمي:</p>
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div>
          <label style="font-size:12px; color:var(--muted);">اسم الطبيب:</label>
          <input type="text" id="quoDoctor" placeholder="د. أحمد محمود" value="د. " />
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);">اسم العيادة / المركز:</label>
          <input type="text" id="quoClinic" placeholder="مركز الأمل الطبي" />
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);">التخصص الطبي:</label>
          <select id="quoSpecialty">
            <option value="dental">طب وجراحة الأسنان 🦷</option>
            <option value="pediatrics">طب وجراحة الأطفال 👶</option>
            <option value="internal_cardio">الباطنة والقلب والأوعية الدموية ❤️</option>
            <option value="obgyn">النساء والتوليد والحقن المجهري 🤰</option>
            <option value="ophthalmology">طب وجراحة العيون 👁️</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px; color:var(--muted);">الباقة المطلوبة:</label>
          <select id="quoTier">
            <option value="basic">الباقة الأساسية (4,500 ج.م)</option>
            <option value="professional" selected>الباقة التخصصية (8,500 ج.م)</option>
            <option value="enterprise">باقة المراكز الكبرى (18,500 ج.م)</option>
          </select>
        </div>
      </div>
      <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
        <button onclick="openQuotation()" style="background:var(--accent); color:#052e16;">📄 توليد عرض السعر الرسمي المعتمد (A4)</button>
      </div>
    </div>

    <!-- 8. Distributor Legal & Accounting Access (Phase 5) -->
    <div class="card no-print">
      <h3 style="margin-top:0; color:var(--purple);">8. الوثائق الرسمية وكشف الحساب المالي للموزع</h3>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; background:rgba(15,23,42,0.55); padding:10px; border-radius:10px; border:1px solid var(--border);">
        <select id="distDocsActionSelect" style="flex:1; min-width:240px; margin-top:0;">
          <option value="contract">📜 عقد التوزيع المستقل المعتمد (A4)</option>
          <option value="statement">💼 كشف الحساب المالي وسلسلة التدقيق</option>
          <option value="certificate">🏅 شهادة الاعتماد الميداني الرسمي (A4 Certificate)</option>
          <option value="letter">🎖️ خطاب شريحة التميز التجاري (A4)</option>
          <option value="distcatalog">📘 كتالوج عمل الموزع الميداني المصور (من أ إلى ي)</option>
        </select>
        <button type="button" onclick="handleDistDocSelection('preview')" style="background:#059669; color:#fff;">👁️ معاينة / طباعة</button>
        <button type="button" onclick="handleDistDocSelection('download')" class="btn-blue">⬇️ تحميل الملف</button>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" class="btn-blue" onclick="openDistDocByKey('contract', 'preview')">📜 معاينة وطباعة عقد التوزيع المعتمد (A4)</button>
        <button type="button" style="background:#8b5cf6; color:white;" onclick="openDistDocByKey('statement', 'preview')">💼 كشف الحساب المالي وسلسلة التدقيق</button>
        <button type="button" style="background:#d97706; color:white;" onclick="openDistDocByKey('certificate', 'preview')">🏅 شهادة الاعتماد الميداني الرسمي (A4)</button>
        <button type="button" style="background:#0ea5e9; color:white;" onclick="openDistDocByKey('letter', 'preview')">🎖️ خطاب شريحة التميز التجاري (A4)</button>
        <button type="button" style="background:#10b981; color:#052e16;" onclick="openDistDocByKey('distcatalog', 'preview')">📘 كتالوج عمل الموزع المصور (A–Z)</button>
      </div>
    </div>

    ${techSec.html}
  </div>

  <!-- In-Portal Document & Catalog Preview / Print / Download Modal -->
  <div id="portalDocModal" class="no-print" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(2,6,23,0.88); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:14px;" onclick="closePortalDocModal(event)">
    <div style="position:relative; max-width:1050px; width:100%; height:90vh; display:flex; flex-direction:column; background:#0f172a; border:1px solid #10b981; border-radius:14px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.85);" onclick="event.stopPropagation()">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #1e293b; background:#0f172a; gap:10px; flex-wrap:wrap;">
        <div>
          <h3 id="portalDocTitle" style="margin:0; font-size:15px; color:#f8fafc;">معاينة المستند</h3>
          <p id="portalDocSubtitle" style="margin:2px 0 0; font-size:12px; color:#94a3b8;"></p>
        </div>
        <button type="button" onclick="closePortalDocDirect()" style="background:#ef4444; color:#fff; padding:6px 12px; border-radius:8px;">✕ إغلاق</button>
      </div>
      <div style="position:relative; flex:1; background:#e2e8f0; overflow:hidden;">
        <div id="portalDocLoading" style="position:absolute; inset:0; display:none; align-items:center; justify-content:center; background:rgba(15,23,42,0.88); color:#38bdf8; font-size:14px; font-weight:700; padding:20px; text-align:center;">⏳ جاري تحميل المعاينة...</div>
        <iframe id="portalDocFrame" src="about:blank" style="width:100%; height:100%; border:none; background:#fff;" title="معاينة مستند الموزع"></iframe>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 16px; border-top:1px solid #1e293b; background:#0f172a; gap:8px; flex-wrap:wrap;">
        <span style="font-size:12px; color:#94a3b8;">عاين المستند أعلاه ثم اضغط طباعة أو تحميل النسخة مباشرة</span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="downloadPortalDoc()" style="background:#10b981; color:#052e16; font-weight:800;">⬇️ تحميل الملف</button>
          <button type="button" onclick="printPortalDoc()" class="btn-blue">🖨️ طباعة / حفظ PDF</button>
          <button type="button" onclick="openPortalDocNewTab()" class="btn-amber">↗️ فتح في تبويب مستقل</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const PORTAL_DIST = ${portalDistJson};
    const API_BASE = (window.location.protocol === 'file:') ? 'http://127.0.0.1:4000' : '';
    const BATTLE_CARD_B64 = "${battleCardB64}";
    const DOC_CATALOG_B64 = "${techSec.catalogFallbackB64}";
    const QUICK_START_B64 = "${techSec.quickStartFallbackB64 || ''}";
    const WARRANTY_CERT_B64 = "${techSec.warrantyFallbackB64 || ''}";

    function escHtml(v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function decodeB64Utf8(b64) {
      if (!b64) return '';
      const binStr = atob(b64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    }

    function resolvePortalUrl(u) {
      if (!u) return '';
      if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('blob:') || u.startsWith('data:')) return u;
      return API_BASE + u;
    }

    let currentPortalDocState = null;

    function triggerPortalDownload(opts) {
      if (opts.htmlContent || opts.htmlB64) {
        const html = opts.htmlContent || decodeB64Utf8(opts.htmlB64);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = bUrl;
        a.download = opts.downloadFilename || 'qalix-document.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(bUrl), 4000);
        return;
      }
      const dlUrl = resolvePortalUrl(opts.downloadUrl || opts.url);
      if (!dlUrl) return;
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = opts.downloadFilename || '';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    let portalPreviewSeq = 0;

    function injectBaseHrefPortal(html, baseOrigin) {
      if (!html || !baseOrigin) return html;
      const low = html.toLowerCase();
      if (low.indexOf('<base') !== -1) return html;
      const cleanOrigin = baseOrigin.endsWith('/') ? baseOrigin : (baseOrigin + '/');
      const tag = '<base href="' + escHtml(cleanOrigin) + '" />';
      const headIdx = low.indexOf('<head');
      if (headIdx !== -1) {
        const gtIdx = html.indexOf('>', headIdx);
        if (gtIdx !== -1) return html.slice(0, gtIdx + 1) + tag + html.slice(gtIdx + 1);
      }
      return tag + html;
    }

    async function fetchWithOneRetryPortal(url) {
      try {
        return await fetch(url, { cache: 'no-store' });
      } catch (err) {
        await new Promise(r => setTimeout(r, 350));
        return await fetch(url, { cache: 'no-store' });
      }
    }

    async function openPortalDocPreview(opts) {
      const m = document.getElementById('portalDocModal');
      const frame = document.getElementById('portalDocFrame');
      const loader = document.getElementById('portalDocLoading');
      if (!m || !frame) return;

      const reqSeq = ++portalPreviewSeq;
      currentPortalDocState = opts || {};
      document.getElementById('portalDocTitle').innerText = opts.title || 'معاينة المستند';
      document.getElementById('portalDocSubtitle').innerText = opts.subtitle || 'معاينة مباشرة قبل الطباعة أو التحميل';

      const htmlStr = opts.htmlContent || (opts.htmlB64 ? decodeB64Utf8(opts.htmlB64) : '');
      if (htmlStr) {
        if (loader) loader.style.display = 'none';
        frame.removeAttribute('src');
        frame.srcdoc = htmlStr;
        m.style.display = 'flex';
        if (opts.autoPrint) {
          setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} }, 350);
        }
        return;
      }

      if (opts.url) {
        const resolvedUrl = resolvePortalUrl(opts.url);
        frame.removeAttribute('srcdoc');
        frame.src = 'about:blank';
        if (loader) {
          loader.innerHTML = '<span>⏳ جاري تحميل المعاينة المباشرة...</span>';
          loader.style.display = 'flex';
        }
        m.style.display = 'flex';
        try {
          const resp = await fetchWithOneRetryPortal(resolvedUrl);
          if (reqSeq !== portalPreviewSeq) return;
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const ct = (resp.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('text/html')) {
            const docHtml = await resp.text();
            if (reqSeq !== portalPreviewSeq) return;
            const originBase = API_BASE || window.location.origin;
            frame.removeAttribute('src');
            frame.srcdoc = injectBaseHrefPortal(docHtml, originBase);
            if (loader) loader.style.display = 'none';
            if (opts.autoPrint) {
              setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} }, 350);
            }
          } else {
            frame.onload = () => {
              if (reqSeq !== portalPreviewSeq) return;
              if (loader) loader.style.display = 'none';
              if (opts.autoPrint) {
                setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} }, 350);
              }
            };
            frame.src = resolvedUrl;
          }
        } catch (err) {
          if (reqSeq !== portalPreviewSeq) return;
          frame.removeAttribute('srcdoc');
          frame.src = 'about:blank';
          if (loader) {
            loader.innerHTML = '<div style="text-align:center; padding:24px; max-width:520px; line-height:1.8;">' +
              '<div style="font-size:28px; margin-bottom:8px;">⚠️</div>' +
              '<div style="font-size:15px; font-weight:800; color:#f8fafc; margin-bottom:6px;">تعذر تحميل المعاينة من الخادم المحلي (127.0.0.1:4000)</div>' +
              '<div style="font-size:12.5px; color:#cbd5e1; margin-bottom:14px;">تأكد من تشغيل خادم الوكيل عبر <code>START_QALIX_MEDICAL_AGENT.bat</code> ثم اضغط إعادة المحاولة، أو استخدم الوثائق المدمجة أوفلاين من القائمة.</div>' +
              '<button type="button" onclick="openPortalDocPreview(currentPortalDocState)" style="padding:8px 18px; border-radius:8px; background:#0ea5e9; color:#fff; border:none; font-weight:700; cursor:pointer;">🔄 إعادة المحاولة الآن</button>' +
              '</div>';
            loader.style.display = 'flex';
          }
        }
        return;
      }
      m.style.display = 'flex';
    }

    function downloadPortalDoc() {
      if (!currentPortalDocState) return;
      triggerPortalDownload(currentPortalDocState);
    }

    function printPortalDoc() {
      const frame = document.getElementById('portalDocFrame');
      if (!frame) return;
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (_) {
        openPortalDocNewTab();
      }
    }

    function openPortalDocNewTab() {
      if (!currentPortalDocState) return;
      const htmlStr = currentPortalDocState.htmlContent || (currentPortalDocState.htmlB64 ? decodeB64Utf8(currentPortalDocState.htmlB64) : '');
      if (htmlStr) {
        const w = window.open('', '_blank');
        if (w) {
          w.document.open();
          w.document.write(htmlStr);
          w.document.close();
          return;
        }
        const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
        window.open(URL.createObjectURL(blob), '_blank');
        return;
      }
      if (currentPortalDocState.url) {
        window.open(resolvePortalUrl(currentPortalDocState.url), '_blank');
      }
    }

    function closePortalDocModal(e) {
      if (e.target && e.target.id === 'portalDocModal') closePortalDocDirect();
    }

    function closePortalDocDirect() {
      portalPreviewSeq++;
      const m = document.getElementById('portalDocModal');
      const frame = document.getElementById('portalDocFrame');
      if (m) m.style.display = 'none';
      if (frame) {
        frame.removeAttribute('srcdoc');
        frame.src = 'about:blank';
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePortalDocDirect();
    });

    function printBattleCardA4(autoPrint) {
      openPortalDocPreview({
        title: '⚖️ بطاقة المقارنة التنافسية (A4 Battle Card)',
        subtitle: 'معاينة وطباعة بطاقة التوفير التنافسية مقابل الأنظمة السحابية',
        htmlB64: BATTLE_CARD_B64,
        downloadFilename: 'Qalix-Competitive-Battle-Card.html',
        autoPrint: Boolean(autoPrint)
      });
    }

    const DOCTOR_CATALOG_DOCS = {
      catalog: {
        title: '📖 كتالوج الاستخدام المختصر للطبيب (أوفلاين A4)',
        subtitle: 'دليل الاستخدام اليومي وخطوات البدء السريعة لتسليمها للطبيب (يعمل أوفلاين بالكامل)',
        htmlB64: DOC_CATALOG_B64,
        downloadFilename: 'Qalix-Doctor-Quick-Catalog-A4.html'
      },
      quickstart: {
        title: '📄 دليل التشغيل السريع الرسمي للمنشأة (HTML)',
        subtitle: 'النسخة الرسمية الكاملة لتشغيل العيادة والشبكة المحلية',
        htmlB64: QUICK_START_B64,
        url: '/legal-docs/دليل_التشغيل_السريع_للمنشأة.html',
        downloadUrl: '/legal-docs/دليل_التشغيل_السريع_للمنشأة.html?download=1',
        downloadFilename: 'دليل_التشغيل_السريع_للمنشأة.html'
      },
      pdfguide: {
        title: '📘 دليل المدير المصور لمنظومة كالكس الطبية (PDF)',
        subtitle: 'معاينة الدليل المصور الكامل أو تحميل ملف PDF على جهاز العيادة',
        url: '/legal-docs/دليل_المدير_المصور.pdf',
        downloadUrl: '/legal-docs/دليل_المدير_المصور.pdf?download=1',
        downloadFilename: 'دليل_المدير_المصور.pdf'
      },
      warranty: {
        title: '🛡️ شهادة الضمان والتسليم السيادي للمنظومة',
        subtitle: 'شهادة الضمان الفني لمدة 12 شهراً وسيادة البيانات أوفلاين 100%',
        htmlB64: WARRANTY_CERT_B64,
        url: '/legal-docs/شهادة_الضمان_والتسليم_السيادي.html',
        downloadUrl: '/legal-docs/شهادة_الضمان_والتسليم_السيادي.html?download=1',
        downloadFilename: 'شهادة_الضمان_والتسليم_السيادي.html'
      }
    };

    function openDoctorCatalogDoc(key, mode) {
      const item = DOCTOR_CATALOG_DOCS[key] || DOCTOR_CATALOG_DOCS.catalog;
      if (mode === 'download') {
        triggerPortalDownload(item);
      } else {
        openPortalDocPreview(item);
      }
    }

    function handleDoctorCatalogSelection(mode) {
      const sel = document.getElementById('doctorCatalogActionSelect');
      const key = sel ? sel.value : 'catalog';
      openDoctorCatalogDoc(key, mode || 'preview');
    }

    function openOfflineDoctorCatalog() { openDoctorCatalogDoc('catalog', 'preview'); }
    function openQuickStartDoc() { openDoctorCatalogDoc('quickstart', 'preview'); }
    function openDirectorPdfGuide() { openDoctorCatalogDoc('pdfguide', 'preview'); }
    function openWarrantyCertDoc() { openDoctorCatalogDoc('warranty', 'preview'); }

    const DIST_OFFICIAL_DOCS = {
      contract: {
        title: '📜 عقد التوزيع المستقل المعتمد (A4)',
        subtitle: 'عقد الموزع المعتمد (' + PORTAL_DIST.name + ' - ' + PORTAL_DIST.code + ') والالتزام بالأسعار الثابتة',
        url: '/api/contracts/distributor/' + encodeURIComponent(PORTAL_DIST.id),
        downloadUrl: '/api/contracts/distributor/' + encodeURIComponent(PORTAL_DIST.id) + '?download=1',
        downloadFilename: 'Qalix-Contract-' + PORTAL_DIST.code + '.html'
      },
      statement: {
        title: '💼 كشف الحساب المالي وسلسلة التدقيق (' + PORTAL_DIST.code + ')',
        subtitle: 'تفاصيل الصفقات والعمولات وصافي التوريد للوكيل',
        url: '/api/distributors/' + encodeURIComponent(PORTAL_DIST.id) + '/statement',
        downloadUrl: '/api/distributors/' + encodeURIComponent(PORTAL_DIST.id) + '/statement?download=1',
        downloadFilename: 'Qalix-Statement-' + PORTAL_DIST.code + '.html'
      },
      certificate: {
        title: '🏅 شهادة الاعتماد الميداني الرسمي (A4)',
        subtitle: 'شهادة اعتماد الموزع الميداني ' + PORTAL_DIST.name,
        url: '/api/training/certificate/' + encodeURIComponent(PORTAL_DIST.id),
        downloadUrl: '/api/training/certificate/' + encodeURIComponent(PORTAL_DIST.id) + '?download=1',
        downloadFilename: 'Qalix-Certificate-' + PORTAL_DIST.code + '.html'
      },
      letter: {
        title: '🎖️ خطاب شريحة التميز التجاري (A4)',
        subtitle: 'خطاب الترقية وشريحة العمولة الحالية للموزع ' + PORTAL_DIST.code,
        url: '/api/hierarchy/distributor/' + encodeURIComponent(PORTAL_DIST.id) + '/letter',
        downloadUrl: '/api/hierarchy/distributor/' + encodeURIComponent(PORTAL_DIST.id) + '/letter?download=1',
        downloadFilename: 'Qalix-Tier-Letter-' + PORTAL_DIST.code + '.html'
      },
      distcatalog: {
        title: '📘 كتالوج عمل الموزع الميداني المصور (من أ إلى ي)',
        subtitle: 'دليل الموزع الشامل مدعوماً بالصور لكل مراحل العمل الميداني أوفلاين',
        url: '/api/catalogs/distributor',
        downloadUrl: '/api/catalogs/distributor?download=1',
        downloadFilename: 'Qalix-Distributor-Field-Catalog-A-Z.html'
      }
    };

    function openDistDocByKey(key, mode) {
      const item = DIST_OFFICIAL_DOCS[key] || DIST_OFFICIAL_DOCS.contract;
      if (mode === 'download') {
        triggerPortalDownload(item);
      } else {
        openPortalDocPreview(item);
      }
    }

    function handleDistDocSelection(mode) {
      const sel = document.getElementById('distDocsActionSelect');
      const key = sel ? sel.value : 'contract';
      openDistDocByKey(key, mode || 'preview');
    }

    function buildTechSuccessPayload(requireNotice) {
      const clinic = (document.getElementById('techClinicName')?.value || '').trim();
      const doctor = (document.getElementById('techDoctorName')?.value || '').trim();
      const chkPc = Boolean(document.getElementById('chkPc')?.checked);
      const chkNet = Boolean(document.getElementById('chkNet')?.checked);
      const chkCat = Boolean(document.getElementById('chkCatalog')?.checked);
      const chkNotice = Boolean(document.getElementById('chkDocNotice')?.checked);

      if (!clinic || !doctor) {
        alert('يرجى إدخال اسم العيادة واسم الطبيب المُخطِر بإتمام التركيب.');
        return null;
      }
      if (requireNotice && !chkNotice) {
        alert('يرجى التأشير على خانة إخطار الطبيب/العيادة بإتمام العملية وتشغيل كافة الأجهزة بنجاح.');
        return null;
      }

      const nowStr = new Date().toLocaleString('ar-EG');
      const items = [
        (chkPc ? '✔' : '☐') + ' تنزيل المنظومة على الجهاز الرئيسي وتأمين كلمة المرور ومفتاح الاسترجاع',
        (chkNet ? '✔' : '☐') + ' ربط الراوتر المحلي والطابعة وهاتف الطبيب وشاشة الانتظار وبوابة المريض',
        (chkCat ? '✔' : '☐') + ' تدريب فريق العيادة وترك كتالوج استخدام المنظومة للطبيب',
        (chkNotice ? '✔' : '☐') + ' إخطار الطبيب للموزع بإتمام العملية وتشغيل كافة الأجهزة بنجاح'
      ];
      const msg = [
        '✅ *بطاقة تأكيد نجاح التركيب والتشغيل للوكيل — Qalix Medical Agent*',
        '━━━━━━━━━━━━━━━━━━━━',
        '🆔 *كود الموزع:* ' + PORTAL_DIST.code + ' — ' + PORTAL_DIST.name,
        '🏥 *العيادة / المركز:* ' + clinic,
        '👨‍⚕️ *الطبيب المُخطِر:* ' + doctor,
        '📅 *التاريخ والوقت:* ' + nowStr,
        '━━━━━━━━━━━━━━━━━━━━',
        ...items,
        '━━━━━━━━━━━━━━━━━━━━',
        'يؤكد الموزع للوكيل (' + (PORTAL_DIST.agentPhone || '') + ') إتمام التركيب والتدريب وترك الكتالوج وبناء رضا الطبيب 100%.'
      ].join('\\n');
      return { clinic, doctor, nowStr, items, msg };
    }

    function sendTechSuccessToAgentWhatsApp() {
      const data = buildTechSuccessPayload(true);
      if (!data) return;
      const url = 'https://wa.me/' + PORTAL_DIST.waAgentDigits + '?text=' + encodeURIComponent(data.msg);
      window.open(url, '_blank');
    }

    function copyTechSuccessCard() {
      const data = buildTechSuccessPayload(false);
      if (!data) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.msg).then(() => {
          alert('تم نسخ نص بطاقة تأكيد نجاح التشغيل بنجاح! جاهزة للإرسال للوكيل ' + (PORTAL_DIST.agentPhone || ''));
        });
      }
    }

    function openTechSuccessCardA4(autoPrint) {
      const data = buildTechSuccessPayload(true);
      if (!data) return;
      const listHtml = data.items.map(i => '<li style="padding:6px 0; border-bottom:1px dashed #cbd5e1;">' + escHtml(i) + '</li>').join('');
      const cardHtml = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقة تأكيد نجاح التشغيل للوكيل</title>' +
        '<style>@page{size:A4 portrait;margin:12mm;}body{font-family:Segoe UI,Tahoma,sans-serif;background:#f1f5f9;color:#0f172a;padding:24px;direction:rtl;margin:0;}' +
        '.doc{max-width:780px;margin:0 auto;background:#fff;border:2px solid #059669;border-radius:14px;padding:28px;}' +
        '.hdr{border-bottom:2px solid #0284c7;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}' +
        '.row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;font-size:13px;}' +
        '.box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px;}' +
        '.signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:24px;text-align:center;font-size:12px;}' +
        '.sign{border:1px dashed #94a3b8;border-radius:8px;padding:14px 8px;min-height:80px;}' +
        '@media print{body{background:#fff;padding:0;}.doc{border:1px solid #059669;}.no-print{display:none!important;}}</style></head><body>' +
        '<div class="doc"><div class="no-print" style="margin-bottom:14px;text-align:left;"><button id="btnPrintSuccessCard" style="padding:8px 16px;background:#059669;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">🖨️ طباعة البطاقة للوكيل (A4 / PDF)</button></div>' +
        '<div class="hdr"><div><h1 style="margin:0;font-size:20px;color:#059669;">✅ بطاقة تأكيد إتمام نجاح التركيب والتشغيل للوكيل</h1><div style="font-size:12px;color:#64748b;">' + escHtml(PORTAL_DIST.systemName || 'إدارة المبيعات والعمليات') + '</div></div><div style="font-size:12px;text-align:left;">الوكيل الرسمي:<br><strong dir="ltr">' + escHtml(PORTAL_DIST.agentPhone || '') + '</strong></div></div>' +
        '<div class="row"><div class="box"><strong>الموزع المعتمد المنفّذ:</strong><br>' + escHtml(PORTAL_DIST.name) + ' (' + escHtml(PORTAL_DIST.code) + ')</div><div class="box"><strong>تاريخ الاعتماد:</strong><br>' + escHtml(data.nowStr) + '</div>' +
        '<div class="box"><strong>العيادة / المنشأة الطبية:</strong><br>' + escHtml(data.clinic) + '</div><div class="box"><strong>الطبيب المُخطِر بالتمام:</strong><br>' + escHtml(data.doctor) + '</div></div>' +
        '<h3 style="margin:10px 0 6px;color:#0f172a;font-size:14.5px;">سجل الإنجاز الفني وإخطار الطبيب:</h3><ul style="list-style:none;padding:0;margin:0;font-size:13px;">' + listHtml + '</ul>' +
        '<div style="margin-top:14px;background:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#065f46;">يُقر الموزع بإتمام تشغيل كافة الأجهزة بالعيادة، وترك كتالوج الاستخدام للطبيب، وتلقي إخطار الطبيب بتمام النجاح.</div>' +
        '<div class="signs"><div class="sign"><strong>إخطار وموافقة الطبيب</strong><br><br>' + escHtml(data.doctor) + '</div><div class="sign"><strong>تأكيد وتوقيع الموزع المنفّذ</strong><br><br>' + escHtml(PORTAL_DIST.name) + ' (' + escHtml(PORTAL_DIST.code) + ')</div></div>' +
        '</div></body></html>';
      openPortalDocPreview({
        title: '✅ بطاقة تأكيد نجاح التركيب والتشغيل للوكيل (A4)',
        subtitle: 'معاينة وطباعة أو تحميل بطاقة إتمام التركيب وتوقيع الطبيب والموزع',
        htmlContent: cardHtml,
        downloadFilename: 'Qalix-Tech-Completion-Card-' + PORTAL_DIST.code + '.html',
        autoPrint: Boolean(autoPrint)
      });
    }

    // Automatically resolve local /api/ and /legal-docs/ links when the kit HTML is opened offline via file://
    if (API_BASE) {
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('a[href^="/api/"], a[href^="/legal-docs/"]').forEach(a => {
          a.setAttribute('href', API_BASE + a.getAttribute('href'));
        });
      });
    }

    function openQuotation() {
      const doc = encodeURIComponent(document.getElementById('quoDoctor').value.trim() || 'السيد الدكتور المحترم');
      const cln = encodeURIComponent(document.getElementById('quoClinic').value.trim() || 'العيادة التخصصية');
      const spec = document.getElementById('quoSpecialty').value;
      const tier = document.getElementById('quoTier').value;
      const gov = encodeURIComponent(PORTAL_DIST.governorate);
      const qs = \`doctor_name=\${doc}&clinic_name=\${cln}&specialty=\${spec}&tier=\${tier}&governorate=\${gov}&distributor_name=\${encodeURIComponent(PORTAL_DIST.name)}&distributor_code=\${encodeURIComponent(PORTAL_DIST.code)}&distributor_phone=\${encodeURIComponent(PORTAL_DIST.phone || '')}\`;
      const url = \`/api/quotations/generate?\${qs}\`;
      openPortalDocPreview({
        title: '📄 عرض السعر الرسمي المعتمد (A4 Official Quotation)',
        subtitle: 'معاينة عرض السعر باسم الموزع المعتمد قبل الطباعة أو التحميل',
        url,
        downloadUrl: \`\${url}&download=1\`,
        downloadFilename: 'Qalix-Official-Quotation-' + PORTAL_DIST.code + '.html'
      });
    }

    const rate = Number(PORTAL_DIST.rate);
    let currentReceiptDataUrl = '';
    let currentReceiptFilename = '';
    const WAITING_STORAGE_KEY = 'agent_waiting_requests_' + (PORTAL_DIST.systemId || 'default') + '_' + PORTAL_DIST.code;

    function loadWaitingRequests() {
      try { return JSON.parse(localStorage.getItem(WAITING_STORAGE_KEY) || '[]'); } catch { return []; }
    }
    function saveWaitingRequests(list) {
      try { localStorage.setItem(WAITING_STORAGE_KEY, JSON.stringify(list.slice(0, 30))); } catch {}
      renderWaitingRequests();
      if (typeof renderDistTeamUi === 'function') renderDistTeamUi();
    }

    function handlePortalReceiptUpload(input) {
      const file = input.files && input.files[0];
      if (!file) { currentReceiptDataUrl = ''; currentReceiptFilename = ''; return; }
      currentReceiptFilename = file.name;
      const box = document.getElementById('payReceiptPreviewBox');
      const imgEl = document.getElementById('payReceiptImg');
      const metaEl = document.getElementById('payReceiptMeta');
      const reader = new FileReader();
      reader.onload = function(ev) {
        const raw = ev.target.result || '';
        if (file.type && file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = function() {
            const maxDim = 960;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
              const sc = Math.min(maxDim / w, maxDim / h);
              w = Math.round(w * sc); h = Math.round(h * sc);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            currentReceiptDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            if (imgEl) { imgEl.src = currentReceiptDataUrl; imgEl.style.display = 'inline-block'; }
            if (metaEl) metaEl.innerText = '✔ تم تجهيز صورة الريسيت: ' + file.name;
            if (box) box.style.display = 'block';
          };
          img.src = raw;
        } else {
          currentReceiptDataUrl = raw;
          if (imgEl) imgEl.style.display = 'none';
          if (metaEl) metaEl.innerText = '📄 تم إرفاق ملف الإيصال: ' + file.name;
          if (box) box.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }

    function buildRequestText(reqCodeOpt) {
      const c = document.getElementById('cName').value.trim() || 'غير محدد';
      const d = document.getElementById('dName').value.trim() || 'غير محدد';
      const hw = document.getElementById('hwId').value.trim() || 'غير محدد';
      const [, pStr] = document.getElementById('tierSel').value.split('|');
      const ch = document.getElementById('payChannel')?.value || 'إنستاباي (InstaPay)';
      const pref = document.getElementById('payRef')?.value.trim() || 'مرفق بالصورة في المحادثة';
      const repPick = document.getElementById('dealRepSelect')?.value || '';
      const techPick = document.getElementById('dealTechSelect')?.value || '';
      const price = Number(pStr);
      const comm = Math.round(price * rate / 100);
      const net = price - comm;
      const agPhone = PORTAL_DIST.agentPhone || '01000000000';
      return \`طلب تأكيد دفع بالريسيت وإصدار التفعيل — \${PORTAL_DIST.systemName || 'لوحة الوكيل'}\${reqCodeOpt ? '\\n• كود الطلب الموحد: ' + reqCodeOpt : ''}
• كود الموزع: \${PORTAL_DIST.code} (\${PORTAL_DIST.name})
• العميل / المنشأة: \${c}
• المسؤول والهاتف: \${d}
• مرجع التفعيل / HWID: \${hw}
• السعر الرسمي الثابت: \${price} ج.م
• عمولة الموزع (\${rate}%): \${comm} ج.م
• صافي التوريد للوكيل (\${agPhone}): \${net} ج.م
• طريقة الدفع: \${ch}
• رقم مرجع التحويل: \${pref}\${repPick ? '\\n• المندوب (الزيارة الأولى): ' + repPick : ''}\${techPick ? '\\n• الفني المكلّف (التنفيذ): ' + techPick : ''}\${currentReceiptFilename ? '\\n• ملف الريسيت المرفق: ' + currentReceiptFilename : ''}\`;
    }

    function getCandidateServerUrls() {
      const urls = [];
      if (window.location && window.location.protocol.startsWith('http')) urls.push(window.location.origin);
      if (PORTAL_DIST.serverUrl) urls.push(PORTAL_DIST.serverUrl);
      if (PORTAL_DIST.lanUrl) urls.push(PORTAL_DIST.lanUrl);
      return [...new Set(urls)];
    }

    async function tryFetchAgentApi(pathSuffix, fetchOpts) {
      const origins = getCandidateServerUrls();
      for (const base of origins) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2500);
          const res = await fetch(base.replace(/\\/+$/, '') + pathSuffix, { ...fetchOpts, signal: ctrl.signal });
          clearTimeout(timer);
          if (res.ok || res.status === 400 || res.status === 404) {
            return { origin: base, status: res.status, data: await res.json() };
          }
        } catch (_) {}
      }
      return null;
    }

    async function submitPaymentReceiptRequest(openWaFallback) {
      const customerName = document.getElementById('cName').value.trim();
      const contactName = document.getElementById('dName').value.trim();
      const hw = document.getElementById('hwId').value.trim();
      if (!customerName) return alert('يرجى إدخال اسم العميل أو المنشأة أولاً.');
      const [tierKey, pStr] = document.getElementById('tierSel').value.split('|');
      const ch = document.getElementById('payChannel')?.value || 'إنستاباي (InstaPay)';
      const pref = document.getElementById('payRef')?.value.trim() || '';
      if (!pref && !currentReceiptDataUrl) {
        return alert('يرجى إرفاق صورة ريسيت الدفع أو كتابة رقم مرجع عملية التحويل لتأكيد الدفع.');
      }
      const price = Number(pStr);
      const net = price - Math.round(price * rate / 100);
      const reqCode = 'REQ-' + Math.random().toString(16).slice(2, 8).toUpperCase();

      const msg = buildRequestText(reqCode);
      const box = document.getElementById('outMsg');
      if (box) box.value = msg;
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});

      const list = loadWaitingRequests();
      const entry = {
        reqCode,
        customerName,
        contactName,
        hw,
        tier: tierKey,
        agentNetAmount: net,
        paymentChannel: ch,
        paymentRef: pref || currentReceiptFilename,
        status: 'pending',
        deliveredLive: false,
        activationKey: '',
        createdAt: new Date().toISOString()
      };

      const repName = document.getElementById('dealRepSelect')?.value || '';
      const techName = document.getElementById('dealTechSelect')?.value || '';
      const notesStr = [repName ? ('المندوب: ' + repName) : '', techName ? ('الفني: ' + techName) : ''].filter(Boolean).join(' | ');

      const apiRes = await tryFetchAgentApi('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reqCode,
          distributorId: PORTAL_DIST.id,
          distributorCode: PORTAL_DIST.code,
          customerName,
          contactName,
          hardwareOrRef: hw,
          tier: tierKey,
          paymentChannel: ch,
          paymentRef: pref,
          repName,
          techName,
          notes: notesStr,
          receiptFilename: currentReceiptFilename,
          receiptDataUrl: currentReceiptDataUrl
        })
      });

      if (repName || techName) {
        try {
          upsertWorkflowTaskFromDeal({ customerName, contactName, repName, techName, reqCode });
        } catch (_) {}
      }

      if (apiRes && apiRes.data && apiRes.data.ok) {
        entry.deliveredLive = true;
        list.unshift(entry);
        saveWaitingRequests(list);
        alert('✅ تم إرسال طلب الدفع والريسيت مباشرة إلى لوحة الوكيل بكود (' + reqCode + ')! حالة الطلب الآن: بانتظار تأكيد الدفع وإصدار المفتاح.');
      } else {
        list.unshift(entry);
        saveWaitingRequests(list);
        if (openWaFallback) {
          alert('📲 تعذر الاتصال المباشر بالشبكة؛ تم حفظ الطلب بكود (' + reqCode + ') في قائمة الانتظار، وسيفتح واتساب الآن لإرفاق صورة الريسيت للوكيل.');
          window.open('https://wa.me/' + PORTAL_DIST.waAgentDigits + '?text=' + encodeURIComponent(msg), '_blank');
        }
      }
    }

    async function pollSingleRequest(reqCode) {
      const apiRes = await tryFetchAgentApi('/api/payment-requests/status?reqCode=' + encodeURIComponent(reqCode), { method: 'GET' });
      if (!apiRes || !apiRes.data || !apiRes.data.ok) {
        return alert('لم يتم الوصول لخادم الوكيل حالياً أو الطلب غير مسجل بعد.');
      }
      const srvReq = apiRes.data.request;
      const list = loadWaitingRequests();
      const item = list.find(x => x.reqCode === reqCode);
      if (item) {
        item.status = srvReq.status;
        if (srvReq.activation_key) item.activationKey = srvReq.activation_key;
        if (srvReq.notes) item.notes = srvReq.notes;
        saveWaitingRequests(list);
      }
    }

    async function refreshAllWaitingRequests() {
      const list = loadWaitingRequests();
      for (const item of list) {
        if (item.status === 'pending') {
          const apiRes = await tryFetchAgentApi('/api/payment-requests/status?reqCode=' + encodeURIComponent(item.reqCode), { method: 'GET' });
          if (apiRes && apiRes.data && apiRes.data.ok) {
            item.status = apiRes.data.request.status;
            if (apiRes.data.request.activation_key) item.activationKey = apiRes.data.request.activation_key;
            if (apiRes.data.request.notes) item.notes = apiRes.data.request.notes;
          }
        }
      }
      saveWaitingRequests(list);
    }

    function applyManualActivationKey(reqCode) {
      const inp = document.getElementById('manualKey_' + reqCode);
      const val = inp ? inp.value.trim() : '';
      if (!val) return alert('أدخل مفتاح التفعيل الوارد من الوكيل أولاً.');
      const list = loadWaitingRequests();
      const item = list.find(x => x.reqCode === reqCode);
      if (item) {
        item.status = 'approved';
        item.activationKey = val;
        saveWaitingRequests(list);
      }
    }

    function renderWaitingRequests() {
      const el = document.getElementById('waitingKeysContainer');
      if (!el) return;
      const list = loadWaitingRequests();
      if (!list.length) {
        el.innerHTML = '<div style="font-size:12.5px; color:var(--muted);">لا توجد طلبات دفع مرسلة حتى الآن. بمجرد إرسال الريسيت سيظهر الطلب هنا بانتظار مفتاح التفعيل من الوكيل.</div>';
        return;
      }
      el.innerHTML = list.map(r => {
        const badge = r.status === 'approved'
          ? '<span style="background:rgba(16,185,129,0.2); color:#34d399; padding:3px 10px; border-radius:999px; font-size:11.5px; font-weight:bold;">✅ مؤكد الدفع · تم إصدار المفتاح</span>'
          : (r.status === 'rejected'
            ? '<span style="background:rgba(244,63,94,0.2); color:#fb7185; padding:3px 10px; border-radius:999px; font-size:11.5px; font-weight:bold;">❌ مرفوض / يرجى المراجعة</span>'
            : '<span style="background:rgba(245,158,11,0.2); color:#fbbf24; padding:3px 10px; border-radius:999px; font-size:11.5px; font-weight:bold;">⏳ بانتظار تأكيد الدفع من الوكيل</span>');
        return \`<div class="sub-card" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; margin-bottom:0;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <strong style="color:var(--sky); font-family:monospace;" dir="ltr">\${r.reqCode}</strong>
              \${badge}
              \${r.deliveredLive ? '<span style="font-size:11px; color:var(--accent);">📡 وصل للوحة الوكيل</span>' : ''}
            </div>
            <div style="font-size:12.5px;">العميل: <strong>\${r.customerName}</strong> · صافي التوريد: <strong>\${r.agentNetAmount} ج.م</strong> (\${r.paymentChannel})</div>
            \${r.activationKey ? \`<div style="margin-top:6px; background:rgba(16,185,129,0.12); border:1px solid var(--accent); padding:6px 10px; border-radius:8px; font-size:13px;">🔑 مفتاح التفعيل الصادر: <strong style="font-family:monospace; color:#34d399;" dir="ltr">\${r.activationKey}</strong></div>\` : ''}
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            \${r.status !== 'approved' ? \`
              <button type="button" onclick="pollSingleRequest('\${r.reqCode}')" class="btn-blue" style="padding:6px 10px; font-size:11.5px; color:#fff;">🔄 فحص الحالة</button>
              <input id="manualKey_\${r.reqCode}" placeholder="أو الصق المفتاح من الواتس..." style="width:165px; padding:6px; font-size:11.5px; margin:0;" dir="ltr" />
              <button type="button" onclick="applyManualActivationKey('\${r.reqCode}')" style="padding:6px 10px; font-size:11.5px;">✔ حفظ</button>
            \` : ''}
          </div>
        </div>\`;
      }).join('');
    }
    setTimeout(renderWaitingRequests, 50);

    function genRequest() {
      const msg = buildRequestText();
      const box = document.getElementById('outMsg');
      box.value = msg;
      box.select();
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
      alert('تم توليد ونسخ رسالة طلب التفعيل والتوريد! يمكنك إرسالها الآن لواتساب الوكيل ' + (PORTAL_DIST.agentPhone || ''));
    }

    function sendRequestToAgentWa() {
      const msg = buildRequestText();
      const box = document.getElementById('outMsg');
      if (box) box.value = msg;
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
      window.open('https://wa.me/' + PORTAL_DIST.waAgentDigits + '?text=' + encodeURIComponent(msg), '_blank');
    }

    function toggleDistAgentFields() {
      const type = document.getElementById('distAgentActionType')?.value || 'remittance';
      const isRemit = type === 'remittance';
      const amtWrap = document.getElementById('distAgentAmountWrap');
      const chWrap = document.getElementById('distAgentChannelWrap');
      if (amtWrap) amtWrap.style.display = isRemit ? 'block' : 'none';
      if (chWrap) chWrap.style.display = isRemit ? 'block' : 'none';
    }

    function buildDistributorFeedbackMsg() {
      const typeEl = document.getElementById('distAgentActionType');
      const type = typeEl ? typeEl.value : 'remittance';
      const typeLabel = typeEl?.options[typeEl.selectedIndex]?.text || 'مراسلة من الموزع للوكيل';
      const subj = (document.getElementById('distAgentSubject')?.value || '').trim();
      const amt = (document.getElementById('distAgentAmount')?.value || '').trim();
      const remitRef = (document.getElementById('distAgentRemitRef')?.value || '').trim();
      const body = (document.getElementById('distAgentBody')?.value || '').trim();
      if (!subj && !body && !amt) {
        alert('يرجى كتابة موضوع المراسلة أو التفاصيل أو المبلغ المورد أولاً.');
        return null;
      }
      const lines = [
        \`📩 *\${typeLabel}*\`,
        \`• الموزع المرسل: \${PORTAL_DIST.name} (\${PORTAL_DIST.code})\${PORTAL_DIST.phone ? ' · ' + PORTAL_DIST.phone : ''}\`,
        \`• المحافظة: \${PORTAL_DIST.governorate}\`
      ];
      if (subj) lines.push(\`• العنوان / العيادة: \${subj}\`);
      if (type === 'remittance') {
        if (amt) lines.push(\`• المبلغ المورد للوكيل: \${amt} ج.م\`);
        if (remitRef) lines.push(\`• قناة ومرجع التحويل: \${remitRef}\`);
      }
      if (body) lines.push(\`• التفاصيل والرد:\\n\${body}\`);
      lines.push(\`• التاريخ: \${new Date().toLocaleString('ar-EG')}\`);
      return lines.join('\\n');
    }

    function sendDistributorFeedbackToAgentWa() {
      const msg = buildDistributorFeedbackMsg();
      if (!msg) return;
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
      window.open('https://wa.me/' + PORTAL_DIST.waAgentDigits + '?text=' + encodeURIComponent(msg), '_blank');
    }

    function copyDistributorFeedbackMsg() {
      const msg = buildDistributorFeedbackMsg();
      if (!msg) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).then(() => {
          alert('تم نسخ نص الرسالة للوكيل بنجاح!');
        });
      }
    }

    function getPitchText(id) {
      const contactLine = PORTAL_DIST.name + (PORTAL_DIST.phone ? ' (' + PORTAL_DIST.phone + ')' : '');
      if (id === 1) {
        return \`السلام عليكم دكتورنا العزيز 🌹\\nمع حضرتك الموزع المعتمد لمنظومة "كالكس ميديكال" الطبية (\${PORTAL_DIST.name} - \${PORTAL_DIST.code}).\\n\\nحبينا نهدي عيادتكم نسخة تجريبية كاملة مجانية لمدة 14 يوماً من أحدث منظومة طبية في مصر:\\n✅ تعمل 100% بدون نت لحماية خصوصية وسرية أرباحك.\\n✅ شاشة انتظار ونداء صوتي ذكي يفتح على موبايل المريض.\\n✅ فاحص تداخلات دوائية وحماية للمريض.\\n✅ محادثات داخلية صوتية بين العيادة والاستقبال.\\n\\nرابط تثبيت النسخة التجريبية:\\n\${PORTAL_DIST.megaTrialUrl}\\n(دخول: admin / كلمة سر: Qalix@11)\\n\\nلأي استفسار أو طلب زيارة لتثبيتها لحضرتك مجاناً تواصل مباشرة مع الموزع المعتمد: \${contactLine}\`;
      } else {
        return \`دكتورنا العزيز، ليه تدفع أكثر من 50,000 جنيه في 3 سنوات لاشتراكات البرامج السحابية، ولو النت فصل العيادة تقف، وإيرادك مكشوف على سيرفرات برة؟\\n\\nفي "كالكس ميديكال" ترخيص دائم مدى الحياة بدفعة واحدة بدون أي اشتراك شهري، وتعمل 100% أوفلاين وقاعدتها مشفرة عسكرياً جوة جهازك.\\nللتجربة المجانية 14 يوماً تواصل مباشرة مع الموزع المعتمد: \${contactLine}\`;
      }
    }

    function openPitchWhatsApp(id) {
      const text = encodeURIComponent(getPitchText(id));
      window.open('https://api.whatsapp.com/send?text=' + text, '_blank');
    }

    function copyPitch(id) {
      const t = getPitchText(id);
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      alert('تم نسخ الرسالة بنجاح! جاهزة للإرسال في واتساب.');
    }

    /* ==================== DISTRIBUTOR FIELD TEAM (REPS & TECHNICIANS) & 2-STAGE WORKFLOW ==================== */
    const TEAM_MEMBERS_KEY = 'dist_team_members_' + (PORTAL_DIST.systemId || 'default') + '_' + PORTAL_DIST.code;
    const TEAM_TASKS_KEY = 'dist_field_tasks_' + (PORTAL_DIST.systemId || 'default') + '_' + PORTAL_DIST.code;
    let activeTeamRoleFilter = 'all';

    function loadDistTeamMembers() {
      try { return JSON.parse(localStorage.getItem(TEAM_MEMBERS_KEY) || '[]'); } catch { return []; }
    }
    function saveDistTeamMembers(arr) {
      try { localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(arr.slice(0, 100))); } catch {}
      renderDistTeamUi();
    }
    function loadDistFieldTasks() {
      try { return JSON.parse(localStorage.getItem(TEAM_TASKS_KEY) || '[]'); } catch { return []; }
    }
    function saveDistFieldTasks(arr) {
      try { localStorage.setItem(TEAM_TASKS_KEY, JSON.stringify(arr.slice(0, 150))); } catch {}
      renderDistTeamUi();
    }

    function setTeamRoleFilter(role) {
      activeTeamRoleFilter = role || 'all';
      renderDistTeamUi();
    }

    async function syncTeamMemberToAgent(member) {
      await tryFetchAgentApi('/api/field-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          distributorId: PORTAL_DIST.id,
          distributorCode: PORTAL_DIST.code,
          name: member.name,
          role: member.role,
          phone: member.phone,
          zone: member.zone,
          fee: member.fee,
          status: member.status
        })
      });
    }

    function addDistTeamMember() {
      const name = (document.getElementById('tmName')?.value || '').trim();
      const role = document.getElementById('tmRole')?.value || 'rep';
      const phone = (document.getElementById('tmPhone')?.value || '').trim();
      const zone = (document.getElementById('tmZone')?.value || '').trim() || PORTAL_DIST.governorate;
      const fee = Number(document.getElementById('tmFee')?.value || 0);
      if (!name) return alert('يرجى إدخال اسم المندوب أو الفني.');
      const list = loadDistTeamMembers();
      const member = {
        id: 'tm_' + Math.random().toString(16).slice(2, 8),
        name,
        role,
        phone,
        zone,
        fee,
        status: 'available',
        createdAt: new Date().toISOString()
      };
      list.unshift(member);
      document.getElementById('tmName').value = '';
      document.getElementById('tmPhone').value = '';
      saveDistTeamMembers(list);
      syncTeamMemberToAgent(member);
    }

    function toggleTeamMemberStatus(id) {
      const list = loadDistTeamMembers();
      const item = list.find(x => x.id === id);
      if (!item) return;
      const order = ['available', 'busy', 'off'];
      const next = order[(order.indexOf(item.status) + 1) % order.length];
      item.status = next;
      saveDistTeamMembers(list);
      syncTeamMemberToAgent(item);
    }

    function removeTeamMember(id) {
      if (!confirm('حذف هذا العضو من قائمة الفريق؟')) return;
      saveDistTeamMembers(loadDistTeamMembers().filter(x => x.id !== id));
      tryFetchAgentApi('/api/field-team/' + encodeURIComponent(id), { method: 'DELETE' });
    }

    function messageTeamMemberWa(phone, text) {
      const digits = String(phone || '').replace(/[^0-9]/g, '');
      const waPhone = digits.startsWith('0') ? '2' + digits : digits;
      const url = waPhone
        ? ('https://wa.me/' + waPhone + '?text=' + encodeURIComponent(text))
        : ('https://api.whatsapp.com/send?text=' + encodeURIComponent(text));
      window.open(url, '_blank');
    }

    async function addFieldWorkflowTask() {
      const customerName = (document.getElementById('wfCustomerName')?.value || '').trim();
      const customerInfo = (document.getElementById('wfCustomerPhone')?.value || '').trim();
      const repName = document.getElementById('wfRepSelect')?.value || '';
      const techName = document.getElementById('wfTechSelect')?.value || '';
      const notes = (document.getElementById('wfNotes')?.value || '').trim();
      if (!customerName) return alert('يرجى إدخال اسم العميل أو المنشأة.');
      const list = loadDistFieldTasks();
      const taskObj = {
        id: 'wf_' + Math.random().toString(16).slice(2, 8),
        reportCode: 'CASE-' + Math.random().toString(16).slice(2, 8).toUpperCase(),
        customerName,
        customerInfo,
        repName,
        repAction: repName ? ('تم تكليف المندوب ' + repName + ' بالزيارة الأولى') : '',
        techName,
        techAction: '',
        stage: 'rep_pending',
        reqCode: '',
        activationKey: '',
        notes,
        createdAt: new Date().toISOString()
      };
      list.unshift(taskObj);
      document.getElementById('wfCustomerName').value = '';
      document.getElementById('wfCustomerPhone').value = '';
      document.getElementById('wfNotes').value = '';
      saveDistFieldTasks(list);
      await syncUnifiedCasePayload(taskObj, 'distributor', PORTAL_DIST.name, 'إدراج عميل جديد وتكليف المندوب للزيارة الأولى');
    }

    async function syncUnifiedCasePayload(t, actorRole, actorName, actionText) {
      const res = await tryFetchAgentApi('/api/unified-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseCode: t.reportCode || t.id,
          distributorId: PORTAL_DIST.id,
          distributorCode: PORTAL_DIST.code,
          customerName: t.customerName,
          contactInfo: t.customerInfo || '',
          governorate: PORTAL_DIST.governorate,
          systemName: PORTAL_DIST.systemName,
          repName: t.repName || '',
          repAction: t.repAction || '',
          techName: t.techName || '',
          techAction: t.techAction || '',
          trialCode: t.reportCode || '',
          trialDevice: t.trialDevice || '',
          trialStartDate: t.trialStartDate || '',
          trialEndDate: t.trialEndDate || '',
          paymentReqCode: t.reqCode || '',
          activationKey: t.activationKey || '',
          stage: t.stage || 'rep_pending',
          outcome: t.notes || actionText || '',
          actorRole: actorRole || 'distributor',
          actorName: actorName || PORTAL_DIST.name,
          actionText: actionText || ''
        })
      });
      return Boolean(res && res.data && res.data.ok);
    }

    async function logUnifiedActionPrompt(taskId, role) {
      const list = loadDistFieldTasks();
      const t = list.find(x => x.id === taskId);
      if (!t) return;
      const defaultTxt = role === 'rep'
        ? 'تمت زيارة العميل ميدانياً وشرح المزايا وتسليمه النسخة التجريبية / عرض السعر'
        : 'تم تركيب المنظومة للعميل وربط الشبكة وإتمام التدريب بنجاح 100%';
      const lbl = role === 'rep' ? ('ماذا فعل المندوب (' + (t.repName || 'المندوب') + ') مع "' + t.customerName + '"؟') : ('ماذا فعل الفني (' + (t.techName || 'الفني') + ') لدى "' + t.customerName + '"؟');
      const act = prompt(lbl, role === 'rep' ? (t.repAction || defaultTxt) : (t.techAction || defaultTxt));
      if (!act || !act.trim()) return;
      if (role === 'rep') {
        t.repAction = act.trim();
        if (t.stage === 'rep_pending' || t.stage === 'trial_installed') t.stage = 'rep_visited';
      } else {
        t.techAction = act.trim();
        if (t.stage === 'tech_assigned') t.stage = 'completed';
      }
      t.agentNotifiedAt = new Date().toLocaleString('ar-EG');
      saveDistFieldTasks(list);
      const ok = await syncUnifiedCasePayload(t, role, role === 'rep' ? (t.repName || 'المندوب') : (t.techName || 'الفني'), act.trim());
      if (ok) alert('✅ تم توثيق ما أنجزه ' + (role === 'rep' ? 'المندوب' : 'الفني') + ' وربطه مباشرة في لوحة الوكيل ومدير الوكلاء!');
    }

    async function syncUnifiedPortalFromAgent(showAlert) {
      for (const m of loadDistTeamMembers()) await syncTeamMemberToAgent(m);
      for (const t of loadDistFieldTasks()) await syncUnifiedCasePayload(t, 'distributor', PORTAL_DIST.name, '');
      const [ftRes, upRes] = await Promise.all([
        tryFetchAgentApi('/api/field-team?distributorId=' + encodeURIComponent(PORTAL_DIST.id), { method: 'GET' }),
        tryFetchAgentApi('/api/unified-pipeline?distributorId=' + encodeURIComponent(PORTAL_DIST.id), { method: 'GET' })
      ]);
      if (ftRes && ftRes.data && ftRes.data.ok && Array.isArray(ftRes.data.members) && ftRes.data.members.length) {
        saveDistTeamMembers(ftRes.data.members);
      }
      if (upRes && upRes.data && upRes.data.ok && Array.isArray(upRes.data.cases) && upRes.data.cases.length) {
        const localTasks = loadDistFieldTasks();
        for (const sc of upRes.data.cases) {
          let match = localTasks.find(x => (x.reportCode && x.reportCode === sc.case_code) || x.customerName === sc.customer_name);
          if (!match) {
            match = { id: sc.id, createdAt: sc.created_at };
            localTasks.push(match);
          }
          match.reportCode = sc.case_code;
          match.customerName = sc.customer_name;
          match.customerInfo = sc.contact_info || match.customerInfo;
          match.repName = sc.rep_name || match.repName;
          match.repAction = sc.rep_action || match.repAction;
          match.techName = sc.tech_name || match.techName;
          match.techAction = sc.tech_action || match.techAction;
          match.activationKey = sc.activation_key || match.activationKey;
          match.reqCode = sc.payment_req_code || match.reqCode;
          match.dealNo = sc.deal_no || match.dealNo;
          match.stage = sc.stage || match.stage;
          match.notes = sc.outcome || match.notes;
          match.agentNotifiedAt = sc.updated_at;
        }
        saveDistFieldTasks(localTasks);
      }
      if (showAlert) alert('✅ تمت مزامنة السجل الموحد والفريق الميداني مع لوحة الوكيل بنجاح.');
    }
    setTimeout(() => syncUnifiedPortalFromAgent(false), 400);

    function upsertWorkflowTaskFromDeal(info) {
      const list = loadDistFieldTasks();
      const existing = list.find(x => x.customerName === info.customerName && x.stage !== 'completed');
      if (existing) {
        if (info.repName) existing.repName = info.repName;
        if (info.techName) existing.techName = info.techName;
        if (info.reqCode) existing.reqCode = info.reqCode;
        existing.stage = 'tech_assigned';
      } else {
        list.unshift({
          id: 'wf_' + Math.random().toString(16).slice(2, 8),
          customerName: info.customerName,
          customerInfo: info.contactName || '',
          repName: info.repName || '',
          techName: info.techName || '',
          stage: info.techName ? 'tech_assigned' : 'rep_visited',
          reqCode: info.reqCode || '',
          activationKey: '',
          notes: 'مرتبط بطلب تفعيل ' + (info.reqCode || ''),
          createdAt: new Date().toISOString()
        });
      }
      saveDistFieldTasks(list);
    }

    const STAGE_LABELS_PORTAL = {
      trial_installed: '🧪 مرحلة التجريب (تم تثبيت النسخة التجريبية)',
      rep_pending: '1️⃣ بانتظار زيارة المندوب الأولى',
      rep_visited: '🤝 زاره المندوب (متابعة / بانتظار الدفع)',
      tech_assigned: '2️⃣ لدى الفني للتنفيذ والتشغيل',
      completed: '✅ منجز ومفعّل بالكامل 100%'
    };

    function composeTaskAgentCardMessage(t) {
      const stageTxt = STAGE_LABELS_PORTAL[t.stage] || t.stage;
      return [
        '📡 *بطاقة متابعة وتحديث مرحلة للوكيل — ' + PORTAL_DIST.systemName + '*',
        '• كود المتابعة: ' + (t.reportCode || t.id),
        '• الموزع: ' + PORTAL_DIST.name + ' (' + PORTAL_DIST.code + ') · ' + PORTAL_DIST.governorate,
        '• العميل / الجهة: ' + t.customerName + (t.customerInfo ? ' (' + t.customerInfo + ')' : ''),
        t.trialDevice ? ('• مرجع النسخة التجريبية: ' + t.trialDevice) : '',
        t.trialStartDate ? ('• فترة التجريب (14 يوماً): من ' + t.trialStartDate + ' إلى ' + (t.trialEndDate || '')) : '',
        '• المرحلة الحالية المحدّثة: ' + stageTxt,
        t.repName ? ('• 1️⃣ المندوب: ' + t.repName) : '',
        t.techName ? ('• 2️⃣ الفني: ' + t.techName) : '',
        t.notes ? ('• ملاحظات: ' + t.notes) : '',
        '• وقت تحديث البطاقة: ' + new Date().toLocaleString('ar-EG')
      ].filter(Boolean).join('\\n');
    }

    async function sendTaskUpdateToAgentApi(t, forceOpenWa) {
      const cardMsg = composeTaskAgentCardMessage(t);
      const apiRes = await tryFetchAgentApi('/api/trial-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCode: t.reportCode || t.id.toUpperCase(),
          distributorId: PORTAL_DIST.id,
          distributorCode: PORTAL_DIST.code,
          customerName: t.customerName,
          contactInfo: t.customerInfo || '',
          governorate: PORTAL_DIST.governorate,
          systemName: PORTAL_DIST.systemName,
          trialDeviceOrId: t.trialDevice || '',
          trialStartDate: t.trialStartDate || new Date().toISOString().slice(0, 10),
          trialEndDate: t.trialEndDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          stage: t.stage,
          repName: t.repName || '',
          techName: t.techName || '',
          cardSummary: STAGE_LABELS_PORTAL[t.stage] || t.stage,
          notes: t.notes || ''
        })
      });
      const list = loadDistFieldTasks();
      const target = list.find(x => x.id === t.id);
      if (target) {
        target.agentNotifiedAt = new Date().toLocaleString('ar-EG');
        target.deliveredLive = Boolean(apiRes && apiRes.data && apiRes.data.ok);
        saveDistFieldTasks(list);
      }
      if (forceOpenWa || !(apiRes && apiRes.data && apiRes.data.ok)) {
        window.open('https://wa.me/' + PORTAL_DIST.waAgentDigits + '?text=' + encodeURIComponent(cardMsg), '_blank');
      }
      return Boolean(apiRes && apiRes.data && apiRes.data.ok);
    }

    async function submitTrialCardAndNotifyAgent(openWaAlso) {
      const customerName = (document.getElementById('trlCustomerName')?.value || '').trim();
      const customerInfo = (document.getElementById('trlContactInfo')?.value || '').trim();
      const trialDevice = (document.getElementById('trlDevice')?.value || '').trim();
      const trialStartDate = document.getElementById('trlStartDate')?.value || new Date().toISOString().slice(0, 10);
      const repName = document.getElementById('trlRepSelect')?.value || '';
      const techName = document.getElementById('trlTechSelect')?.value || '';
      const stage = document.getElementById('trlStageSelect')?.value || 'trial_installed';
      const notes = (document.getElementById('trlNotes')?.value || '').trim();
      if (!customerName) return alert('يرجى إدخال اسم العميل أو المنشأة المسلمة لها النسخة التجريبية.');
      if (!trialDevice && !customerInfo) return alert('يرجى إدخال مرجع النسخة التجريبية/بصمة الجهاز أو بيانات التواصل مع العميل لإثبات التجريب للوكيل.');

      const startMs = Date.parse(trialStartDate) || Date.now();
      const trialEndDate = new Date(startMs + 14 * 86400000).toISOString().slice(0, 10);
      const reportCode = 'TRL-' + Math.random().toString(16).slice(2, 8).toUpperCase();

      const list = loadDistFieldTasks();
      const existing = list.find(x => x.customerName === customerName && x.stage !== 'completed');
      let taskObj;
      if (existing) {
        existing.customerInfo = customerInfo || existing.customerInfo;
        existing.trialDevice = trialDevice || existing.trialDevice;
        existing.trialStartDate = trialStartDate;
        existing.trialEndDate = trialEndDate;
        existing.repName = repName || existing.repName;
        existing.techName = techName || existing.techName;
        existing.stage = stage;
        existing.notes = notes || existing.notes;
        existing.reportCode = existing.reportCode || reportCode;
        taskObj = existing;
      } else {
        taskObj = {
          id: 'wf_' + Math.random().toString(16).slice(2, 8),
          reportCode,
          customerName,
          customerInfo,
          trialDevice,
          trialStartDate,
          trialEndDate,
          repName,
          techName,
          stage,
          reqCode: '',
          activationKey: '',
          notes,
          createdAt: new Date().toISOString()
        };
        list.unshift(taskObj);
      }
      saveDistFieldTasks(list);
      document.getElementById('trlCustomerName').value = '';
      document.getElementById('trlContactInfo').value = '';
      document.getElementById('trlDevice').value = '';
      document.getElementById('trlNotes').value = '';

      const sentLive = await sendTaskUpdateToAgentApi(taskObj, openWaAlso);
      if (sentLive && !openWaAlso) {
        alert('✅ تم تسجيل بيانات النسخة التجريبية وإخطار الوكيل بالبطاقة فوراً بكود (' + (taskObj.reportCode || taskObj.id) + ').');
      }
    }

    async function notifyAgentWithUpdatedCard(taskId, openWa) {
      const t = loadDistFieldTasks().find(x => x.id === taskId);
      if (!t) return;
      const sentLive = await sendTaskUpdateToAgentApi(t, Boolean(openWa));
      if (sentLive && !openWa) {
        alert('✅ تم إخطار الوكيل بتحديث بطاقة (' + t.customerName + ') للمرحلة الحالية.');
      }
    }

    async function advanceWorkflowStage(id, targetStage) {
      const list = loadDistFieldTasks();
      const item = list.find(x => x.id === id);
      if (!item) return;
      const stages = ['trial_installed', 'rep_pending', 'rep_visited', 'tech_assigned', 'completed'];
      if (targetStage) {
        item.stage = targetStage;
      } else {
        const idx = stages.indexOf(item.stage);
        item.stage = stages[Math.min(stages.length - 1, idx + 1)];
      }
      item.stageUpdatedAt = new Date().toLocaleString('ar-EG');
      if (!item.reportCode) item.reportCode = 'TRL-' + Math.random().toString(16).slice(2, 8).toUpperCase();
      saveDistFieldTasks(list);

      const sentLive = await sendTaskUpdateToAgentApi(item, false);
      if (sentLive) {
        alert('📡 تم تحديث بطاقة العميل «' + item.customerName + '» وإخطار الوكيل آلياً بالانتقال إلى مرحلة: ' + (STAGE_LABELS_PORTAL[item.stage] || item.stage));
      }
    }

    function removeWorkflowTask(id) {
      saveDistFieldTasks(loadDistFieldTasks().filter(x => x.id !== id));
    }

    function dispatchStageMemberWa(taskId, role) {
      const tasks = loadDistFieldTasks();
      const t = tasks.find(x => x.id === taskId);
      if (!t) return;
      const members = loadDistTeamMembers();
      const assignedName = role === 'rep' ? t.repName : t.techName;
      const mem = members.find(m => m.name === assignedName);
      const waitingList = loadWaitingRequests();
      const matchedReq = t.reqCode ? waitingList.find(r => r.reqCode === t.reqCode) : waitingList.find(r => r.customerName === t.customerName);
      const keyTxt = t.activationKey || (matchedReq && matchedReq.activationKey) || '';

      const msg = role === 'rep'
        ? [
            '🧑‍💼 *تكليف زيارة أولى (مندوب مبيعات) — ' + PORTAL_DIST.systemName + '*',
            '• الموزع / النطاق: ' + PORTAL_DIST.name + ' (' + PORTAL_DIST.governorate + ')',
            '• المندوب المكلّف: ' + (assignedName || 'غير محدد'),
            '• العميل / الجهة: ' + t.customerName,
            t.customerInfo ? ('• المنطقة / الهاتف: ' + t.customerInfo) : '',
            t.notes ? ('• ملاحظات الزيارة: ' + t.notes) : '',
            'يرجى إجراء العرض الميداني الأول وإرسال بيانات التعاقد والريسيت للموزع.'
          ].filter(Boolean).join('\\n')
        : [
            '🛠️ *أمر شغل فني (تركيب وإنجاز العمل) — ' + PORTAL_DIST.systemName + '*',
            '• الموزع / النطاق: ' + PORTAL_DIST.name + ' (' + PORTAL_DIST.governorate + ')',
            '• الفني المكلّف: ' + (assignedName || 'غير محدد'),
            '• العميل / الجهة: ' + t.customerName,
            t.customerInfo ? ('• المنطقة / الهاتف: ' + t.customerInfo) : '',
            keyTxt ? ('• 🔑 مفتاح التفعيل الصادر: ' + keyTxt) : '• حالة المفتاح: يرجى مراجعة الموزع قبل التفعيل',
            t.notes ? ('• تفاصيل التركيب: ' + t.notes) : '',
            'يرجى التوجه للعميل وإتمام التركيب والتدريب وتأكيد الإنجاز للموزع.'
          ].filter(Boolean).join('\\n');

      messageTeamMemberWa(mem ? mem.phone : '', msg);
    }

    function renderDistTeamUi() {
      const members = loadDistTeamMembers();
      const tasks = loadDistFieldTasks();
      const waitingList = loadWaitingRequests();

      const reps = members.filter(m => m.role === 'rep');
      const techs = members.filter(m => m.role === 'tech');
      if (document.getElementById('teamRepCount')) document.getElementById('teamRepCount').innerText = reps.length;
      if (document.getElementById('teamTechCount')) document.getElementById('teamTechCount').innerText = techs.length;
      if (document.getElementById('teamStageRepCount')) document.getElementById('teamStageRepCount').innerText = tasks.filter(t => t.stage === 'rep_pending' || t.stage === 'rep_visited').length;
      if (document.getElementById('teamStageTechCount')) document.getElementById('teamStageTechCount').innerText = tasks.filter(t => t.stage === 'tech_assigned').length;
      if (document.getElementById('teamDoneCount')) document.getElementById('teamDoneCount').innerText = tasks.filter(t => t.stage === 'completed').length;

      const repOptions = '<option value="">— اختر مندوباً —</option>' + reps.map(r => '<option value="' + escHtml(r.name) + '">🧑‍💼 ' + escHtml(r.name) + ' (' + escHtml(r.zone) + ')</option>').join('');
      const techOptions = '<option value="">— اختر فنياً —</option>' + techs.map(tc => '<option value="' + escHtml(tc.name) + '">🛠️ ' + escHtml(tc.name) + ' (' + escHtml(tc.zone) + ')</option>').join('');
      ['wfRepSelect', 'dealRepSelect', 'trlRepSelect'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          const cur = sel.value;
          sel.innerHTML = repOptions;
          if (cur) sel.value = cur;
        }
      });
      ['wfTechSelect', 'dealTechSelect', 'trlTechSelect'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          const cur = sel.value;
          sel.innerHTML = techOptions;
          if (cur) sel.value = cur;
        }
      });
      const trlDateEl = document.getElementById('trlStartDate');
      if (trlDateEl && !trlDateEl.value) trlDateEl.value = new Date().toISOString().slice(0, 10);

      const memBox = document.getElementById('distTeamMembersList');
      if (memBox) {
        const filtered = activeTeamRoleFilter === 'all' ? members : members.filter(m => m.role === activeTeamRoleFilter);
        if (!filtered.length) {
          memBox.innerHTML = '<div style="font-size:12px; color:var(--muted); padding:8px;">لم يتم تسجيل مناديب أو فنيين بعد داخل نطاق ' + escHtml(PORTAL_DIST.governorate) + '. أضف فريقك من النموذج أعلاه.</div>';
        } else {
          memBox.innerHTML = filtered.map(m => {
            const roleBadge = m.role === 'rep'
              ? '<span style="background:rgba(56,189,248,0.18); color:#38bdf8; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:bold;">🧑‍💼 مندوب زيارة أولى</span>'
              : '<span style="background:rgba(16,185,129,0.18); color:#34d399; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:bold;">🛠️ فني تركيب وتنفيذ</span>';
            const stLabel = m.status === 'available' ? '🟢 متاح' : (m.status === 'busy' ? '🟠 في مهمة' : '⚪ إجازة');
            return '<div style="background:rgba(2,6,23,0.45); border:1px solid var(--border); border-radius:10px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">' +
              '<div><div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;"><strong>' + escHtml(m.name) + '</strong> ' + roleBadge + '</div>' +
              '<div style="font-size:11.5px; color:var(--muted); margin-top:2px;">📍 ' + escHtml(m.zone) + (m.phone ? ' · 📱 ' + escHtml(m.phone) : '') + (m.fee ? ' · 💰 ' + m.fee + ' ج.م/مهمة' : '') + '</div></div>' +
              '<div style="display:flex; gap:4px; align-items:center;">' +
              '<button type="button" onclick="toggleTeamMemberStatus(&apos;' + m.id + '&apos;)" style="padding:4px 8px; font-size:11px; background:#1e293b; color:#e2e8f0; width:auto;">' + stLabel + '</button>' +
              (m.phone ? '<button type="button" onclick="messageTeamMemberById(&apos;' + m.id + '&apos;)" style="padding:4px 8px; font-size:11px; background:#059669; color:#fff; width:auto;">📲</button>' : '') +
              '<button type="button" onclick="removeTeamMember(&apos;' + m.id + '&apos;)" style="padding:4px 8px; font-size:11px; background:#7f1d1d; color:#fecaca; width:auto;">✕</button>' +
              '</div></div>';
          }).join('');
        }
      }

      const taskBox = document.getElementById('distWorkflowTasksList');
      if (taskBox) {
        if (!tasks.length) {
          taskBox.innerHTML = '<div style="font-size:12px; color:var(--muted); padding:8px;">لا توجد مهام عملاء مجدولة حالياً. أضف عميلاً وحدد المندوب أولاً ثم الفني لإنجاز العمل.</div>';
        } else {
          taskBox.innerHTML = tasks.map(t => {
            const linkedReq = t.reqCode ? waitingList.find(r => r.reqCode === t.reqCode) : waitingList.find(r => r.customerName === t.customerName);
            const resolvedKey = t.activationKey || (linkedReq && linkedReq.activationKey) || '';
            const stageMeta = {
              trial_installed: { txt: '🧪 مرحلة التجريب (تم التثبيت للعميل)', bg: 'rgba(245,158,11,0.2)', clr: '#fbbf24', nextTxt: '1️⃣ تعيين زيارة المندوب' },
              rep_pending: { txt: '1️⃣ بانتظار زيارة المندوب الأولى', bg: 'rgba(245,158,11,0.18)', clr: '#fbbf24', nextTxt: '✔ تمت زيارة المندوب' },
              rep_visited: { txt: '🤝 زاره المندوب (بانتظار الدفع/الفني)', bg: 'rgba(56,189,248,0.18)', clr: '#38bdf8', nextTxt: '🛠️ إرسال الفني الآن' },
              tech_assigned: { txt: '2️⃣ لدى الفني للتنفيذ والتشغيل', bg: 'rgba(167,139,250,0.18)', clr: '#a78bfa', nextTxt: '✅ تم إنجاز العمل 100%' },
              completed: { txt: '✅ منجز بالكامل (مندوب ← فني)', bg: 'rgba(16,185,129,0.2)', clr: '#34d399', nextTxt: '' }
            }[t.stage] || { txt: 'قيد المتابعة', bg: 'rgba(148,163,184,0.2)', clr: '#cbd5e1', nextTxt: 'التالي' };

            return '<div style="background:rgba(2,6,23,0.45); border:1px solid var(--border); border-radius:10px; padding:10px;">' +
              '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">' +
              '<strong>' + escHtml(t.customerName) + (t.reportCode ? ' <span style="font-size:11px; color:var(--sky); font-family:monospace;" dir="ltr">(' + escHtml(t.reportCode) + ')</span>' : '') + '</strong>' +
              '<span style="background:' + stageMeta.bg + '; color:' + stageMeta.clr + '; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:bold;">' + stageMeta.txt + '</span></div>' +
              '<div style="font-size:11.5px; color:var(--muted); line-height:1.55;">' +
              (t.customerInfo ? '📞 ' + escHtml(t.customerInfo) + '<br>' : '') +
              (t.trialDevice ? '🧪 مرجع التجريبية: <code dir="ltr">' + escHtml(t.trialDevice) + '</code>' + (t.trialEndDate ? ' (تنتهي: ' + escHtml(t.trialEndDate) + ')' : '') + '<br>' : '') +
              '1️⃣ المندوب: <strong style="color:var(--sky);">' + escHtml(t.repName || 'غير محدد') + '</strong>' + (t.repAction ? ' — <span style="color:#7dd3fc;">«' + escHtml(t.repAction) + '»</span>' : '') + '<br>' +
              '2️⃣ الفني: <strong style="color:var(--accent);">' + escHtml(t.techName || 'غير محدد') + '</strong>' + (t.techAction ? ' — <span style="color:#6ee7b7;">«' + escHtml(t.techAction) + '»</span>' : '') +
              (t.agentNotifiedAt ? '<br>📡 آخر إخطار للوكيل: <strong style="color:#34d399;">' + escHtml(t.agentNotifiedAt) + '</strong>' : '<br>⚠️ <span style="color:#fbbf24;">لم يُرسل تحديث هذه البطاقة للوكيل بعد</span>') +
              (resolvedKey ? '<br>🔑 مفتاح التفعيل الجاهز للفني: <strong style="font-family:monospace; color:#34d399;" dir="ltr">' + escHtml(resolvedKey) + '</strong>' : '') +
              (t.notes ? '<br>📝 النتيجة / الملاحظات: ' + escHtml(t.notes) : '') +
              '</div>' +
              '<div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:8px;">' +
              '<button type="button" onclick="dispatchStageMemberWa(&apos;' + t.id + '&apos;, &apos;rep&apos;)" style="padding:4px 8px; font-size:11px; background:#0369a1; color:#fff; width:auto;">📲 تكليف المندوب</button>' +
              '<button type="button" onclick="logUnifiedActionPrompt(&apos;' + t.id + '&apos;, &apos;rep&apos;)" style="padding:4px 8px; font-size:11px; background:#0284c7; color:#fff; width:auto;">✍️ ماذا فعل المندوب؟</button>' +
              '<button type="button" onclick="dispatchStageMemberWa(&apos;' + t.id + '&apos;, &apos;tech&apos;)" style="padding:4px 8px; font-size:11px; background:#059669; color:#fff; width:auto;">📲 أمر شغل الفني</button>' +
              '<button type="button" onclick="logUnifiedActionPrompt(&apos;' + t.id + '&apos;, &apos;tech&apos;)" style="padding:4px 8px; font-size:11px; background:#047857; color:#fff; width:auto;">✍️ ماذا فعل الفني؟</button>' +
              '<button type="button" onclick="notifyAgentWithUpdatedCard(&apos;' + t.id + '&apos;, true)" style="padding:4px 8px; font-size:11px; background:#7c3aed; color:#fff; width:auto;">📡 إخطار الوكيل بالبطاقة</button>' +
              (stageMeta.nextTxt ? '<button type="button" onclick="advanceWorkflowStage(&apos;' + t.id + '&apos;)" style="padding:4px 8px; font-size:11px; background:#d97706; color:#fff; width:auto;">' + stageMeta.nextTxt + '</button>' : '') +
              '<button type="button" onclick="removeWorkflowTask(&apos;' + t.id + '&apos;)" style="padding:4px 8px; font-size:11px; background:#7f1d1d; color:#fecaca; width:auto;">✕</button>' +
              '</div></div>';
          }).join('');
        }
      }
    }

    function messageTeamMemberById(id) {
      const m = loadDistTeamMembers().find(x => x.id === id);
      if (!m) return;
      const roleLabel = m.role === 'rep' ? 'مندوب المبيعات (الزيارة الأولى)' : 'فني التركيب والتنفيذ';
      messageTeamMemberWa(m.phone, 'مرحباً ' + m.name + ' (' + roleLabel + ')، يوجد تكليف عمل جديد في نطاق ' + PORTAL_DIST.governorate + ' (' + (m.zone || '') + ').');
    }
    setTimeout(renderDistTeamUi, 80);
  </script>
</body>
</html>`;
}

module.exports = {
  generateStandaloneDistributorPortalHtml
};

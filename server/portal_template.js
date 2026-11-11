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

function generateStandaloneDistributorPortalHtml(dist, agentInfo) {
  const safeName = escapeHtml(dist.name);
  const safeCode = escapeHtml(dist.code);
  const safeGov = escapeHtml(dist.governorate);
  const safeRate = Number(dist.commission_rate) || 27;
  const safeMegaUrl = escapeHtml(agentInfo.megaTrialUrl);
  const portalDistJson = safeInlineJson({
    id: String(dist.id || ''),
    name: String(dist.name || ''),
    code: String(dist.code || ''),
    governorate: String(dist.governorate || ''),
    phone: String(dist.phone || ''),
    rate: safeRate,
    megaTrialUrl: String(agentInfo.megaTrialUrl || '')
  });
  const battleCardB64 = Buffer.from(renderBattleCardA4(dist), 'utf8').toString('base64');
  const techSec = renderTechnicalFieldSectionHtml(dist, agentInfo);
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>حقيبة الموزع المستقل: ${safeName} | Qalix Medical Agent</title>
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
      <span class="badge">بوابة الموزع المستقل المعتمد · Qalix Medical Agent</span>
      <h1 style="margin: 10px 0 4px; font-size: 22px;">${safeName} (${safeCode})</h1>
      <p style="margin: 0; color: var(--muted); font-size: 13px;">
        النطاق الجغرافي: <strong>${safeGov}</strong> · نسبة العمولة الثابتة من كل عملية بيع: <strong style="color:var(--accent)">${safeRate}%</strong> · بإشراف وكيل منظومة كالكس ميديكال الطبية: <strong dir="ltr">01122166076</strong>
      </p>
    </div>

    <div class="grid">
      <div class="card">
        <h3 style="margin-top:0; color:var(--accent);">1. جدول الأسعار الرسمية الثابتة وعمولتك الفورية (${safeRate}%)</h3>
        <table>
          <thead>
            <tr><th>الباقة</th><th>السعر الرسمي</th><th>عمولتك (${safeRate}%)</th><th>صافي التوريد للوكيل</th></tr>
          </thead>
          <tbody>
            <tr><td>الباقة الأساسية</td><td>4,500 ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(4500 * dist.commission_rate / 100)} ج.م</td><td>${4500 - Math.round(4500 * dist.commission_rate / 100)} ج.م</td></tr>
            <tr><td>الباقة التخصصية</td><td>8,500 ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(8500 * dist.commission_rate / 100)} ج.م</td><td>${8500 - Math.round(8500 * dist.commission_rate / 100)} ج.م</td></tr>
            <tr><td>باقة المراكز الكبرى</td><td>18,500 ج.م</td><td style="color:var(--accent);font-weight:bold;">${Math.round(18500 * dist.commission_rate / 100)} ج.م</td><td>${18500 - Math.round(18500 * dist.commission_rate / 100)} ج.م</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="margin-top:0; color:var(--blue);">2. مولّد طلب إصدار ترخيص وتوريد المبلغ للوكيل (01122166076)</h3>
        <div style="display:grid; gap:10px;">
          <div><label style="font-size:12px;">اسم العيادة / المركز الطبي:</label><input id="cName" placeholder="مثال: عيادة الشفاء التخصصية" /></div>
          <div><label style="font-size:12px;">اسم الطبيب وهاتفه:</label><input id="dName" placeholder="مثال: د. أحمد سامي - 010..." /></div>
          <div><label style="font-size:12px;">بصمة جهاز العيادة (Hardware ID من شاشة التفعيل):</label><input id="hwId" placeholder="24 حرفاً ورقماً" dir="ltr" /></div>
          <div>
            <label style="font-size:12px;">الباقة المتعاقد عليها:</label>
            <select id="tierSel">
              <option value="basic|4500">الباقة الأساسية (4,500 ج.م)</option>
              <option value="pro|8500" selected>الباقة التخصصية (8,500 ج.م)</option>
              <option value="ent|18500">باقة المراكز الكبرى (18,500 ج.م)</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <div>
              <label style="font-size:12px;">قناة توريد صافي المبلغ للوكيل:</label>
              <select id="payChannel">
                <option value="إنستاباي (InstaPay)">⚡ إنستاباي (InstaPay)</option>
                <option value="فودافون كاش (Vodafone Cash)">📱 فودافون كاش</option>
                <option value="تحويل بنكي رسمي">🏛️ تحويل بنكي رسمي</option>
                <option value="سداد وتوريد نقدي">💵 توريد نقدي</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;">رقم مرجع التحويل / العملية:</label>
              <input id="payRef" placeholder="مثال: IPN-849201" dir="ltr" />
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="sendRequestToAgentWa()" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:#fff;">📲 إرسال الطلب والتوريد لواتساب الوكيل (01122166076)</button>
            <button type="button" onclick="genRequest()" class="btn-blue" style="flex:1; color:#fff;">📋 توليد ونسخ النص فقط</button>
          </div>
          <textarea id="outMsg" rows="6" readonly placeholder="ستظهر رسالة الطلب وتفاصيل التوريد الجاهزة هنا..."></textarea>
        </div>
      </div>
    </div>

    <!-- Agent-Distributor Direct Hub: Replies, Lead Lock Requests & Remittances -->
    <div class="card no-print">
      <h3 style="margin-top:0; color:var(--sky);">مركز الردود السريعة، طلبات الحجز، وإشعارات توريد المبالغ إلى الوكيل (01122166076)</h3>
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
        <button type="button" onclick="sendDistributorFeedbackToAgentWa()" style="background:linear-gradient(135deg,#10b981,#059669); color:#fff;">📲 إرسال لواتساب الوكيل (01122166076) فوراً</button>
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

    function openPortalDocPreview(opts) {
      const m = document.getElementById('portalDocModal');
      const frame = document.getElementById('portalDocFrame');
      const loader = document.getElementById('portalDocLoading');
      if (!m || !frame) return;

      currentPortalDocState = opts || {};
      document.getElementById('portalDocTitle').innerText = opts.title || 'معاينة المستند';
      document.getElementById('portalDocSubtitle').innerText = opts.subtitle || 'معاينة مباشرة قبل الطباعة أو التحميل';

      const htmlStr = opts.htmlContent || (opts.htmlB64 ? decodeB64Utf8(opts.htmlB64) : '');
      if (htmlStr) {
        if (loader) loader.style.display = 'none';
        frame.removeAttribute('src');
        frame.srcdoc = htmlStr;
        if (opts.autoPrint) {
          setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} }, 350);
        }
      } else if (opts.url) {
        const resolvedUrl = resolvePortalUrl(opts.url);
        frame.removeAttribute('srcdoc');
        if (loader) {
          loader.innerText = '⏳ جاري تحميل المعاينة المباشرة...';
          loader.style.display = 'flex';
        }
        frame.onload = () => {
          if (loader) loader.style.display = 'none';
          if (opts.autoPrint) {
            setTimeout(() => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_) {} }, 350);
          }
        };
        if (API_BASE) {
          fetch(resolvedUrl, { method: 'HEAD' }).catch(() => {
            if (loader) {
              loader.innerText = '⚠️ تعذر الاتصال بالخادم المحلي (127.0.0.1:4000) لأن هذا الملف يتطلب تشغيل خادم الوكيل أو استخدم الوثائق المدمجة أوفلاين.';
              loader.style.display = 'flex';
            }
          });
        }
        frame.src = resolvedUrl;
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
        'يؤكد الموزع للوكيل (01122166076) إتمام التركيب والتدريب وترك الكتالوج وبناء رضا الطبيب 100%.'
      ].join('\\n');
      return { clinic, doctor, nowStr, items, msg };
    }

    function sendTechSuccessToAgentWhatsApp() {
      const data = buildTechSuccessPayload(true);
      if (!data) return;
      const url = 'https://wa.me/201122166076?text=' + encodeURIComponent(data.msg);
      window.open(url, '_blank');
    }

    function copyTechSuccessCard() {
      const data = buildTechSuccessPayload(false);
      if (!data) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.msg).then(() => {
          alert('تم نسخ نص بطاقة تأكيد نجاح التشغيل بنجاح! جاهزة للإرسال للوكيل 01122166076.');
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
        '<div class="hdr"><div><h1 style="margin:0;font-size:20px;color:#059669;">✅ بطاقة تأكيد إتمام نجاح التركيب والتشغيل للوكيل</h1><div style="font-size:12px;color:#64748b;">منظومة كالكس الطبية الشاملة · Qalix Medical v1.0</div></div><div style="font-size:12px;text-align:left;">الوكيل الرسمي:<br><strong dir="ltr">01122166076</strong></div></div>' +
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
    function buildRequestText() {
      const c = document.getElementById('cName').value.trim() || 'غير محدد';
      const d = document.getElementById('dName').value.trim() || 'غير محدد';
      const hw = document.getElementById('hwId').value.trim() || 'غير محدد';
      const [, pStr] = document.getElementById('tierSel').value.split('|');
      const ch = document.getElementById('payChannel')?.value || 'إنستاباي (InstaPay)';
      const pref = document.getElementById('payRef')?.value.trim() || 'سيُرفق إيصال التحويل بالمحادثة';
      const price = Number(pStr);
      const comm = Math.round(price * rate / 100);
      const net = price - comm;
      return \`طلب إصدار ترخيص وتأكيد توريد — Qalix Medical Agent
• كود الموزع: \${PORTAL_DIST.code} (\${PORTAL_DIST.name})
• المنشأة الطبية: \${c}
• الطبيب والهاتف: \${d}
• بصمة الجهاز (HWID): \${hw}
• السعر الرسمي الثابت: \${price} ج.م
• عمولة الموزع (\${rate}%): \${comm} ج.م
• صافي التوريد للوكيل (01122166076): \${net} ج.م
• قناة السداد والتوريد: \${ch}
• مرجع التحويل: \${pref}\`;
    }

    function genRequest() {
      const msg = buildRequestText();
      const box = document.getElementById('outMsg');
      box.value = msg;
      box.select();
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
      alert('تم توليد ونسخ رسالة طلب التفعيل والتوريد! يمكنك إرسالها الآن لواتساب الوكيل 01122166076');
    }

    function sendRequestToAgentWa() {
      const msg = buildRequestText();
      const box = document.getElementById('outMsg');
      if (box) box.value = msg;
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
      window.open('https://wa.me/201122166076?text=' + encodeURIComponent(msg), '_blank');
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
      window.open('https://wa.me/201122166076?text=' + encodeURIComponent(msg), '_blank');
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
  </script>
</body>
</html>`;
}

module.exports = {
  generateStandaloneDistributorPortalHtml
};

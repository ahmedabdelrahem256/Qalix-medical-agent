/* Distributor Recruitment Flyer & Interactive Onboarding Application Card
 * 100% Offline / Standalone HTML · Official Agent: 01122166076
 */
'use strict';

const { generateSimpleSvgQr } = require('./network_diagnostics');

function renderDistributorRecruitmentCardHtml(agentInfo) {
  const phone = (agentInfo && agentInfo.phone) || '01122166076';
  const intlClean = ((agentInfo && agentInfo.intlPhone) || '+201122166076').replace(/[^0-9]/g, '');
  const waMsg = encodeURIComponent(
    `السلام عليكم وكيل منظومة كالكس الطبية (${phone})، أرغب في التقدم للانضمام كموزع معتمد للمنظومة في محافظتي ومعرفة كافة التفاصيل.`
  );
  const waUrl = `https://wa.me/${intlClean}?text=${waMsg}`;
  const qrSvg = generateSimpleSvgQr(waUrl, 96);

  const pitchText = `🚀 فرصة شراكة ووكالة توزيع معتمد — منظومة كالكس الطبية (Qalix Medical v1.0)

هل لديك خبرة في التسويق الطبي أو التعامل مع العيادات والمراكز الطبية أو المعامل؟
انضم الآن لشبكة الموزعين المعتمدين لأحدث منظومة إدارة عيادات في مصر (تعمل 100% أوفلاين بدون إنترنت):

✅ عمولة فورية ومباشرة تبدأ من 27% وتصل إلى 35% من قيمة كل صفقة!
✅ أرباح تصل إلى 6,475 ج.م على البيعة الواحدة (أو 27,200+ ج.م شهرياً عند 10 عيادات تخصصية فقط).
✅ سهولة إغلاق البيع بفضل النسخة التجريبية المجانية 14 يوماً وشاشة الانتظار بالنداء الصوتي.
✅ حماية كاملة للنطاق الجغرافي وحجز العيادات باسم الموزع لمدة 14 يوماً.
✅ أسعار رسمية موحدة وتفعيل مركزي موثق عبر الوكيل.

📲 للتقديم والاستفسار تواصل واتساب مباشرة مع وكيل المنظومة: ${phone}
https://wa.me/${intlClean}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>بطاقة تسويق وطلب موزعين معتمدين | Qalix Medical Agent</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #e2e8f0; color: #0f172a; margin: 0; padding: 20px; direction: rtl; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px 28px; box-shadow: 0 10px 35px rgba(15,23,42,0.12); border: 1px solid #cbd5e1; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; background: #f1f5f9; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #cbd5e1; }
    .btn { padding: 8px 14px; border-radius: 8px; border: none; font-weight: 700; font-size: 12.5px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-emerald { background: #059669; color: #fff; }
    .btn-amber { background: #d97706; color: #fff; }
    .hero { background: linear-gradient(135deg, #0b1a2e, #0f4c81); color: #ffffff; padding: 22px 24px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 16px; }
    .hero .kicker { display: inline-block; background: rgba(16,185,129,0.2); border: 1px solid #34d399; color: #6ee7b7; padding: 3px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 700; margin-bottom: 8px; }
    .hero h1 { margin: 0 0 6px; font-size: 22px; line-height: 1.35; }
    .hero p { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
    .qr-card { background: #ffffff; padding: 8px; border-radius: 10px; text-align: center; color: #0f172a; flex-shrink: 0; }
    .qr-card small { display: block; font-size: 10px; font-weight: 700; margin-top: 3px; color: #0284c7; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .perk { background: #f8fafc; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 10px; padding: 12px; }
    .perk.green { border-top-color: #059669; background: #ecfdf5; }
    .perk.amber { border-top-color: #d97706; background: #fffbeb; }
    .perk strong { display: block; font-size: 13.5px; margin-bottom: 4px; color: #0f172a; }
    .perk span { font-size: 11.8px; color: #475569; line-height: 1.5; display: block; }
    .section-title { font-size: 15px; font-weight: 800; color: #0b1a2e; border-right: 4px solid #059669; padding-right: 10px; margin: 14px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
    th, td { padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; }
    th:first-child, td:first-child { text-align: right; font-weight: 700; }
    thead th { background: #0b1a2e; color: #fff; font-size: 12.5px; }
    .tier-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
    .tier-pill { border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 10px; text-align: center; background: #f8fafc; }
    .tier-pill b { display: block; font-size: 12.5px; color: #0f172a; }
    .tier-pill .pct { font-size: 18px; font-weight: 900; color: #059669; margin: 2px 0; }
    .tier-pill small { font-size: 10.5px; color: #64748b; }
    .req-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #1e3a8a; margin-bottom: 14px; }
    .req-box ul { margin: 6px 0 0; padding-right: 18px; line-height: 1.7; }
    .footer { background: #0b1a2e; color: #fff; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
    @media (max-width: 680px) {
      .hero, .footer { flex-direction: column; text-align: center; }
      .grid-3, .tier-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar no-print">
      <span style="font-size:12.5px; font-weight:700; color:#334155;">📣 بطاقة تسويق واستقطاب موزعين جدد (جاهزة للطباعة A4 أو النشر)</span>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button onclick="window.print()" class="btn btn-primary">🖨️ طباعة / حفظ PDF</button>
        <button onclick="copyRecruitmentPost()" class="btn btn-amber">📋 نسخ نص الإعلان التسويقي</button>
        <a href="/api/recruitment/onboarding-card" target="_blank" class="btn btn-emerald">📝 فتح استمارة الموزع الجديد</a>
      </div>
    </div>

    <div class="hero">
      <div>
        <span class="kicker">مطلوب شركاء نجاح وموزعين معتمدين بالمحافظات</span>
        <h1>انضم كموزع معتمد لمنظومة «كالكس ميديكال» الطبية</h1>
        <p>امتلك مصدر دخل متصاعد في أسرع سوق نمواً (العيادات والمراكز الطبية) بمنتج مطلوب فعلياً يعمل 100% أوفلاين، بدون منافسة سعرية، وبعمولات فورية مجزية.</p>
      </div>
      <div class="qr-card">
        ${qrSvg}
        <small>امسح للتقديم واتساب</small>
      </div>
    </div>

    <div class="grid-3">
      <div class="perk green">
        <strong>💰 عمولات تبدأ من 27% وتصل لـ 35%</strong>
        <span>عمولة فورية تُخصم مباشرة لصالحك من أول صفقة، وتزداد شريحتك تلقائياً كلما حققت مبيعات أعلى.</span>
      </div>
      <div class="perk">
        <strong>🛡️ حماية نطاقك وحجز العيادات</strong>
        <span>أي عيادة تسجلها تُحجز باسمك لمدة 14 يوماً، مع تسعيرة رسمية ثابتة تمنع حرق الأسعار بين الموزعين.</span>
      </div>
      <div class="perk amber">
        <strong>🚀 بيع أسهل بالتجربة المجانية 14 يوماً</strong>
        <span>الطبيب يجرب المنظومة كاملة أسبوعين مجاناً مع شاشة الانتظار والنداء الصوتي ثم يتعاقد باقتناع تام.</span>
      </div>
    </div>

    <div class="section-title">جدول باقات المنظومة وعوائد الموزع في الصفقة الواحدة</div>
    <table>
      <thead>
        <tr>
          <th>الباقة الرسمية</th>
          <th>السعر الرسمي الموحد</th>
          <th>عمولتك (شريحة 27%)</th>
          <th>عمولتك (شريحة 29%)</th>
          <th>عمولتك (شريحة 32%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>الباقة الأساسية (عيادة طبيب فردي)</td>
          <td>4,500 ج.م</td>
          <td style="color:#059669; font-weight:bold;">1,215 ج.م</td>
          <td style="color:#0d9488; font-weight:bold;">1,305 ج.م</td>
          <td style="color:#0284c7; font-weight:bold;">1,440 ج.م</td>
        </tr>
        <tr style="background:#f0fdf4;">
          <td>الباقة التخصصية ⭐ الأكثر طلباً</td>
          <td><strong>8,500 ج.م</strong></td>
          <td style="color:#059669; font-weight:bold;">2,295 ج.م</td>
          <td style="color:#0d9488; font-weight:bold;">2,465 ج.م</td>
          <td style="color:#0284c7; font-weight:bold;">2,720 ج.م</td>
        </tr>
        <tr>
          <td>باقة المراكز الكبرى والفروع (Enterprise)</td>
          <td>18,500 ج.م</td>
          <td style="color:#059669; font-weight:bold;">4,995 ج.م</td>
          <td style="color:#0d9488; font-weight:bold;">5,365 ج.م</td>
          <td style="color:#0284c7; font-weight:bold;">5,920 ج.م</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">سلم ترقية شرائح تميز الموزعين</div>
    <div class="tier-grid">
      <div class="tier-pill"><b>🥉 البرونزية</b><div class="pct">27%</div><small>البداية الفورية (1 - 4 صفقات)</small></div>
      <div class="tier-pill"><b>🥈 الفضية</b><div class="pct" style="color:#0284c7;">29%</div><small>من 5 صفقات فأكثر</small></div>
      <div class="tier-pill"><b>🥇 الذهبية</b><div class="pct" style="color:#d97706;">32%</div><small>من 10 صفقات + دعم إعلاني</small></div>
      <div class="tier-pill"><b>💎 البلاتينية</b><div class="pct" style="color:#7c3aed;">35%</div><small>امتياز إقليمي (20+ صفقة)</small></div>
    </div>

    <div class="req-box">
      <strong>✅ ماذا تستلم فور موافقة الوكيل واعتمادك كموزع؟</strong>
      <ul>
        <li>بوابة موزع مستقلة باسمك وكودك الرسمي شاملة حاسبة الأرباح، مولّد عروض الأسعار A4، وبطاقة المقارنة التنافسية.</li>
        <li>حقيبة تسويق كاملة (فيديوهات تسويقية جاهزة بصوت احترافي، بوستات فيسبوك، رسائل واتساب، وعرض الـ 5 دقائق).</li>
        <li>التفعيل المركزي للمفاتيح والدعم الفني للعيادات يتم مباشرة من الوكيل، لتركز أنت 100% على إغلاق الصفقات.</li>
      </ul>
    </div>

    <div class="footer">
      <div>
        <div style="font-size:13px; color:#6ee7b7; font-weight:bold;">للتقديم السريع والاعتماد كموزع بمحافظتك:</div>
        <div style="font-size:14px; margin-top:3px;">تواصل واتساب أو اتصال مباشر مع الوكيل الرسمي: <strong dir="ltr" style="font-size:17px; color:#38bdf8;">${phone}</strong></div>
      </div>
      <a href="${waUrl}" target="_blank" class="btn btn-emerald no-print">📲 قدّم الآن عبر واتساب</a>
    </div>
  </div>
  <script>
    const RECRUIT_TEXT = ${JSON.stringify(pitchText)};
    function copyRecruitmentPost() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(RECRUIT_TEXT).then(() => alert('تم نسخ نص الإعلان التسويقي لطلب موزعين بنجاح! جاهز للنشر في فيسبوك وواتساب.'));
      } else {
        alert(RECRUIT_TEXT);
      }
    }
  </script>
</body>
</html>`;
}

function renderDistributorOnboardingCardHtml(agentInfo) {
  const phone = (agentInfo && agentInfo.phone) || '01122166076';
  const intlClean = ((agentInfo && agentInfo.intlPhone) || '+201122166076').replace(/[^0-9]/g, '');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>بطاقة تفاصيل الشراكة وطلب اعتماد موزع جديد | Qalix Medical Agent</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; direction: rtl; line-height: 1.6; }
    .container { max-width: 860px; margin: 0 auto; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 22px; margin-bottom: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
    .hero { background: linear-gradient(135deg, #064e3b, #0c4a6e); border: 1px solid #059669; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 700; background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.4); }
    h1 { margin: 10px 0 6px; font-size: 21px; color: #ffffff; }
    h2 { margin: 0 0 12px; font-size: 16.5px; color: #38bdf8; border-right: 4px solid #38bdf8; padding-right: 10px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; font-size: 12.5px; }
    .info-box strong { color: #34d399; display: block; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { padding: 8px 10px; border: 1px solid #334155; text-align: right; }
    th { background: #0f172a; color: #38bdf8; }
    label { display: block; font-size: 12px; color: #cbd5e1; margin-bottom: 4px; font-weight: 600; }
    input, select, textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #ffffff; font-size: 13px; font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #10b981; }
    .req { color: #f43f5e; margin-right: 3px; }
    .btn { padding: 12px 18px; border-radius: 10px; border: none; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
    .btn:hover { opacity: 0.92; }
    .btn-wa { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; width: 100%; font-size: 14.5px; }
    .btn-copy { background: #0284c7; color: #ffffff; flex: 1; }
    .btn-print { background: #475569; color: #ffffff; flex: 1; }
    .agree-box { background: rgba(16,185,129,0.08); border: 1px solid #10b981; border-radius: 10px; padding: 12px; margin: 14px 0; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 12.5px; }
    .agree-box input { width: 18px; height: 18px; margin-top: 2px; flex-shrink: 0; accent-color: #10b981; }
    .preview-area { background: #0f172a; border: 1px dashed #38bdf8; border-radius: 10px; padding: 12px; margin-top: 12px; display: none; }
    @media print {
      body { background: #ffffff; color: #000000; padding: 0; }
      .card { background: #ffffff; color: #000000; border: 1px solid #cbd5e1; box-shadow: none; page-break-inside: avoid; }
      .hero { background: #f8fafc !important; color: #000000 !important; border: 2px solid #0284c7; }
      h1, h2 { color: #0f172a !important; }
      input, select, textarea { background: #ffffff; color: #000000; border: 1px solid #94a3b8; }
      .info-box, th { background: #f1f5f9; color: #0f172a; }
      .no-print { display: none !important; }
    }
    @media (max-width: 680px) { .grid-2 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <!-- Hero Header -->
    <div class="card hero">
      <span class="badge">استمارة تعارف واعتماد موزعين جدد · Qalix Medical Agent</span>
      <h1>مرحباً بك شريكنا المستقبلي في شبكة توزيع «كالكس ميديكال»</h1>
      <p style="margin:0; font-size:13px; color:#e2e8f0;">
        توضح لك هذه البطاقة التفاعلية كافة تفاصيل العمل، الأسعار الثابتة، ونسب العمولات. بعد مراجعة التفاصيل، يرجى ملء بياناتك بالأسفل وإرسالها بنقرة واحدة إلى وكيل المنظومة المعتمد (<strong dir="ltr">${phone}</strong>) للموافقة الفورية وتوليد حقيبتك وكودك المستقل.
      </p>
    </div>

    <!-- Step 1: Details for the New Distributor -->
    <div class="card">
      <h2>أولاً: تفاصيل نظام التوزيع والأسعار وشرائح العمولة</h2>
      <div class="grid-2" style="margin-bottom:12px;">
        <div class="info-box">
          <strong>1️⃣ كيف يعمل الموزع؟</strong>
          تسوّق منظومة كالكس للعيادات والمراكز الطبية عبر النسخة التجريبية المجانية (14 يوماً) وعروض التقديم الحية. عند تعاقد العيادة، تُحصّل قيمة الباقة وتحتفظ بعمولتك فوراً وتحول صافي الوكيل لإصدار مفتاح التفعيل الدائم.
        </div>
        <div class="info-box">
          <strong>2️⃣ الحماية والضمان المالي</strong>
          جميع الصفقات محمية بسعر رسمي ثابت وموحد، مع إمكانية حجز العيادة باسمك لمدة 14 يوماً لمنع التضارب. التفعيل والدعم الفني المباشر يتولاه الوكيل (${phone}).
        </div>
      </div>

      <table>
        <thead>
          <tr><th>الباقة الرسمية</th><th>السعر الرسمي الموحد</th><th>عمولتك الافتتاحية (27%)</th><th>عمولة الفضية (29%)</th><th>عمولة الذهبية (32%)</th></tr>
        </thead>
        <tbody>
          <tr><td>الباقة الأساسية (طبيب فردي)</td><td>4,500 ج.م</td><td style="color:#34d399; font-weight:bold;">1,215 ج.م</td><td>1,305 ج.م</td><td>1,440 ج.م</td></tr>
          <tr><td>الباقة التخصصية (الأكثر مبيعاً)</td><td>8,500 ج.م</td><td style="color:#34d399; font-weight:bold;">2,295 ج.م</td><td>2,465 ج.م</td><td>2,720 ج.م</td></tr>
          <tr><td>باقة المراكز الكبرى والفروع</td><td>18,500 ج.م</td><td style="color:#34d399; font-weight:bold;">4,995 ج.م</td><td>5,365 ج.م</td><td>5,920 ج.م</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: Fillable Application Form -->
    <div class="card">
      <h2>ثانياً: استمارة بيانات الموزع الجديد (للإرسال والموافقة)</h2>
      <div class="grid-2">
        <div>
          <label>الاسم الكامل / اسم المكتب أو الشركة:<span class="req">*</span></label>
          <input id="appName" placeholder="مثال: مكتب النور للأنظمة الطبية / أ. محمود..." />
        </div>
        <div>
          <label>رقم الهاتف (واتساب فعّال للتواصل):<span class="req">*</span></label>
          <input id="appPhone" placeholder="010xxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label>المحافظة:<span class="req">*</span></label>
          <input id="appGov" placeholder="مثال: أسيوط / القاهرة / الدقهلية..." />
        </div>
        <div>
          <label>المدينة / المركز والنطاق الجغرافي المقترح:<span class="req">*</span></label>
          <input id="appCity" placeholder="مثال: مدينة أسيوط وديروط ومنفلوط" />
        </div>
        <div>
          <label>طبيعة العمل أو الخبرة السابقة في السوق الطبي:</label>
          <select id="appExp">
            <option value="خبرة في تسويق البرامج الطبية للعيادات">خبرة في تسويق البرامج الطبية للعيادات</option>
            <option value="مكتب/شركة توريدات أو أجهزة طبية وصيانة">مكتب/شركة توريدات أو أجهزة طبية وصيانة</option>
            <option value="مندوب مبيعات أو دعاية طبية (Medical Rep)">مندوب مبيعات أو دعاية طبية (Medical Rep)</option>
            <option value="مسوق رقمي أو شريك مستقل طموح">مسوق رقمي أو شريك مستقل طموح</option>
          </select>
        </div>
        <div>
          <label>متوسط المبيعات المستهدف شهرياً:</label>
          <select id="appTarget">
            <option value="2 إلى 4 عيادات شهرياً (الشريحة البرونزية 27%)">2 إلى 4 عيادات شهرياً (الشريحة البرونزية 27%)</option>
            <option value="5 إلى 9 عيادات شهرياً (الشريحة الفضية 29%)">5 إلى 9 عيادات شهرياً (الشريحة الفضية 29%)</option>
            <option value="10 عيادات فأكثر شهرياً (الشريحة الذهبية 32%)">10 عيادات فأكثر شهرياً (الشريحة الذهبية 32%)</option>
          </select>
        </div>
        <div style="grid-column: 1 / -1;">
          <label>رابط صفحة الفيسبوك أو الموقع الإلكتروني (إن وُجد):</label>
          <input id="appSocial" placeholder="اختياري..." dir="ltr" />
        </div>
      </div>

      <div style="margin-top:12px;">
        <label>ملاحظات إضافية أو خطة الوصول للأطباء في منطقتك:</label>
        <textarea id="appNotes" rows="3" placeholder="اكتب أي تفاصيل إضافية تساعد الوكيل على اعتماد طلبك وتجهيز حقيبتك..."></textarea>
      </div>

      <label class="agree-box no-print" for="appAgree">
        <input type="checkbox" id="appAgree" />
        <span>أقر بالالتزام الكامل بالأسعار الرسمية الثابتة المعلنة من الوكيل، وبعدم إصدار أو تحصيل أي تراخيص خارج القنوات المعتمدة لوكيل المنظومة (<strong>${phone}</strong>).</span>
      </label>

      <div class="no-print" style="display:grid; gap:10px;">
        <button onclick="sendToAgentWhatsApp()" class="btn btn-wa">📲 إرسال بيانات الطلب الآن إلى واتساب الوكيل (${phone}) للموافقة</button>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button onclick="copyApplicationText()" class="btn btn-copy">📋 نسخ بيانات الطلب للحافظة</button>
          <button onclick="window.print()" class="btn btn-print">🖨️ طباعة / حفظ الاستمارة PDF</button>
        </div>
      </div>

      <div id="previewArea" class="preview-area no-print">
        <label style="color:#38bdf8;">معاينة نص الطلب المُجهز للإرسال للوكيل:</label>
        <textarea id="previewText" rows="8" readonly></textarea>
      </div>
    </div>
  </div>

  <script>
    const AGENT_PHONE = '${phone}';
    const AGENT_INTL = '${intlClean}';

    function buildApplicationMessage(requireAgree) {
      const name = document.getElementById('appName').value.trim();
      const ph = document.getElementById('appPhone').value.trim();
      const gov = document.getElementById('appGov').value.trim();
      const city = document.getElementById('appCity').value.trim();
      const exp = document.getElementById('appExp').value;
      const target = document.getElementById('appTarget').value;
      const social = document.getElementById('appSocial').value.trim() || 'لا يوجد';
      const notes = document.getElementById('appNotes').value.trim() || 'لا توجد ملاحظات إضافية';
      const agreed = document.getElementById('appAgree').checked;

      if (!name || !ph || !gov || !city) {
        alert('يرجى استكمال الحقول الأساسية المطلوبة (الاسم، الهاتف، المحافظة، النطاق الجغرافي).');
        return null;
      }
      if (requireAgree && !agreed) {
        alert('يرجى التأشير على إقرار الالتزام بالأسعار الرسمية الثابتة قبل الإرسال للموافقة.');
        return null;
      }

      const msg = [
        '📋 *طلب اعتماد موزع جديد — منظومة كالكس الطبية (Qalix Medical)*',
        '━━━━━━━━━━━━━━━━━━━━',
        '👤 *الاسم / المكتب:* ' + name,
        '📞 *رقم الهاتف (واتساب):* ' + ph,
        '📍 *المحافظة:* ' + gov,
        '🗺️ *المدينة / النطاق المطلوب:* ' + city,
        '💼 *الخبرة / النشاط:* ' + exp,
        '🎯 *المستهدف الشهري:* ' + target,
        '🌐 *الصفحة / الموقع:* ' + social,
        '📝 *ملاحظات الخطة:* ' + notes,
        '✅ *إقرار الالتزام بالسعر الرسمي وحوكمة التفعيل:* موافق',
        '━━━━━━━━━━━━━━━━━━━━',
        'يرجى المراجعة والاعتماد لإصدار كود الموزع والحقيبة المستقلة.'
      ].join('\\n');

      const box = document.getElementById('previewArea');
      const txt = document.getElementById('previewText');
      if (box && txt) {
        txt.value = msg;
        box.style.display = 'block';
      }
      return msg;
    }

    function sendToAgentWhatsApp() {
      const msg = buildApplicationMessage(true);
      if (!msg) return;
      const url = 'https://wa.me/' + AGENT_INTL + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    }

    function copyApplicationText() {
      const msg = buildApplicationMessage(false);
      if (!msg) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).then(() => {
          alert('تم نسخ بيانات طلب الاعتماد كاملة! يمكنك لصقها وإرسالها للوكيل (' + AGENT_PHONE + ').');
        });
      } else {
        document.getElementById('previewText').select();
        alert('تم تجهيز النص في مربع المعاينة، يمكنك نسخه الآن.');
      }
    }
  </script>
</body>
</html>`;
}

module.exports = {
  renderDistributorRecruitmentCardHtml,
  renderDistributorOnboardingCardHtml
};

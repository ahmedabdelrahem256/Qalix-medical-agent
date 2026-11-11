/* Technical Field Installation Guide, Doctor User Catalog & Completion Confirmation Card
 * Integrated into Distributor Portal (Section 9) · Official Agent: 01122166076
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LEGAL_DOCS_DIR = path.join(__dirname, '..', 'الوثائق_القانونية_والتسليم');

function readLegalDocB64(filename) {
  try {
    const p = path.join(LEGAL_DOCS_DIR, filename);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p).toString('base64');
    }
  } catch (_) {}
  return '';
}

const TECH_SETUP_STEPS = [
  {
    num: '1',
    icon: '🖥️',
    title: 'تثبيت المنظومة على الجهاز الرئيسي للعيادة (Windows 10/11)',
    steps: [
      'استخراج الملف المضغوط كاملاً (Extract All) في مجلد ثابت مثل D:\\QalixMedical.',
      'تشغيل ملف Setup-QalixMedical.bat بزر الفأرة الأيمن ← تشغيل كمسؤول (Run as Administrator).',
      'الدخول لأول مرة بحساب المصنع (admin / Qalix@11) ثم تغيير كلمة المرور فوراً من داخل العيادة.',
      'طباعة «مفتاح الاسترجاع Recovery Key» فوراً وتسليمه يدوياً للطبيب أو مدير العيادة لحفظه بمكان آمن.'
    ]
  },
  {
    num: '2',
    icon: '📡',
    title: 'تجهيز الراوتر المحلي وشبكة العيادة (بدون إنترنت)',
    steps: [
      'توصيل الجهاز الرئيسي براوتر العيادة عبر كابل شبكة LAN لضمان أعلى ثبات أو عبر شبكة Wi-Fi موحدة.',
      'ملاحظة هامة للطبيب: لا يلزم وجود باقة إنترنت في الراوتر؛ الراوتر يعمل كشبكة داخلية مغلقة فقط.',
      'من داخل شاشة الإعدادات بالمنظومة، انسخ رابط الشبكة المحلية (مثال: http://192.168.1.10:3000) أو أظهر رمز الـ QR.',
      'تأكد من تفعيل السماح بالمنفذ داخل جدار حماية ويندوز (Private Network) عند التشغيل الأول.'
    ]
  },
  {
    num: '3',
    icon: '🖨️',
    title: 'توصيل وضبط الطابعات (طابعة الروشتات A4 + طابعة التذاكر)',
    steps: [
      'تعريف طابعة الليزر الأساسية وتعيينها كطابعة افتراضية لطباعة الروشتات والفواتير والتقارير بمقاس A4/A5.',
      'إذا توافرت طابعة حرارية (80mm Thermal) للاستقبال، قم بتعريفها وربطها بإعدادات تذكرة انتظار المريض.',
      'إضافة شعار العيادة وبيانات الطبيب والتخصص والهاتف في ترويسة الروشتة ثم تجربة طباعة روشتة وتذكرة واحدة للتأكد.'
    ]
  },
  {
    num: '4',
    icon: '📱',
    title: 'ربط هاتف الطبيب وأجهزة السكرتارية والتمريض',
    steps: [
      'ربط هاتف الطبيب أو التابلت أو كمبيوتر الاستقبال بنفس شبكة الواي فاي للراوتر الداخلي.',
      'فتح متصفح الهاتف (Chrome/Safari) ومسح QR رابط الشبكة المحلية أو كتابة عنوان الـ IP الظاهر بالمنظومة.',
      'تسجيل الدخول لكل موظف بحسابه المخصص وصلاحياته (استقبال، طبيب، ممرضة، صيدلي، معمل).',
      'اختبار إرسال رسالة نصية وصوتية فورية بين شاشة الطبيب والاستقبال للتأكد من عمل الشات الداخلي أوفلاين.'
    ]
  },
  {
    num: '5',
    icon: '📺',
    title: 'تشغيل شاشة صالة الانتظار الذكية وبوابة هاتف المريض (QR)',
    steps: [
      'توصيل شاشة تلفزيون صالة الانتظار بالكمبيوتر عبر HDMI أو فتح متصفح الشاشة الذكية على رابط /tv عبر الواي فاي.',
      'تجربة الضغط على زر «استدعاء المريض» من غرفة الطبيب لسماع النداء الصوتي العربي التلقائي بالاسم والرقم على التلفزيون.',
      'طباعة ملصق QR بوابة المريض وتعليقه بالاستقبال ليتابع المريض دوره من هاتفه عبر واي فاي العيادة.'
    ]
  },
  {
    num: '6',
    icon: '💾',
    title: 'تأمين النسخ الاحتياطي المشفر وتسليم الكتالوج للطبيب',
    steps: [
      'توصيل فلاشة خارجية (USB Flash) وإجراء تجربة حية لزر «إنشاء نسخة احتياطية مشفرة الآن».',
      'توضيح دورة العمل اليومية للسكرتيرة والطبيب: حجز ← حضور ← نداء صوتي ← كشف وروشتة ← تحصيل وتقفيل وردية.',
      'ترك نسخة من «كتالوج ودليل استخدام المنظومة» مطبوعاً أو ملفاً على سطح مكتب جهاز الطبيب.'
    ]
  }
];

function renderDoctorCatalogFallbackHtml(agentInfo) {
  const phone = (agentInfo && agentInfo.phone) || '01122166076';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>كتالوج ودليل التشغيل السريع للطبيب والعيادة | Qalix Medical v1.0</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; direction: rtl; line-height: 1.6; }
    .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 26px 30px; border-radius: 12px; border: 1px solid #cbd5e1; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 20px; color: #0b1a2e; }
    h2 { font-size: 14.5px; color: #0284c7; border-right: 4px solid #10b981; padding-right: 8px; margin: 14px 0 8px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 12.5px; }
    ul { margin: 4px 0; padding-right: 20px; }
    .foot { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 12px; display: flex; justify-content: space-between; color: #475569; }
    @media print { body { background: #fff; padding: 0; } .page { border: none; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; background:#e2e8f0; padding:10px 14px; border-radius:8px; margin-bottom:14px;">
      <span style="font-size:12.5px; font-weight:bold;">📖 كتالوج الاستخدام المختصر (يُترك للطبيب والسكرتارية بعد التركيب)</span>
      <button onclick="window.print()" style="padding:8px 16px; background:#0284c7; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ طباعة الكتالوج للطبيب (A4)</button>
    </div>
    <div class="hdr">
      <div>
        <h1>كتالوج ودليل الاستخدام السريع للطبيب والعيادة</h1>
        <div style="font-size:12.5px; color:#64748b;">منظومة كالكس الطبية الشاملة · Qalix Medical v1.0 (أوفلاين 100%)</div>
      </div>
      <div style="text-align:left; font-size:12px;">الدعم الفني المعتمد:<br><strong dir="ltr" style="font-size:14px; color:#0284c7;">${phone}</strong></div>
    </div>
    <h2>1. دورة العمل اليومية في 6 خطوات</h2>
    <div class="box">
      <ul>
        <li><strong>الحجز وتسجيل الحضور:</strong> يُسجّل الاستقبال بيانات المريض أو يبحث باسمه/هاتفه ويمنحه رقم دور تلقائياً وتذكرة مطبوعة.</li>
        <li><strong>صالة الانتظار والنداء الصوتي:</strong> عند جاهزية الطبيب، يضغط «استدعاء المريض» ليظهر اسمه على شاشة الانتظار مع النداء الصوتي العربي.</li>
        <li><strong>الكشف الطبي والروشتة:</strong> استعراض التاريخ المرضي، تسجيل التشخيص، كتابة الأدوية مع تنبيه الحساسية والتداخلات الدوائية التلقائي، ثم طباعة الروشتة.</li>
        <li><strong>التواصل الداخلي المشفر:</strong> إرسال ملاحظات نصية أو صوتية فورية بين الطبيب والاستقبال بدون إنترنت.</li>
        <li><strong>الفواتير وتقفيل الوردية:</strong> إصدار الفاتورة وتحديد قيمة الكشف/الخدمات ثم استخراج تقرير إجمالي الإيراد بنهاية اليوم.</li>
      </ul>
    </div>
    <h2>2. تنبيهات الأمان وحماية البيانات (مهم جداً للطبيب)</h2>
    <div class="box">
      <ul>
        <li><strong>مفتاح الاسترجاع (Recovery Key):</strong> احتفظ بالنسخة المطبوعة في خزينة أو مكان آمن؛ هو الوسيلة الوحيدة لفتح بياناتك المشفرة عند تغيير الجهاز.</li>
        <li><strong>النسخ الاحتياطي التلقائي + الفلاشة:</strong> تأخذ المنظومة نسخة يومية تلقائياً، ويُنصح بنسخها أسبوعياً على فلاشة خارجية.</li>
        <li><strong>العمل من الهاتف والتابلت:</strong> افتح المتصفح على هاتفك المتصل براوتر العيادة وادخل بالرابط المحلي أو رمز الـ QR لمتابعة العيادة من أي غرفة.</li>
      </ul>
    </div>
    <div class="foot">
      <div><strong>فريق وكيل منظومة كالكس الطبية — مصر</strong></div>
      <div>واتساب واتصال الدعم الفني: <strong dir="ltr">${phone}</strong></div>
    </div>
  </div>
</body>
</html>`;
}

function renderTechnicalFieldSectionHtml(dist, agentInfo) {
  const phone = (agentInfo && agentInfo.phone) || '01122166076';
  const catalogFallbackB64 = Buffer.from(renderDoctorCatalogFallbackHtml(agentInfo), 'utf8').toString('base64');
  const quickStartFallbackB64 = readLegalDocB64('دليل_التشغيل_السريع_للمنشأة.html');
  const warrantyFallbackB64 = readLegalDocB64('شهادة_الضمان_والتسليم_السيادي.html');

  const stepsCards = TECH_SETUP_STEPS.map(s => `
    <div class="sub-card" style="border-right:3px solid var(--sky);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="background:var(--blue); color:#082f49; font-weight:900; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px;">${s.num}</span>
        <strong style="color:var(--sky); font-size:13.5px;">${s.icon} ${s.title}</strong>
      </div>
      <ul style="margin:0; padding-right:18px; font-size:12px; color:#cbd5e1; line-height:1.7;">
        ${s.steps.map(st => `<li>${st}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return {
    catalogFallbackB64,
    quickStartFallbackB64,
    warrantyFallbackB64,
    html: `
    <!-- 9. Technical Setup Guide, Doctor Catalog & Completion Confirmation to Agent -->
    <div class="card no-print" style="border:1px solid rgba(14,165,233,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
        <div>
          <span class="badge" style="background:rgba(14,165,233,0.18); color:#38bdf8; border-color:rgba(56,189,248,0.4);">القسم الفني والتشغيل الميداني للعيادات</span>
          <h3 style="margin:6px 0 0; color:var(--blue); font-size:18px;">9. دليل التركيب الفني للأجهزة، كتالوج الطبيب، وتأكيد نجاح التشغيل للوكيل</h3>
        </div>
      </div>

      <!-- Part A: Step-by-step Hardware & Network Guide -->
      <h4 style="margin:8px 0 10px; color:var(--accent); font-size:14px;">أولاً: طريقة تركيب الأجهزة وتنزيل وتشغيل المنظومة بالعيادة (6 خطوات عملية):</h4>
      <div class="grid" style="margin-bottom:16px;">
        ${stepsCards}
      </div>

      <!-- Part B: Leave Usage Catalog for the Doctor -->
      <div class="sub-card" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.35); margin-bottom:16px;">
        <h4 style="margin:0 0 6px; color:var(--accent); font-size:14px;">ثانياً: تسليم وترك كتالوج استخدام المنظومة للطبيب قبل المغادرة:</h4>
        <p style="margin:0 0 12px; font-size:12.5px; color:var(--muted);">
          اختر المستند من القائمة أو استخدم أزرار المعاينة والتحميل الفورية لحفظ وطباعة نسخة الطبيب على جهاز العيادة (تعمل أوفلاين بالكامل):
        </p>

        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; background:rgba(15,23,42,0.55); padding:10px; border-radius:10px; border:1px solid var(--border);">
          <select id="doctorCatalogActionSelect" style="flex:1; min-width:240px; margin-top:0;">
            <option value="catalog">📖 كتالوج الاستخدام المختصر للطبيب (أوفلاين A4)</option>
            <option value="quickstart">📄 دليل التشغيل السريع الرسمي للمنشأة (HTML)</option>
            <option value="pdfguide">📘 دليل المدير المصور الكامل (PDF)</option>
            <option value="warranty">🛡️ شهادة الضمان والتسليم السيادي (HTML)</option>
          </select>
          <button type="button" onclick="handleDoctorCatalogSelection('preview')" style="background:#059669; color:#fff;">👁️ معاينة / طباعة</button>
          <button type="button" onclick="handleDoctorCatalogSelection('download')" class="btn-blue">⬇️ تحميل الملف</button>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="openOfflineDoctorCatalog()" style="background:#059669; color:#fff;">📖 كتالوج الاستخدام للطبيب (معاينة وتحميل A4)</button>
          <button type="button" onclick="openQuickStartDoc()" class="btn-blue">📄 دليل التشغيل السريع (HTML)</button>
          <button type="button" onclick="openDirectorPdfGuide()" class="btn-amber">📘 دليل المدير المصور (PDF)</button>
          <button type="button" onclick="openWarrantyCertDoc()" style="background:#7c3aed; color:#fff;">🛡️ شهادة الضمان السيادي</button>
        </div>
      </div>

      <!-- Part C: Doctor Notice + Distributor Confirmation Card to Agent -->
      <div class="sub-card" style="background:#0f172a; border:1px solid var(--blue);">
        <h4 style="margin:0 0 8px; color:#38bdf8; font-size:14.5px;">ثالثاً: إخطار الطبيب بإتمام العملية ← وتأكيد الموزع للوكيل (${phone}) عبر بطاقة النجاح:</h4>
        <p style="margin:0 0 12px; font-size:12.5px; color:var(--muted);">
          بعد مراجعة التشغيل مع الطبيب وتلقي إخطاره بإتمام العمل ورضاه، علّم بنود التحقق بالأسفل وأرسل «بطاقة تأكيد نجاح العملية» مباشرة إلى الوكيل:
        </p>

        <div class="grid" style="margin-bottom:10px;">
          <div>
            <label style="font-size:12px; color:var(--muted);">اسم العيادة / المركز الطبي المنفّذ:</label>
            <input id="techClinicName" placeholder="مثال: عيادة الشفاء التخصصية" />
          </div>
          <div>
            <label style="font-size:12px; color:var(--muted);">اسم الطبيب / مدير العيادة المُخطِر بالتمام:</label>
            <input id="techDoctorName" placeholder="مثال: د. أحمد سامي - 010..." />
          </div>
        </div>

        <div style="display:grid; gap:6px; font-size:12.5px; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:10px; border:1px solid var(--border);">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" id="chkPc" style="width:16px;height:16px;margin:0;" /> تم تنزيل المنظومة على الجهاز الرئيسي وتأمين كلمة المرور ومفتاح الاسترجاع</label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" id="chkNet" style="width:16px;height:16px;margin:0;" /> تم ربط الراوتر المحلي، الطابعة، هاتف الطبيب، وشاشة صالة الانتظار وبوابة المريض</label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" id="chkCatalog" style="width:16px;height:16px;margin:0;" /> تم تدريب فريق العيادة وترك كتالوج ودليل استخدام المنظومة للطبيب</label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--accent); font-weight:bold;"><input type="checkbox" id="chkDocNotice" style="width:16px;height:16px;margin:0;" /> ✔️ أخطر الطبيب/العيادة الموزع بإتمام العملية وتشغيل كافة الأجهزة بنجاح تام</label>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" onclick="sendTechSuccessToAgentWhatsApp()" style="flex:1.4; background:linear-gradient(135deg,#10b981,#059669); color:#fff;">📲 إرسال بطاقة تأكيد نجاح العملية لواتساب الوكيل (${phone})</button>
          <button type="button" onclick="openTechSuccessCardA4(true)" class="btn-blue" style="flex:1;">🖨️ طباعة / عرض بطاقة تأكيد النجاح للوكيل (A4)</button>
          <button type="button" onclick="copyTechSuccessCard()" class="btn-amber" style="flex:0.8;">📋 نسخ نص البطاقة</button>
        </div>
      </div>
    </div>`
  };
}

module.exports = {
  TECH_SETUP_STEPS,
  renderTechnicalFieldSectionHtml
};

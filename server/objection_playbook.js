/* Qalix Medical Agent — Doctor Objection Handling & Field Playbook (Phase 5)
 * 100% Offline Air-Gapped · Zero External Dependencies
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const OBJECTION_PLAYBOOK = [
  {
    id: 'price_too_high',
    tag: 'الاستثمار والقيمة',
    objection: 'السعر غالي / البرامج التانية أرخص أو لقيت برامج مجانية على النت',
    killerResponse: 'البرامج المجانية إما مقرصنة تخرب في أول تحديث لويندوز وتضيع بيانات مرضاك للأبد، أو برامج سحابية تستدرجك باشتراك شهري 500-1500 ج.م (أي 6,000 إلى 18,000 ج.م سنوياً تدفعها للأبد!). كالكس تدفع ثمنها لمرة واحدة فقط مدى الحياة بـ 4,500 أو 8,500 ج.م دون أي اشتراك دوري نهائياً وبضمان الموزع المعتمد.',
    actionStep: 'افتح له حاسبة المقارنة المالية: وضح له أن تكلفة كالكس بعد 12 شهراً تساوي ثلث تكلفة أي برنامج سحابي باشتراك، وتوفر 100% من المصاريف في السنوات التالية.',
    suggestedWaSnippet: 'دكتورنا العزيز، البرامج السحابية بتكلف العيادة من 6 إلى 15 ألف جنيه سنوياً اشتراكات متجددة! في كالكس بتدفع 8,500 ج.م (أو 4,500 ج.م للأساسية) مرة واحدة في العمر فقط، والبرنامج بيفضل ملك لعيادتك مدى الحياة بدون ما تدفع مليم تاني.'
  },
  {
    id: 'internet_issues',
    tag: 'الاعتمادية والإنترنت',
    objection: 'النت عندي في العيادة ضعيف أو بيقطع كتير وخايف الشغل يقف',
    killerResponse: 'هذا هو السبب الرئيسي لاختيارك كالكس تحديداً! المنظومة مصممة لتكون أوفلاين 100% (Air-Gapped)، لا تحتاج راوتر أو خط أرضي أو باقة نت إطلاقاً. البرنامج يعمل بسرعة الصاروخ حتى لو فصل النت عن مصر بالكامل، وبياناتك محفوظة محلياً بالكامل داخل جهازك.',
    actionStep: 'افصل كابل النت والواي فاي أمام الطبيب في اللاب توب وافتح شاشة الكشف والروشتة واطبع تجربة أمامه لإثبات العمل المستقل 100%.',
    suggestedWaSnippet: 'أهم ميزة في كالكس يا دكتور إنها Offline بنسبة 100%؛ عيادتك مش هتتعطل ثانية واحدة حتى لو النت انقطع تماماً أو السيرفرات العالمية وقعت، الشغل شغال بسرعة لحظية.'
  },
  {
    id: 'paper_habit',
    tag: 'سهولة الاستخدام',
    objection: 'أنا والسكرتيرة متعودين على الدفاتر الورقية والكتابة باليد وسريعة معايا',
    killerResponse: 'الورق بيتلف، يضيع، ومحدش بيعرف يرجع لتاريخ مريض زاره من 6 شهور في وسط آلاف الدوسيهات. في كالكس، شاشة الكشف السريع صممت بأسلوب طبي متخصص: تختار الأدوية والجرعات باللمس أو بنقرة واحدة وتطبع الروشتة في أقل من 20 ثانية، مع منع أخطاء الصيدليات ورفع هيبة العيادة.',
    actionStep: 'أعطه الماوس واطلب منه كتابة روشتة لمريض تجريبي، ودعه يرى كيف تكتمل الروشتة في 15 ثانية بالجرعات الافتراضية.',
    suggestedWaSnippet: 'الورق بياخد وقت وبيتوه يا دكتور! مع كالكس الروشتة بتطلع في 15 ثانية مطبوعة باسم العيادة والباركود، بتمنع صيدلي يقرا اسم الدواء غلط وبتبني أرشيف رقمي لكل كشف بضغطة زر.'
  },
  {
    id: 'fear_of_migration',
    tag: 'هجرة البيانات',
    objection: 'عندي برنامج قديم وخايف أنقل البيانات فتضيع أو تبوظ أسماء المرضى',
    killerResponse: 'نحن نملك محول هجرة بيانات حصري وفوري يعمل أوفلاين؛ نأخذ نسخة الإكسيل أو الـ CSV من برنامجك القديم، ويقوم المحول بتنقية وتوحيد الحقول ومعالجة الأرقام المكررة واستيرادها لكالكس في دقيقة واحدة دون توقف عمل العيادة دقيقة واحدة.',
    actionStep: 'اطلب منه عينة 5 أسماء من برنامجه القديم على فلاشة، واعرض عليه استيرادها على شاشتك التجريبية فورياً.',
    suggestedWaSnippet: 'بيانات مرضاك في أمان تام يا دكتور؛ عندنا أداة هجرة بتنقل كل سجلات المرضى والأدوية من برنامجك القديم في دقيقة واحدة بدون أي لخبطة أو توقف للعيادة.'
  },
  {
    id: 'data_security',
    tag: 'الأمان والسرية',
    objection: 'خايف من سرقة أو تسريب أسرار المرضى أو تلف الهارد ديسك والجهاز',
    killerResponse: 'قاعدة بيانات كالكس مشفرة بالكامل بتشفير جنائي عسكري AES-256 GCM؛ حتى لو سرق أحدهم ملف القاعدة لا يستطيع قراءة حرف واحد بدون المفتاح. والنسخ الاحتياطي يتم بنقرة زر وبشكل آلي، ويتم حفظه على فلاشة أو هارد خارجي بملف واحد مشفر.',
    actionStep: 'افتح ملف قاعدة البيانات بالنوت باد أمامه ليرى الشفرة المشوهة بالكامل التي يستحيل فكها إلا عبر المنظومة المعتمدة.',
    suggestedWaSnippet: 'كالكس بتعتمد أقوى تشفير جنائي AES-256 GCM معتمد عالمياً، مفيش أي حد يقدر يوصل لبيانات مرضاك أو يسرقها، وتقدر تاخد نسخة احتياطية على فلاشة في ثانيتين.'
  },
  {
    id: 'staff_turnover',
    tag: 'تدريب السكرتارية',
    objection: 'السكرتارية بتتغير كتير ومين هيقعد يدربهم كل شوية؟',
    killerResponse: 'البرنامج مصمم بواجهة عربية واضحة جداً بأيقونات ملونة سهلة الفهم؛ أي سكرتيرة جديدة تتعلمه في 10 دقائق فقط. وبالإضافة لذلك، كموزع معتمد نضمن لك الدعم والمتابعة وتدريب أي سكرتيرة جديدة عبر الهاتف أو الفيديو.',
    actionStep: 'دع السكرتيرة الحالية تجلس على البرنامج لمدة 5 دقائق لتسجيل حجز مريض، وسترى أنها أتقنته فوراً.',
    suggestedWaSnippet: 'واجهة كالكس سهلة وبديهية وأي مساعدة هتحتاجها السكرتيرة بنوفر لها تدريب ودعم مباشر من الموزع المعتمد في أي وقت.'
  },
  {
    id: 'wifi_wireless',
    tag: 'الربط الداخلي',
    objection: 'مش عايز أسلاك ممددة في العيادة وعايز أتابع من التابلت أو الموبايل',
    killerResponse: 'كالكس تولد لك QR Code فوري على الشاشة الرئيسية؛ تفتحه من موبايلك أو تابلت السكرتيرة بكاميرا الهاتف فيتصل فوراً عبر شبكة واي فاي العيادة الداخلية بدون كابلات نهائياً وبدون أي باقة إنترنت!',
    actionStep: 'أظهر له مولد QR في لوحة التحكم واجعله يمسحه بموبايله ليرى الشاشة تفتح فوراً في المتصفح.',
    suggestedWaSnippet: 'تقدر تربط كل أجهزة العيادة وموبايلك الشخصي والتابلت بدون سلك واحد! بمجرد مسح QR Code النظام بيشتغل معاك وايرلس داخل العيادة بمنتهى السلاسة.'
  },
  {
    id: 'financial_control',
    tag: 'الرقابة المالية',
    objection: 'عايز أضمن عدم تلاعب السكرتارية في الفلوس والكشوفات والمصاريف',
    killerResponse: 'النظام مزود بتقفيل وردية محاسبي آلي وتقرير Z-Report يطبع نهاية اليوم، لا يمكن للسكرتيرة حذف أي كشف أو تعديل مبلغ تم تحصيله دون تسجيل ذلك في سجل التدقيق الجنائي غير القابل للتعديل.',
    actionStep: 'أره تقرير تقفيل الوردية اليومي وكيف يتم تجميد السجلات وإظهار أي إلغاء أو استرداد نقدي.',
    suggestedWaSnippet: 'كالكس بتوفر لك تقفيل وردية آلي وتقارير Z-Report دقيقة بتمنع أي تلاعب مالي وبتسجل كل جنيه دخل أو خرج من خزينة العيادة بدقة متناهية.'
  }
];

function getAllObjections() {
  return OBJECTION_PLAYBOOK;
}

function getObjectionById(id) {
  return OBJECTION_PLAYBOOK.find(o => o.id === id) || null;
}

const { escapeHtml } = require('./html_escape');

function renderObjectionsPlaybookA4(distInfo = {}) {
  const distName = (distInfo && distInfo.name)
    ? escapeHtml(`${distInfo.name}${distInfo.code ? ' (' + distInfo.code + ')' : ''}`)
    : 'الموزع المعتمد لمنظومة كالكس';
  const distPhone = (distInfo && distInfo.phone) ? escapeHtml(distInfo.phone) : '';
  const cardsHtml = OBJECTION_PLAYBOOK.map((o, idx) => `
    <div class="obj-card">
      <div class="obj-head">
        <div>
          <span class="num">#${idx + 1}</span>
          <strong>«${o.objection}»</strong>
        </div>
        <span class="tag">${o.tag}</span>
      </div>
      <div class="row ans"><strong>💬 الرد المفحم:</strong> ${o.killerResponse}</div>
      <div class="row act"><strong>🎯 الحركة الميدانية:</strong> ${o.actionStep}</div>
      <div class="row wa"><strong>📲 نص واتساب جاهز:</strong> «${o.suggestedWaSnippet}»</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>دليل الرد على 8 اعتراضات ميدانية وحلولها (A4) | Qalix Medical</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #f1f5f9; color: #0f172a; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.55; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 22px 26px; box-shadow: 0 12px 30px rgba(15,23,42,0.08); }
    .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; }
    .btn { padding: 8px 14px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 12.5px; }
    .btn-print { background: #0284c7; color: #fff; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px; gap: 12px; }
    .hdr h1 { margin: 0 0 4px; font-size: 20px; color: #b45309; }
    .hdr p { margin: 0; font-size: 12.5px; color: #475569; }
    .contact { text-align: left; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 8px 12px; font-size: 12px; }
    .obj-card { border: 1px solid #e2e8f0; border-right: 4px solid #f59e0b; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; background: #f8fafc; break-inside: avoid; }
    .obj-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13.5px; color: #0f172a; }
    .num { display: inline-block; background: #f59e0b; color: #fff; font-weight: 800; border-radius: 6px; padding: 1px 7px; font-size: 11.5px; margin-left: 6px; }
    .tag { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .row { font-size: 12px; margin-top: 4px; padding: 5px 8px; border-radius: 6px; }
    .ans { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
    .act { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
    .wa { background: #ffffff; border: 1px dashed #94a3b8; color: #334155; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border: none; max-width: 100%; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar no-print">
      <span style="font-size:12.5px; font-weight:700; color:#334155;">🛡️ دليل الرد على اعتراضات الأطباء الميدانية (8 اعتراضات وحلولها — A4)</span>
      <button onclick="window.print()" class="btn btn-print">🖨️ طباعة / حفظ PDF</button>
    </div>
    <div class="hdr">
      <div>
        <h1>🛡️ دليل التعامل مع 8 اعتراضات ميدانية للأطباء وحلولها</h1>
        <p>كتيب الجيب الرسمي للموزع المعتمد لإغلاق الصفقات الميدانية — منصة كالكس الأم</p>
      </div>
      <div class="contact">
        <div>الموزع المعتمد</div>
        <strong style="font-size:13px; color:#b45309;">${distName}</strong>
        ${distPhone ? `<div dir="ltr" style="font-size:13px; font-weight:700; color:#b45309;">${distPhone}</div>` : ''}
      </div>
    </div>
    ${cardsHtml}
  </div>
</body>
</html>`;
}

module.exports = {
  OBJECTION_PLAYBOOK,
  getAllObjections,
  getObjectionById,
  renderObjectionsPlaybookA4
};

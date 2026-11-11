/* Qalix Medical Agent — Distributor Training Simulator & Accreditation Engine (Phase 6)
 * 100% Offline Air-Gapped · Zero External Dependencies · A4 Printable Accreditation Certificate
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const crypto = require('node:crypto');
const { generateSimpleSvgQr } = require('./network_diagnostics');

const TRAINING_MODULES = [
  {
    id: 'm1_pricing',
    title: 'الوحدة 1: الالتزام الصارم بجدول الأسعار الرسمية الموحدة',
    summary: 'فهم الباقات الثلاث الرسمية الموحدة (4,500 / 8,500 / 18,500 ج.م) على مستوى الجمهورية وحظر حرق الأسعار.',
    keyRule: 'سعر البيع موحد وغير قابل للمفاصلة أو التخفيض الفردي، ونسبة عمولتك (27-35%) محسوبة آلياً من سعر البيع الثابت.'
  },
  {
    id: 'm2_licensing',
    title: 'الوحدة 2: استخراج بصمة الجهاز (HWID) وإجراءات الترخيص',
    summary: 'خطوات استخراج البصمة الرقمية للعيادة وإرسالها حصرياً لرقم الوكيل المعتمد (01122166076).',
    keyRule: 'إصدار التراخيص مركزي ومحمي؛ لا يُسلَّم الترخيص للعيادة إلا بعد توريد صافي الوكيل وتوثيق بصمة الجهاز.'
  },
  {
    id: 'm3_wow_demo',
    title: 'الوحدة 3: إتقان سيناريو الـ 5 دقائق (WOW Demo)',
    summary: 'تسلسل خطوات العرض العملي السريع: شاشة الانتظار -> الشات الصوتي -> فصل كابل الإنترنت -> المقارنة المالية.',
    keyRule: 'فصل الإنترنت تماماً أمام الطبيب في الدقيقة 4 هو الحركة الأكثر حسماً لإغلاق الصفقة على الفور.'
  },
  {
    id: 'm4_objections',
    title: 'الوحدة 4: الرد الحاسم على اعتراضات الأطباء والمقارنة السحابية',
    summary: 'تفنيد مخاطر الاشتراكات الشهرية وتوقف العيادة مع النت، وإثبات تفوق كالكس الأوفلاين 100%.',
    keyRule: 'إظهار أن اشتراك السحابة يكلف الطبيب 50 ألف جنيه في 3 سنوات، بينما كالكس ترخيص دائم لمرة واحدة.'
  },
  {
    id: 'm5_migration',
    title: 'الوحدة 5: هجرة شيتات المرضى القديمة بواسطة أداة Excel',
    summary: 'استيراد وتنقية شيتات إكسيل من البرامج القديمة في 60 ثانية بدون أي تسريب لبيانات العيادة.',
    keyRule: 'الهجرة فورية وتعمل أوفلاين بالكامل، مما يزيل خوف الطبيب من ضياع سجلات مرضاه القدامى.'
  },
  {
    id: 'm6_handover',
    title: 'الوحدة 6: توقيع محضر التسليم (Sign-Off) وتسوية الحسابات',
    summary: 'التأكد من توقيع الطبيب على محضر الاستلام وتشغيل الربط اللاسلكي واستخراج كشف الحساب المالي.',
    keyRule: 'محضر التسليم هو الوثيقة القانونية المعتمدة لحماية حقوق الموزع والوكيل والعيادة.'
  }
];

const EXAM_QUESTIONS = [
  {
    id: 'q1',
    moduleId: 'm1_pricing',
    question: 'ما هو السعر الرسمي الموحد للباقة التخصصية على مستوى الجمهورية؟',
    options: [
      { text: '8,500 ج.م (دفعة واحدة مدى الحياة)', correct: true },
      { text: '8,500 ج.م سنوياً', correct: false },
      { text: '4,500 ج.م شهرياً', correct: false }
    ]
  },
  {
    id: 'q2',
    moduleId: 'm2_licensing',
    question: 'إلى أي جهة يتم إرسال بصمة جهاز العيادة (HWID) ومطالبة تفعيل الترخيص؟',
    options: [
      { text: 'حصرياً إلى وكيل المنظومة الرسمي المعتمد على الرقم 01122166076', correct: true },
      { text: 'يقوم الموزع بتوليد المفتاح بنفسه دون مراجعة الوكيل', correct: false },
      { text: 'يتم رفعها لموقع إنترنت عام خارجي', correct: false }
    ]
  },
  {
    id: 'q3',
    moduleId: 'm3_wow_demo',
    question: 'ما هو الإجراء الأهم في الدقيقة 4 من سيناريو الـ 5 دقائق WOW Demo؟',
    options: [
      { text: 'فصل كابل الإنترنت والواي فاي تماماً وإجراء كشف وطباعة روشتة لإثبات العمل الأوفلاين 100%', correct: true },
      { text: 'طلب دفع ثمن البرنامج مقدماً', correct: false },
      { text: 'تغيير إعدادات شاشة ويندوز', correct: false }
    ]
  },
  {
    id: 'q4',
    moduleId: 'm4_objections',
    question: 'عندما يقول الطبيب: "البرامج التانية أرخص وباشتراك شهري بسيط"، ما هو الرد السليم؟',
    options: [
      { text: 'توضيح أن الاشتراك الشهري يكبله بـ 6,000 إلى 18,000 ج.م سنوياً للأبد ولو فصل النت العيادة تقف، بينما كالكس ترخيص دائم مدى الحياة', correct: true },
      { text: 'الموافقة على تنزيل سعر كالكس للنصف فوراً', correct: false },
      { text: 'نصحه بالرجوع للدفاتر الورقية', correct: false }
    ]
  },
  {
    id: 'q5',
    moduleId: 'm5_migration',
    question: 'كيف تتم هجرة سجلات المرضى والأدوية من برنامج العيادة القديم إلى كالكس؟',
    options: [
      { text: 'بواسطة محول هجرة البيانات الأوفلاين الفوري المدمج في لوحة التحكم في دقيقة واحدة', correct: true },
      { text: 'بإعادة كتابة كل مريض يدوياً بالاسم ورقم الهاتف من الصفر', correct: false },
      { text: 'بإرسال الشيتات لشركة مجهولة على النت لإعادة تنسيقها', correct: false }
    ]
  },
  {
    id: 'q6',
    moduleId: 'm6_handover',
    question: 'متى تعتبر صفقة العيادة مكتملة ويتم صرف عمولة الموزع المستقل رسمياً؟',
    options: [
      { text: 'بعد تركيب النظام، توقيع الطبيب محضر التسليم (Sign-Off)، وتوريد صافي الوكيل', correct: true },
      { text: 'بمجرد الاتصال التليفوني بالطبيب دون زيارة أو تركيب', correct: false },
      { text: 'بعد مرور سنة كاملة من تاريخ الزيارة الأولى', correct: false }
    ]
  }
];

function evaluateExam(answers) {
  let score = 0;
  const total = EXAM_QUESTIONS.length;
  const review = [];

  for (const q of EXAM_QUESTIONS) {
    const selectedIdx = answers[q.id];
    const isCorrect = selectedIdx !== undefined && q.options[selectedIdx] && q.options[selectedIdx].correct === true;
    if (isCorrect) score++;
    review.push({
      questionId: q.id,
      question: q.question,
      isCorrect,
      correctAnswer: (q.options.find(o => o.correct) || {}).text
    });
  }

  const passed = score === total; // Requires 100% mastery for official field accreditation
  const percentage = Math.round((score / total) * 100);

  return {
    passed,
    score,
    total,
    percentage,
    review
  };
}

function generateAccreditationCertificateHtml(dist, certDate = new Date()) {
  const dateStr = certDate.toISOString().split('T')[0];
  const certHash = crypto.createHash('sha256').update(`${dist.id}|${dist.code}|${dist.name}|${dateStr}`).digest('hex').substring(0, 10).toUpperCase();
  const certSerial = `QMA-CERT-${dateStr.replace(/-/g, '').substring(2, 6)}-${certHash}`;
  const qrSvg = generateSimpleSvgQr(`CERT:${certSerial}|DIST:${dist.code}|NAME:${dist.name}|AGENT:01122166076`);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شهادة اعتماد موزع طبي مستقل — ${dist.name} (${dist.code})</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif; }
    body { background: #0f172a; color: #0f172a; margin: 0; padding: 25px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .cert-frame { width: 980px; background: #ffffff; border: 12px double #0f766e; border-radius: 16px; padding: 36px 48px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); position: relative; }
    .inner-border { border: 2px solid #cbd5e1; border-radius: 8px; padding: 24px 32px; text-align: center; }
    .header-logo { font-size: 24px; font-weight: 900; color: #0f766e; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .sub-header { font-size: 13px; color: #64748b; margin: 0 0 20px 0; }
    .cert-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 15px 0 10px; border-bottom: 2px solid #0f766e; display: inline-block; padding-bottom: 6px; }
    .cert-body { font-size: 15px; color: #334155; line-height: 1.8; margin: 20px 0; }
    .dist-name { font-size: 24px; font-weight: 800; color: #0f766e; display: block; margin: 8px 0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin: 20px 0; font-size: 13px; text-align: right; }
    .footer-signatures { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 30px; margin-top: 30px; }
    .sig-col { text-align: center; font-size: 12.5px; color: #475569; }
    .sig-col .line { margin-top: 40px; border-top: 1.5px solid #94a3b8; width: 75%; margin-left: auto; margin-right: auto; }
    .seal-badge { border: 3px double #d97706; background: #fffbeb; color: #b45309; border-radius: 50%; width: 90px; height: 90px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 10px; font-weight: bold; margin: 0 auto; box-shadow: 0 2px 8px rgba(217,119,6,0.2); }
    .btn-print { background: #0f766e; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; margin-top: 16px; box-shadow: 0 2px 8px rgba(15,118,110,0.3); }
    @media print {
      body { background: #fff; padding: 0; }
      .cert-frame { box-shadow: none; width: 100%; border-width: 8px; }
      .btn-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="inner-border">
      <div class="header-logo">منظومة كالكس ميديكال الطبية — Qalix Medical System</div>
      <div class="sub-header">وكيل المنظومة الرسمي المعتمد · هاتف / واتساب: 01122166076 (+201122166076)</div>

      <div class="cert-title">شـــهادة اعــتـماد مـوزع مـيـدانـي مـعـتـمـد</div>

      <div class="cert-body">
        يشهد وكيل منظومة كالكس ميديكال الطبية بأن السيد / المكتب الموقر:
        <span class="dist-name">${dist.name}</span>
        قد أتم بنجاح البرنامج التدريبي المتخصص واجتاز محاكاة المبيعات الميدانية وقواعد حماية الأسعار الثابتة وأوفى بكافة المعايير المهنية، وبناءً عليه تم اعتماده رسمياً كموزع معتمد لترويج وتوريد منظومة كالكس ميديكال في النطاق الجغرافي المحدد له.
      </div>

      <div class="meta-grid">
        <div><strong>كود الموزع المعتمد:</strong> <span style="font-family:monospace; color:#0f766e;">${dist.code}</span></div>
        <div><strong>النطاق الجغرافي:</strong> ${dist.governorate}</div>
        <div><strong>نسبة العمولة الرسمية:</strong> ${dist.commission_rate}%</div>
        <div><strong>الرقم المرجعي للشهادة:</strong> <span style="font-family:monospace;">${certSerial}</span></div>
        <div><strong>تاريخ الاعتماد:</strong> ${dateStr}</div>
        <div><strong>صلاحية الاعتماد:</strong> سارية لمدة 12 شهراً</div>
      </div>

      <div class="footer-signatures">
        <div class="sig-col">
          <strong>إدارة التدريب وشبكة الموزعين</strong>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">تم التحقق من إتقان سيناريو الـ 5 دقائق</div>
          <div class="line"></div>
        </div>
        <div>
          ${qrSvg}
          <div style="font-size:9.5px; color:#64748b; margin-top:2px;">التحقق الفوري المشفر</div>
        </div>
        <div class="sig-col">
          <strong>اعتماد وكيل المنظومة الرسمي</strong>
          <div style="font-size:11px; color:#0f766e; margin-top:2px; font-weight:bold;">01122166076</div>
          <div class="line"></div>
        </div>
      </div>

      <div style="text-align:center; margin-top:14px;">
        <button class="btn-print" onclick="window.print()">🖨️ طباعة شهادة الاعتماد الرسمية (A4)</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  TRAINING_MODULES,
  EXAM_QUESTIONS,
  evaluateExam,
  generateAccreditationCertificateHtml
};

/* Qalix Medical Agent — Offline Medical Prescription Designer & Specialty Templates (Phase 7)
 * 100% Offline Air-Gapped · Zero External Dependencies · A4 & A5 Print-Ready Layouts
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

const { generateSimpleSvgQr } = require('./network_diagnostics');

const SPECIALTY_RX_PRESETS = {
  dental: {
    id: 'dental',
    nameAr: 'طب وجراحة الأسنان',
    icon: '🦷',
    defaultHeaderTitle: 'دكتور جراحة الفم والأسنان وزراعة الأسنان',
    defaultDegrees: 'عضو الجمعية المصرية لزراعة الأسنان · ماجستير علاج الجذور',
    sampleDiagnosis: 'التهاب حاد في عصب الضرس السفلي الأيمن (Pulpitis #46)',
    sampleDrugs: [
      { name: 'Augmentin 1g Tab', dose: 'قرص كل 12 ساعة بعد الأكل لمدة 6 أيام' },
      { name: 'Cataflam 50mg Tab', dose: 'قرص عند اللزوم بعد الأكل' },
      { name: 'Hexitol Mouth Wash', dose: 'مضمضة ملء غطاء لمدة دقيقة 3 مرات يومياً' }
    ],
    sampleAdvice: 'تجنب المضغ على الجانب الأيمن لمدة 48 ساعة · المضمضة بماء دافئ وملح بعد الوجبات'
  },
  pediatrics: {
    id: 'pediatrics',
    nameAr: 'طب الأطفال وحديثي الولادة',
    icon: '👶',
    defaultHeaderTitle: 'استشاري طب الأطفال وحديثي الولادة',
    defaultDegrees: 'دكتوراه طب الأطفال بجامعة أسيوط · زميل الكلية الملكية البريطانية (MRCPCH)',
    sampleDiagnosis: 'التهاب شعبي حاد مع نزلة معوية خفيفة (Acute Bronchitis)',
    sampleDrugs: [
      { name: 'Cefotax 500mg Vial', dose: 'حقن عضل كل 12 ساعة لمدة 3 أيام بعد اختبار الحساسية' },
      { name: 'Cetal Suspension 120ml', dose: '5 مل بالفم كل 6 ساعات عند ارتفاع الحرارة' },
      { name: 'Rehydran Sachets', dose: 'كيس على 200 مل ماء مغلي ومبرد بعد كل قيء أو إسهال' }
    ],
    sampleAdvice: 'الراحة التامة والإكثار من السوائل والعصائر الطبيعية · العرض الفوري في حال استمرار القيء'
  },
  internal_cardio: {
    id: 'internal_cardio',
    nameAr: 'الباطنة والقلب والأوعية الدموية',
    icon: '❤️',
    defaultHeaderTitle: 'استشاري أمراض الباطنة والقلب والسكر',
    defaultDegrees: 'ماجستير أمراض القلب والأوعية الدموية · دبلوم السكري والغدد الصماء',
    sampleDiagnosis: 'ارتفاع ضغط الدم الشرياني مع اضطراب شحوم الدم (Hypertension & Dyslipidemia)',
    sampleDrugs: [
      { name: 'Concor 5mg Tab', dose: 'قرص واحد صباحاً يومياً قبل الإفطار' },
      { name: 'Lipitor 20mg Tab', dose: 'قرص واحد مساءً قبل النوم' },
      { name: 'Natrilix SR 1.5mg Tab', dose: 'قرص واحد صباحاً' }
    ],
    sampleAdvice: 'تقليل الملح والدهون في الطعام · المشي 30 دقيقة يومياً · قياس الضغط صباحاً ومساءً وتسجيله'
  },
  obgyn: {
    id: 'obgyn',
    nameAr: 'النساء والتوليد والحقن المجهري',
    icon: '🤰',
    defaultHeaderTitle: 'استشاري أمراض النساء والتوليد والمناظير',
    defaultDegrees: 'دكتوراه النساء والتوليد · عضو الجمعية الأوروبية للخصوبة وعلاج العقم (ESHRE)',
    sampleDiagnosis: 'متابعة حمل بالشهر الرابع (Intrauterine Pregnancy 16 Weeks)',
    sampleDrugs: [
      { name: 'Materna Vit Tab', dose: 'قرص واحد يومياً بعد الغداء' },
      { name: 'Feroglobin Cap', dose: 'كبسولة واحدة يومياً بعد الإفطار' },
      { name: 'Calcimate 500mg Tab', dose: 'قرص واحد يومياً بعد العشاء' }
    ],
    sampleAdvice: 'إجراء فحص السونار التفصيلي للشهر الخامس · تجنب المجهود الشاق ورفع الأحمال'
  },
  ophthalmology: {
    id: 'ophthalmology',
    nameAr: 'طب وجراحة العيون',
    icon: '👁️',
    defaultHeaderTitle: 'استشاري طب وجراحة العيون وتصحيح الإبصار بالليزك',
    defaultDegrees: 'ماجستير طب وجراحة العيون · عضو الجمعية الرمدية المصرية',
    sampleDiagnosis: 'جفاف قرنية وحساسية موسمية بالعينين (Dry Eye Syndrome & Allergic Conjunctivitis)',
    sampleDrugs: [
      { name: 'Systane Ultra Drops', dose: 'نقطة بالعينين 4 مرات يومياً بانتظام' },
      { name: 'Pataday 0.2% Eye Drops', dose: 'نقطة واحدة بالعينين صباحاً مرة يومياً' },
      { name: 'Solcoseryl Eye Gel', dose: 'مرهم داخل العين قبل النوم مباشرة' }
    ],
    sampleAdvice: 'ارتداء النظارة الشمسية في ضوء النهار · تقليل استخدام الشاشات والموبايل'
  }
};

function getSpecialtyRxPresets() {
  return SPECIALTY_RX_PRESETS;
}

function renderPrescriptionHtml(params) {
  const specKey = params.specialty || 'dental';
  const preset = SPECIALTY_RX_PRESETS[specKey] || SPECIALTY_RX_PRESETS.dental;

  const doctorName = (params.doctorName || 'د. محمد مصطفى عبد الرحمن').trim();
  const doctorTitle = (params.doctorTitle || preset.defaultHeaderTitle).trim();
  const degrees = (params.degrees || preset.defaultDegrees).trim();
  const clinicName = (params.clinicName || 'مركز الصفوة الطبي التخصصي').trim();
  const clinicAddress = (params.clinicAddress || 'أسيوط — شارع الجمهورية — برج الأطباء').trim();
  const clinicPhone = (params.clinicPhone || '088-2345678 / 01122166076').trim();
  const paperSize = params.paperSize === 'A5' ? 'A5' : 'A4';

  const patientName = (params.patientName || 'السيد / أحمد محمود عثمان').trim();
  const patientAge = params.patientAge || '34 سنة';
  const patientGender = params.patientGender || 'ذكر';
  const rxDate = params.rxDate || new Date().toISOString().split('T')[0];
  const rxNo = params.rxNo || `RX-${new Date().getFullYear()}-0482`;

  const diagnosis = (params.diagnosis || preset.sampleDiagnosis).trim();
  const drugs = Array.isArray(params.drugs) && params.drugs.length ? params.drugs : preset.sampleDrugs;
  const advice = (params.advice || preset.sampleAdvice).trim();
  const followUpDate = params.followUpDate || 'بعد أسبوع من تاريخه';

  const qrSvg = generateSimpleSvgQr(`RX:${rxNo}|DOC:${doctorName}|PT:${patientName}|DATE:${rxDate}|PH:01122166076`);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>روشتة علاجية مطبوعة — ${rxNo} — ${doctorName}</title>
  <style>
    @page { size: ${paperSize} portrait; margin: 8mm 12mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif; }
    body { background: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
    .rx-paper { max-width: ${paperSize === 'A5' ? '560px' : '780px'}; margin: 0 auto; background: #ffffff; border: 2px solid #0f766e; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); padding: 24px 28px; position: relative; min-height: ${paperSize === 'A5' ? '780px' : '1020px'}; display: flex; flex-direction: column; justify-content: space-between; }
    
    /* Header */
    .rx-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f766e; padding-bottom: 12px; margin-bottom: 14px; }
    .doc-info { flex: 1; }
    .doc-name { font-size: 20px; font-weight: 800; color: #0f766e; margin: 0 0 3px 0; }
    .doc-title { font-size: 12.5px; font-weight: 700; color: #1e293b; margin: 0 0 2px 0; }
    .doc-degrees { font-size: 11px; color: #64748b; margin: 0; }
    .clinic-badge { text-align: left; font-size: 11.5px; color: #334155; }
    .clinic-name { font-size: 14px; font-weight: 800; color: #0f766e; }

    /* Patient Bar */
    .patient-bar { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; padding: 6px 12px; font-size: 12px; margin-bottom: 14px; }
    .patient-bar strong { color: #0f766e; }

    /* Rx Symbol & Content */
    .rx-body { flex: 1; margin-bottom: 16px; }
    .rx-sym { font-size: 28px; font-weight: 900; color: #0f766e; font-family: "Times New Roman", serif; font-style: italic; margin-bottom: 8px; }
    .diagnosis-tag { background: #f8fafc; border-right: 3px solid #0f766e; padding: 4px 10px; font-size: 11.5px; color: #475569; margin-bottom: 14px; border-radius: 0 4px 4px 0; }
    
    /* Medications List */
    .drugs-container { display: flex; flex-direction: column; gap: 10px; padding-right: 12px; }
    .drug-item { display: flex; flex-direction: column; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
    .drug-name { font-size: 14px; font-weight: 800; color: #0f172a; font-family: -apple-system, sans-serif; direction: ltr; text-align: right; }
    .drug-dose { font-size: 12.5px; color: #0f766e; font-weight: 600; margin-top: 2px; }

    /* Instructions & Advice */
    .advice-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 6px; padding: 8px 12px; margin-top: 16px; font-size: 11.5px; color: #713f12; }

    /* Footer */
    .rx-footer { border-top: 2px solid #0f766e; padding-top: 10px; margin-top: 16px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; font-size: 11px; color: #475569; }
    .contact-col { line-height: 1.4; }
    .followup-box { text-align: center; font-weight: bold; color: #0f766e; }
    .agent-tag { font-size: 9.5px; color: #94a3b8; text-align: left; }

    .print-bar { text-align: center; margin-top: 16px; }
    .btn-print { background: #0f766e; color: #fff; padding: 9px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13.5px; }
    @media print {
      body { background: #fff; padding: 0; }
      .rx-paper { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; min-height: auto; }
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="rx-paper">
    <!-- Header -->
    <div class="rx-header">
      <div class="doc-info">
        <h1 class="doc-name">${doctorName}</h1>
        <p class="doc-title">${doctorTitle}</p>
        <p class="doc-degrees">${degrees}</p>
      </div>
      <div class="clinic-badge">
        <div class="clinic-name">${preset.icon} ${clinicName}</div>
        <div>${clinicAddress}</div>
        <div dir="ltr">${clinicPhone}</div>
      </div>
    </div>

    <!-- Patient Details -->
    <div class="patient-bar">
      <div><strong>المريض:</strong> ${patientName}</div>
      <div><strong>السن:</strong> ${patientAge}</div>
      <div><strong>النوع:</strong> ${patientGender}</div>
      <div><strong>التاريخ:</strong> ${rxDate}</div>
    </div>

    <!-- Rx Body -->
    <div class="rx-body">
      <div class="diagnosis-tag">
        <strong>التشخيص الطبي:</strong> ${diagnosis}
      </div>

      <div class="rx-sym">℞</div>

      <div class="drugs-container">
        ${drugs.map((d, idx) => `
          <div class="drug-item">
            <span class="drug-name">${idx + 1}. ${d.name || d.tradeName}</span>
            <span class="drug-dose">🔹 ${d.dose || d.dosageGuide || d.dosage || 'قرص حسب تعليمات الطبيب'}</span>
          </div>
        `).join('')}
      </div>

      <div class="advice-box">
        <strong>💡 إرشادات ونصائح طبية:</strong> ${advice}
      </div>
    </div>

    <!-- Footer -->
    <div class="rx-footer">
      <div class="contact-col">
        <strong>مواعيد العيادة:</strong> يومياً من 4 م إلى 10 م عدا الجمعة<br>
        <strong>للحجز والاستفسار:</strong> ${clinicPhone}
      </div>
      <div class="followup-box">
        ميعاد الإعادة والاستشارة:<br>
        <span style="font-size:12px; font-weight:800; color:#0f766e;">${followUpDate}</span>
      </div>
      <div style="text-align:left;">
        ${qrSvg}
        <div class="agent-tag">كالكس ميديكال · 01122166076</div>
      </div>
    </div>
  </div>

  <div class="print-bar">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة الروشتة الطبية (${paperSize})</button>
  </div>
</body>
</html>`;
}

module.exports = {
  SPECIALTY_RX_PRESETS,
  getSpecialtyRxPresets,
  renderPrescriptionHtml
};

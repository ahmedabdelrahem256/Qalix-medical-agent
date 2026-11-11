/* Qalix Medical Agent — After-Sales Retention & Customer Success Engine (Phase 5)
 * 100% Offline Air-Gapped · Zero External Dependencies
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

function distSign(deal) {
  return deal && deal.distributor_name
    ? `الموزع المعتمد: ${deal.distributor_name}${deal.distributor_phone ? ' (' + deal.distributor_phone + ')' : ''}`
    : 'الموزع المعتمد لمنظومة كالكس';
}

const RETENTION_MILESTONES = [
  {
    id: 'm_day3',
    dayOffset: 3,
    titleAr: 'مكالمة الاطمئنان وبداية العمل (اليوم الثالث)',
    description: 'التأكد من سير العمل بسلاسة والاطمئنان على راحة السكرتيرة مع حجز الكشوفات وطباعة الروشتة.',
    waMessage: (deal) => `مساء الخير د. ${deal.doctor_name}، نتمنى لحضرتك يوماً موفقاً في ${deal.clinic_name}. بنتطمن على سير العمل على منظومة كالكس ميديكال وراحة فريق السكرتارية في حجز الكشوفات. إحنا دائماً في خدمتكم عبر ${distSign(deal)}.`
  },
  {
    id: 'm_day14',
    dayOffset: 14,
    titleAr: 'جلسة مراجعة الأسبوعين الأولين (اليوم 14)',
    description: 'مراجعة التقارير المالية وكشوفات المرضى والتأكد من تفعيل النسخ الاحتياطي على فلاشة خارجية.',
    waMessage: (deal) => `تحياتنا لحضرتك د. ${deal.doctor_name}؛ مر أسبوعان على تشغيل منظومة كالكس في ${deal.clinic_name}. حابين نراجع مع حضرتك تقارير الوردية والتأكد من أخذ نسخة احتياطية أسبوعية دورية لحفظ بياناتكم في أمان تام. للتواصل: ${distSign(deal)}.`
  },
  {
    id: 'm_day90',
    dayOffset: 90,
    titleAr: 'الفحص الدوري ربع السنوي (3 أشهر)',
    description: 'فحص استقرار قاعدة البيانات وسرعة البحث ومراجعة رصيد الأدوية والإجراءات.',
    waMessage: (deal) => `أهلاً دكتور ${deal.doctor_name}، موعد الفحص الفني الدوري ربع السنوي لمنظومة كالكس في ${deal.clinic_name}. النظام يعمل بكفاءة والحمد لله، لو محتاجين إضافة أي أدوية جديدة أو تحديث قائمة الإجراءات والأسعار إحنا معاكم فوراً عبر ${distSign(deal)}.`
  },
  {
    id: 'm_day180',
    dayOffset: 180,
    titleAr: 'استبيان رضاء العيادة وترشيح الزملاء (6 أشهر)',
    description: 'تقييم رضاء الطبيب وتوثيق قصة نجاح وتقديم مكافأة ترشيح لزملاء أطباء.',
    waMessage: (deal) => `دكتور ${deal.doctor_name}، فخورين بشراكتنا المستمرة في ${deal.clinic_name} على مدار 6 أشهر كاملة. يسعدنا سماع رأيكم الكريم وترشيح أي من زملائكم الأطباء للاستفادة من مزايا المنظومة وعروض الصعيد الخاصة عبر ${distSign(deal)}.`
  },
  {
    id: 'm_day330',
    dayOffset: 330,
    titleAr: 'التذكير السنوي وتجديد باقة الدعم الفني (11 شهراً)',
    description: 'تذكير بمرور عام على التشغيل الناجح وتقديم عرض استمرارية الدعم الفني المميز.',
    waMessage: (deal) => `كل عام وأنتم بخير دكتور ${deal.doctor_name}؛ بمناسبة اقتراب مرور عام كامل على تشغيل منظومة كالكس في ${deal.clinic_name}، نؤكد أن ترخيصكم دائم مدى الحياة بدون أي رسوم، ويسعدنا تقديم باقة المتابعة والصيانة الفنية السنوية الاختيارية عبر ${distSign(deal)}.`
  }
];

function calculateDealTimeline(deal) {
  const deliveryDate = new Date(deal.delivery_date || deal.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 86400));
  
  // 365 days warranty
  const warrantyDaysLeft = Math.max(0, 365 - diffDays);
  const warrantyStatus = warrantyDaysLeft > 60 ? 'active' : (warrantyDaysLeft > 0 ? 'expiring_soon' : 'expired');

  const milestones = RETENTION_MILESTONES.map(m => {
    const isDue = diffDays >= m.dayOffset;
    const isUpcoming = diffDays < m.dayOffset && diffDays >= (m.dayOffset - 7);
    const text = m.waMessage(deal);
    const waUrl = `https://wa.me/2${(deal.doctor_phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    
    return {
      id: m.id,
      dayOffset: m.dayOffset,
      titleAr: m.titleAr,
      description: m.description,
      isDue,
      isUpcoming,
      status: isDue ? 'due' : (isUpcoming ? 'upcoming' : 'pending'),
      waText: text,
      waUrl
    };
  });

  return {
    dealId: deal.id,
    dealNo: deal.deal_no,
    doctorName: deal.doctor_name,
    doctorPhone: deal.doctor_phone,
    clinicName: deal.clinic_name,
    packageTier: deal.package_tier,
    deliveryDate: deal.delivery_date || deal.created_at,
    daysSinceDelivery: diffDays,
    warrantyDaysLeft,
    warrantyStatus,
    milestones
  };
}

module.exports = {
  RETENTION_MILESTONES,
  calculateDealTimeline
};

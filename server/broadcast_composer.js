/* Qalix Medical Agent — WhatsApp Broadcast Campaigns & Clinic Engagement Hub (Phase 6)
 * 100% Offline Air-Gapped · Zero External Dependencies
 * Official Agent Phone: 01122166076 (+201122166076)
 */
'use strict';

function fmtDistributorContact(vars) {
  if (vars && vars.distributorName) {
    return `${vars.distributorName}${vars.distributorPhone ? ' (' + vars.distributorPhone + ')' : ''}`;
  }
  return (vars && vars.distributorPhone) ? `الموزع المعتمد (${vars.distributorPhone})` : 'الموزع المعتمد لمنظومة كالكس في محافظتك';
}

const BROADCAST_CAMPAIGNS = [
  {
    id: 'camp_assiut_support',
    name: 'حملة إطلاق دعم الصعيد وأسيوط (خصم 40% دائم)',
    targetAudience: 'أطباء محافظات أسيوط والصعيد والمراكز الطبية الإقليمية',
    tag: 'عرض الصعيد',
    emoji: '🌟',
    headline: 'دعم خاص 40% لأطباء أسيوط والصعيد على منظومة كالكس الطبية',
    bodyTemplate: (vars) => `مساء الخير يا دكتور ${vars.doctorName || 'العزيز'} 🌹
يسعدنا إعلام سيادتكم بإطلاق مبادرة دعم التحول الرقمي للعيادات في صعيد مصر بخصم 40% دائم من منظومة "كالكس ميديكال" الطبية.

✅ الباقة التخصصية الكاملة: 5,100 ج.م فقط بدلاً من 8,500 ج.م.
✅ الباقة الأساسية: 2,700 ج.م فقط بدلاً من 4,500 ج.م.
✅ ترخيص دائم مدى الحياة بدون أي اشتراكات شهرية أو سنوية إطلاقاً.
✅ تعمل 100% بدون إنترنت (Offline) لحفظ سرية عيادتكم.
✅ تشمل الحزم الطبية التخصصية + الربط اللاسلكي بالموبايل.

لتجربة النسخة المجانية 14 يوماً أو طلب زيارة للمعاينة بالعيادة:
تواصلوا مباشرة مع ${fmtDistributorContact(vars)}`,
    actionUrl: 'https://api.whatsapp.com/send'
  },
  {
    id: 'camp_specialty_turnkey',
    name: 'حملة حزم التخصصات الجاهزة (جاهزية العيادة في دقيقة)',
    targetAudience: 'عيادات الأسنان، الأطفال، الباطنة والقلب، النساء والتوليد، والعيون',
    tag: 'التخصصات الطبية',
    emoji: '📦',
    headline: 'عيادتك جاهزة للتشغيل الطبي فوراً مع حزم كالكس التخصصية',
    bodyTemplate: (vars) => `دكتورنا الفاضل ${vars.doctorName || ''}، تحياتنا من منظومة كالكس ميديكال 🩺
مش هتحتاج تقعد شهور تدخل أسماء الأدوية والإجراءات في عيادتك!

منظومة كالكس بتوفر حزم تخصصية جاهزة للتحميل الفوري:
🦷 طب الأسنان: 22 إجراء + 20 دواء وجراحة فم جاهزة.
👶 طب الأطفال: 20 دواء أطفال بالجرعات والأعمار + جداول التطعيمات والنمو.
❤️ الباطنة والقلب: 25 دواء ضغط وسكر + فاحص تداخلات دوائية متقدم.
🤰 النساء والتوليد: حاسبة حمل وولادة وسونار + 20 دواء ومكمل حمل.
👁️ العيون: كروت فحص قاع العين والنظارات + 18 قطرة وعلاج عيون.

احصل على حزمتك التخصصية مجاناً مع الترخيص الدائم عبر ${fmtDistributorContact(vars)}`,
    actionUrl: 'https://api.whatsapp.com/send'
  },
  {
    id: 'camp_security_offline',
    name: 'حملة الأمان وسرية أسرار المرضى (حماية العيادة من توقف النت)',
    targetAudience: 'الأطباء المتخوفون من البرامج السحابية وتسريب بيانات مرضاهم',
    tag: 'الأمان والخصوصية',
    emoji: '🛡️',
    headline: 'لماذا تضع أسرار مرضاك وإيراداتك على سيرفرات سحابية خارجية؟',
    bodyTemplate: (vars) => `دكتور ${vars.doctorName || 'العزيز'}؛ في عصر تسريب البيانات وانقطاع كابلات الإنترنت، عيادتك محتاجة أمان مطلق.

مع منظومة "كالكس ميديكال":
🔒 تشفير جنائي عسكري AES-256 GCM لكامل السجلات الطبية.
⚡ أوفلاين 100% بدون راوتر أو كابلات أو إنترنت إطلاقاً.
💰 ترخيص دائم مدى الحياة بدون اشتراكات شهرية متكررة (وفر أكثر من 50,000 ج.م في 3 سنين).
🔄 محول هجرة بيانات إكسيل ينقل بيانات مرضاك القدامى في دقيقة واحدة.

اطلب نسختك التجريبية المجانية اليوم عبر ${fmtDistributorContact(vars)}`,
    actionUrl: 'https://api.whatsapp.com/send'
  },
  {
    id: 'camp_annual_continuity',
    name: 'حملة استمرارية التشغيل والخدمات الفنية المميزة',
    targetAudience: 'العيادات التي تعمل بالمنظومة بنجاح والراغبة في الدعم الموسع',
    tag: 'ما بعد البيع',
    emoji: '🤝',
    headline: 'شراكة مستمرة وضمان فني دائم لعيادتكم',
    bodyTemplate: (vars) => `مساء الخير د. ${vars.doctorName || ''} في ${vars.clinicName || 'عيادتكم الموقرة'} 🌸
نتشرف بمرور عام من النجاح والتشغيل المستقر لمنظومة كالكس ميديكال في عيادتكم.

نؤكد أن ترخيصكم دائم مدى الحياة، ويسعدنا تقديم خدمات المتابعة الفنية الشاملة:
🛠️ فحص سنوي لاستقرار قاعدة البيانات وتنقية السجلات المؤقتة.
🔄 تحديث قوائم الأدوية والإجراءات وفق أحدث المعايير الطبية.
👨‍🏫 تدريب مجاني لأي كوادر سكرتارية جديدة في العيادة.

تواصلوا معنا في أي وقت عبر ${fmtDistributorContact(vars)}`,
    actionUrl: 'https://api.whatsapp.com/send'
  }
];

function getAllCampaigns() {
  return BROADCAST_CAMPAIGNS;
}

function composeCampaignMessage(campaignId, vars = {}) {
  const camp = BROADCAST_CAMPAIGNS.find(c => c.id === campaignId) || BROADCAST_CAMPAIGNS[0];
  const text = camp.bodyTemplate(vars);
  const targetPhone = (vars.doctorPhone || '').replace(/[^0-9]/g, '');
  const waUrl = targetPhone ? `https://wa.me/2${targetPhone}?text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  return {
    campaignId: camp.id,
    campaignName: camp.name,
    headline: camp.headline,
    text,
    waUrl
  };
}

module.exports = {
  BROADCAST_CAMPAIGNS,
  getAllCampaigns,
  composeCampaignMessage
};

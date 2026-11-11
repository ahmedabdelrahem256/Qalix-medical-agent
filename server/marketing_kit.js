/* Marketing Materials, Sales Scripts & 5-Min WOW Live Demo Kit (Phase 3)
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

const MARKETING_MATERIALS = {
  fiveMinuteDemo: {
    title: 'سيناريو العرض الميداني الحاسم في 5 دقائق (The 5-Minute WOW Live Demo)',
    objective: 'إقناع الطبيب ومدير المركز بجدارة المنظومة في أول 5 دقائق بدون إسهاب نظري ممل.',
    steps: [
      {
        step: 1,
        time: 'الدقيقة 0:00 - 1:15',
        title: 'الإبهار الأول: مسح الـ QR وسماع نداء «هدى» الصوتي الذكي',
        action: 'اطلب من الطبيب أو السكرتيرة مسح رمز QR من موبايله الشخصي مباشرة من شاشة الاستقبال.',
        whatHappens: 'تفتح صفحة العيادة فوراً على موبايله عبر شبكة الواي فاي المحلية بدون إنترنت. اضغط زر استدعاء مريض ليسمع الجميع نداءً صوتياً عربياً فائق النقاء: «المريض أحمد محمود.. التوجه لغرفة الكشف رقم 1».',
        doctorReaction: 'ذهول فوري من التطور وسهولة الربط بدون تحميل أي تطبيق من المتجر.'
      },
      {
        step: 2,
        time: 'الدقيقة 1:15 - 2:30',
        title: 'الإبهار الطبي: صمام أمان التداخلات الدوائية اللحظي (وارفارين + أسبرين)',
        action: 'افتح شاشة الروشتة السريعة واكتب دواء Warfarin ثم أضف دواء Aspirin أو Ketolac.',
        whatHappens: 'تنبثق شاشة حمراء تحذيرية عاجلة بإنذار صوتي لطيف تنبه الطبيب: «خطر نزيف حاد معدي ودماغي 4 أضعاف - يُوصى بمراقبة INR وتعديل الجرعة».',
        doctorReaction: 'شعور الطبيب بأن المنظومة ليست مجرد برنامج حسابات، بل مساعد طبي سريري يحمي سمعته الطبية وحياة مرضاه.'
      },
      {
        step: 3,
        time: 'الدقيقة 2:30 - 3:30',
        title: 'الإبهار التشغيلي: شات صوتي وتواصل داخلي مشفر بدون أسلاك وبدون إنترنت',
        action: 'سجل رسالة صوتية مدتها 4 ثوانٍ من هاتف الموزع: «يا دكتور أشعة الركبة جاهزة في ملف المريض».',
        whatHappens: 'تصل الرسالة فوراً لجهاز الطبيب وترن بهدوء، مشفرة داخل الشبكة المحلية، مما يلغي تماماً صياح التمريض في الممرات أو الحاجة لشراء أجهزة إنتركم باهظة.',
        doctorReaction: 'تنظيم راقٍ وهدوء تام داخل العيادة يليق بمستوى الأطباء الكبار.'
      },
      {
        step: 4,
        time: 'الدقيقة 3:30 - 4:15',
        title: 'الضربة القاضية: فصل كابل الإنترنت تماماً وإجراء كشف وحفظ روشتة',
        action: 'اسحب كابل الإنترنت من الراوتر أو افصل الواي فاي عن الإنترنت أمام الطبيب، ثم احجز مريضاً واطبع روشتة باركود.',
        whatHappens: 'المنظومة تعمل بنفس السرعة الفائقة بنسبة 100% دون أي توقف أو رسالة «جاري التحميل...».',
        doctorReaction: 'ارتياح تام واطمئنان من أن عيادته لن تتعطل يوماً واحداً بسبب انقطاع كابل النت أو عطل في السيرفر الخارجي.'
      },
      {
        step: 5,
        time: 'الدقيقة 4:15 - 5:00',
        title: 'الإغلاق المالي الحاسم: بطاقة المقارنة السعرية وتوفير 40,000+ ج.م',
        action: 'ضع بطاقة المقارنة A4 على مكتب الطبيب، وبين له أن تكلفة 3 سنوات في البرامج السحابية تتعدى 50,000 ج.م إيجاراً، بينما كالكس ترخيص دائم مدى الحياة بسعر كشفين في الأسبوع.',
        whatHappens: 'عرض تثبيت النسخة التجريبية فوراً ببيانات العيادة لمدة 14 يوماً مع بدء العمل الفعلي.',
        doctorReaction: 'الموافقة على بدء التجربة الفورية أو حجز الترخيص الدائم.'
      }
    ]
  },

  whatsAppTemplates: [
    {
      id: 'initial_approach',
      title: '1. رسالة التعارف الأولى للطبيب (عرض التجربة 14 يوماً)',
      category: 'استقطاب',
      target: 'عيادات ومراكز جديدة',
      text: `السلام عليكم ورحمة الله دكتورنا العزيز 🌹
مع حضرتك من مكتب الوكيل الرسمي لمنظومة "كالكس ميديكال" الطبية (01122166076).

طورنا لحضرتك أحدث منظومة طبية ذكية لإدارة العيادات والمراكز:
✅ تعمل 100% بدون إنترنت (Air-Gapped) وبسرية مطلقة لبيانات مرضاك وأرباحك.
✅ شاشة انتظار ذكية بـ QR ونداء صوتي آلي يفتح على موبايل المريض.
✅ فاحص ذكي للتداخلات الدوائية لحماية المريض من الأخطاء العادية.
✅ محادثات صوتية ونصية مشفرة بين العيادة والاستقبال بدون إنتركم وبدون أسلاك.
✅ صيدلية داخلية ومختبر وأشعة وحسابات دقيقة Z-Report.

🎁 يسعدنا إهداء حضرتك نسخة تجريبية بكامل المزايا مجاناً لمدة 14 يوماً للتجربة الفعلية داخل العيادة بدون أي التزام مالي.

رابط تحميل وتثبيت النسخة التجريبية مباشرة:
https://mega.nz/file/T6hxgRaK#j7_5EtTGN3TJcgxoOHd_eP-JENFmXHgaxXNlrKO6qGI
(حساب الدخول: admin / كلمة المرور: Qalix@11)

لطلب زيارة فنية أو المساعدة في التثبيت، يسعدنا تواصلكم على واتساب الوكيل:
https://wa.me/201122166076`
    },
    {
      id: 'cloud_objection',
      title: '2. الرد على اعتراض "أنا بستخدم برنامج سحابي أونلاين"',
      category: 'رد على اعتراضات',
      target: 'أطباء يستخدمون Tabbaba أو Vezeta أو أنظمة سحابية',
      text: `دكتورنا الفاضل، الأنظمة السحابية ممتازة لكن أغلب الأطباء يواجهون 3 مشاكل حرجة:
1. الاستنزاف المالي: دفع اشتراك شهري/سنوي متجدد يصل في 3 سنوات لأكثر من 50,000 جنيه، ولو توقف الدفع يغلق حسابك وتفقد بيانات مرضاك!
2. انقطاع الإنترنت: لو النت قطع أو بطيء، العيادة بتتوقف بالكامل والمرضى بيفضلوا منتظرين في الاستقبال.
3. سرية الإيرادات: إيرادات عيادتك اليومية وأسماء مرضاك مخزنة على خوادم شركة خارجية.

🌟 في "كالكس ميديكال":
• ترخيص دائم مدى الحياة بدفعة واحدة فقط (8,500 ج.م أو 5,100 ج.م في أسيوط) بدون أي اشتراكات شهرية.
• تعمل 100% أوفلاين بسرعة البرق حتى لو كابل النت مفصول تماماً.
• قاعدة بيانات مشفرة عسكرياً داخل جهاز عيادتك أنت فقط ولا يراها أحد سواك.

يسعدنا نوفر لحضرتك أداة هجرة مجانية ننقل بيها بيانات مرضاك القديمة لكالكس في ثوانٍ معدودة!
تواصل مباشر مع الوكيل المعتمد: https://wa.me/201122166076`
    },
    {
      id: 'pricing_closing',
      title: '3. رسالة إغلاق الصفقة وتأكيد حجز مفتاح التفعيل الدائم QLX2',
      category: 'إغلاق ومبيعات',
      target: 'طبيب انتهت فترة تجريبته ويرغب بالترخيص الدائم',
      text: `أهلاً بحضرتك د. [اسم الطبيب] 🌹
يسعدنا انتظام العمل في [اسم العيادة] عبر منظومة كالكس ميديكال الطبية.

لإصدار مفتاح الترخيص الدائم مدى الحياة (QLX2) مع الدعم الفني المباشر من الوكيل المعتمد:
• الباقة المتعاقد عليها: [الباقة التخصصية / الأساسية]
• السعر الرسمي الثابت: [8,500 ج.م / 5,100 ج.م] دفعة واحدة مدى الحياة
• بصمة جهاز العيادة (HWID): [تنسخ من شاشة التفعيل بالبرنامج]

فور تحويل صافي الرسوم، يصدر مفتاح التفعيل الدائم الموثق رقمياً ويعمل جهاز العيادة مدى الحياة بدون توقف وبدون أي رسوم خفية.

تواصل مباشر مع الإدارة المالية للوكيل:
رقم الوكيل المعتمد: 01122166076
واتساب: https://wa.me/201122166076`
    },
    {
      id: 'medical_tower_blitz',
      title: '4. حملة الأبراج والمراكز الطبية الكبرى (عرض المجموعات)',
      category: 'مبيعات جماعية',
      target: 'أبراج الأطباء والمراكز الطبية متكاملة العيادات',
      text: `السادة الأفاضل إدارة وأطباء [اسم البرج الطبي / المركز] 🏥
تحية طيبة وبعد،،

يقدم وكيل منظومة "كالكس ميديكال" الطبية عرض التجهيز الجماعي الحصري للأبراج والمراكز التخصصية:
🔹 شاشات انتظار موحدة ونداء صوتي بالاسم ورقم الغرفة لكل عيادة داخل البرج.
🔹 ربط الصيدلية الداخلية والمختبر والأشعة مع جميع غرف الكشف بدون أسلاك وبدون إنترنت.
🔹 توفير أكثر من 150,000 جنيه للبرج مقارنة بالاشتراكات السحابية السنوية للعيادات.
🔹 خصم المجموعة الميداني مع توريد راوتر العيادات المجهز والنسخ الاحتياطي المشفر.

يسعدنا حجز موعد لمعاينة ميدانية وعرض حي (Live Demo) في مقر برجكم الطبي:
وكيل منظومة كالكس ميديكال: 01122166076
واتساب: https://wa.me/201122166076`
    }
  ],

  battleCardData: {
    title: 'بطاقة المقارنة البصرية والتنافسية الميدانية (A4 Field Battle Card)',
    subtitle: 'لماذا كالكس ميديكال هي الخيار رقم #1 للأطباء والمراكز الطبية في مصر 2026؟',
    agentContact: '01122166076 (وكيل منظومة كالكس ميديكال الطبية)',
    comparisonPoints: [
      {
        feature: 'نموذج التكلفة والاستثمار',
        qalix: 'ترخيص دائم مدى الحياة (دفعة واحدة فقط: 4,500 إلى 18,500 ج.م) بدون أي مصاريف شهرية',
        competitors: 'اشتراك شهري/سنوي متجدد مستمر (36,000 إلى 54,000 ج.م في 3 سنوات فقط)'
      },
      {
        feature: 'الاعتماد على الإنترنت',
        qalix: '100% أوفلاين (Air-Gapped) بدون إنترنت نهائياً وسرعة استجابة ميكروثانية',
        competitors: 'يتوقف تماماً أو يتعطل عند انقطاع الإنترنت أو بطء شبكة وي/فودافون'
      },
      {
        feature: 'خصوصية وأمان البيانات',
        qalix: 'البيانات مشفرة بـ AES-256 على جهاز العيادة فقط، ولا يستطيع أي طرف ثالث الوصول إليها',
        competitors: 'البيانات مخزنة على سحابة خارجية مما يثير مخاوف ضريبية وتسريب بيانات المرضى'
      },
      {
        feature: 'النداء الصوتي وشاشة الانتظار',
        qalix: 'نداء صوتي عربي فائق الوضوح + شاشة انتظار تفاعلية بـ QR يفتح على موبايل المريض أوفلاين',
        competitors: 'غير متوفر أو يحتاج أجهزة هاردوير خاصة باهظة واشتراكات مستقلة'
      },
      {
        feature: 'فحص التداخلات الدوائية',
        qalix: 'مساعد دوائي ذكي ينبه الطبيب لحظياً لتداخلات الأدوية والحساسية (مثل وارفارين وأسبرين)',
        competitors: 'غير متوفر في معظم الأنظمة المنافسة أو مقتصر على أسماء تجارية محدودة'
      },
      {
        feature: 'الشات الصوتي والداخلي',
        qalix: 'مدمج مجاناً للتواصل الصوتي والنصي بين الطبيب والاستقبال بدون أجهزة إنتركم',
        competitors: 'غير موجود نهائياً، يعتمدون على مكالمات التليفون الأرضي أو الواتساب'
      },
      {
        feature: 'الصيدلية والمختبر والأشعة',
        qalix: 'مدمجة بالكامل بالباركود وتقارير الربحية وتقفيل الورديات Z-Report بدون رسوم إضافية',
        competitors: 'تباع كبرامج منفصلة تماماً برسوم تأسيس واشتراك شهري مستقل'
      }
    ]
  },

  /* Facebook Ads Studio Campaigns (Phase 8) */
  facebookCampaigns: [
    {
      id: 'fb_offline',
      campaignNum: 1,
      title: 'الإعلان 1 — بدون إنترنت (للأطباء المتضررين من البرامج السحابية)',
      badge: 'السيادة والأوفلاين 100%',
      hook: 'النت فصل؟ عيادتك شغالة عادي 🩺',
      headline: 'عيادتك كلها في نظام واحد — بدون إنترنت',
      description: 'تجربة مجانية 14 يوماً',
      postImage: '/presentations/إعلانات_فيسبوك/إعلان1_بدون_إنترنت_منشور.png',
      storyImage: '/presentations/إعلانات_فيسبوك/إعلان1_بدون_إنترنت_قصة.png',
      bodyText: `النت فصل؟ عيادتك شغالة عادي 🩺

منظومة كالكس الطبية بتشتغل على جهاز عيادتك أنت، مش على سيرفر حد تاني:
✔ مواعيد بدون تعارض وتذكرة دور
✔ ملف طبي كامل وروشتة مطبوعة
✔ فواتير وصيدلية وتقفيل خزينة
✔ بيانات المرضى مشفرة، ونسخة احتياطية تلقائية كل يوم

💎 ترخيص دائم — تدفع مرة واحدة بدون اشتراك شهري
جرّبها في عيادتك 14 يوم مجاناً 👇`,
      targetAudience: 'الأطباء، أصحاب العيادات والمجمعات، طب الأسنان، الصيدلة، إدارة العيادات (28–65 سنة)',
      ctaText: 'إرسال رسالة واتساب (01122166076)',
      facebookPageUrl: 'https://www.facebook.com/profile.php?id=61596117518854'
    },
    {
      id: 'fb_waiting_room',
      campaignNum: 2,
      title: 'الإعلان 2 — صالة الانتظار الهادئة والنداء الصوتي (للعيادات المزدحمة)',
      badge: 'الهدوء وتنظيم الانتظار',
      hook: 'خلاص يا دكتور… مفيش «دوري امتى؟» 📢',
      headline: 'صالة انتظار منظمة بنداء صوتي عربي',
      description: 'متاحة في باقة التخصصي والمؤسسات',
      postImage: '/presentations/إعلانات_فيسبوك/إعلان2_صالة_الانتظار_منشور.png',
      storyImage: '/presentations/إعلانات_فيسبوك/إعلان2_صالة_الانتظار_قصة.png',
      bodyText: `خلاص يا دكتور… مفيش «دوري امتى؟» 📢

✔ المريض بيتنادى بالاسم والرقم بصوت عربي على تلفزيون الصالة
✔ وبيتابع رقمه ومين قبله من موبايله على واي فاي العيادة
✔ بدون تطبيقات وبدون إنترنت

صالة انتظار هادية، وسكرتارية مرتاحة.
منظومة كالكس الطبية — جرّبها 14 يوم مجاناً 👇`,
      targetAudience: 'عيادات الأطفال، العظام، النساء والتوليد، المراكز التخصصية المزدحمة',
      ctaText: 'إرسال رسالة واتساب (01122166076)',
      facebookPageUrl: 'https://www.facebook.com/profile.php?id=61596117518854'
    },
    {
      id: 'fb_perpetual_pricing',
      campaignNum: 3,
      title: 'الإعلان 3 — ترخيص دائم والأسعار الرسمية (لمرحلة القرار المالي)',
      badge: 'ترخيص دائم وتوفير أسيوط 40%',
      hook: 'ادفع مرة واحدة… والنظام ملكك 💎',
      headline: 'ترخيص دائم — بدون اشتراك شهري',
      description: 'خصم 40% لعيادات ومراكز محافظة أسيوط',
      postImage: '/presentations/إعلانات_فيسبوك/إعلان3_ترخيص_دائم_منشور.png',
      storyImage: '/presentations/إعلانات_فيسبوك/إعلان3_ترخيص_دائم_قصة.png',
      bodyText: `ادفع مرة واحدة… والنظام ملكك 💎

منظومة كالكس الطبية — ترخيص دائم بدون اشتراك شهري:
• الأساسي: 4,500 ج.م (طبيب واحد)
• التخصصي: 8,500 ج.م (طبيبان + شاشة النداء + بوابة المريض)
• المؤسسات: 18,500 ج.م (بلا حدود + تأمين + تقارير + فروع)

🏛️ عيادات ومراكز محافظة أسيوط: خصم 40%

السعر يشمل التثبيت والتدريب والدعم الفني. الأسعار لا تشمل الأجهزة.`,
      targetAudience: 'أطباء يبحثون عن شراء برنامج للعيادة، المتضررون من التكلفة السنوية للبرامج السحابية',
      ctaText: 'إرسال رسالة واتساب (01122166076)',
      facebookPageUrl: 'https://www.facebook.com/profile.php?id=61596117518854'
    }
  ],

  /* Live Clinical UI Screenshots Gallery */
  clinicalGallery: [
    {
      id: 'dashboard',
      title: 'لوحة التحكم المركزية للمجمع الطبي',
      subtitle: 'مؤشرات الأداء، الإيرادات، حالات المواعيد وتنبيهات المخزون',
      image: '/presentations/صور/dashboard.jpg',
      tags: ['لوحة القيادة', 'مؤشرات حيوية', 'إيرادات']
    },
    {
      id: 'tv',
      title: 'شاشة نداء وانتظار المرضى على التلفزيون',
      subtitle: 'عرض الدور لايف مع رسائل التمني بالشفاء ودعم النداء الصوتي العربي',
      image: '/presentations/صور/tv.jpg',
      tags: ['شاشة التلفزيون', 'نداء صوتي', 'صالة الانتظار']
    },
    {
      id: 'phone_track',
      title: 'بوابة المريض لايف على الهاتف المحمول',
      subtitle: 'المريض يتابع دوره ولحظة استدعائه من هاتفه عبر شبكة واي فاي العيادة دون إنترنت',
      image: '/presentations/صور/phone-track.jpg',
      tags: ['بوابة المريض', 'واي فاي أوفلاين', 'تتبع الدور']
    },
    {
      id: 'reports',
      title: 'التقارير وذكاء الأعمال (Clinic BI & Analytics)',
      subtitle: 'تحليل دوري لاحتفاظ العيادة بالمرضى، ساعات الذروة، وطرق الدفع ومطالبات التأمين',
      image: '/presentations/صور/reports.jpg',
      tags: ['ذكاء الأعمال', 'BI', 'تحليل الإيرادات']
    },
    {
      id: 'rx',
      title: 'الكشف السريري والروشتة الإلكترونية المتقدمة',
      subtitle: 'تشخيص دقيق، علامات حيوية، فحص تداخلات دوائية وصرف فوري من الصيدلية',
      image: '/presentations/صور/rx.jpg',
      tags: ['روشتة علاجية', 'ملف طبي EMR', 'صيدلية']
    },
    {
      id: 'security',
      title: 'الاتصال بالشبكة المحلية LAN وتشفير AES-256',
      subtitle: 'ربط أجهزة العيادة بالمنفذ 4611، تشفير عسكري، ومفتاح استرجاع سيادي ونسخ احتياطي',
      image: '/presentations/صور/security.jpg',
      tags: ['ربط LAN', 'تشفير AES-256', 'نسخ احتياطي']
    },
    {
      id: 'timeline',
      title: 'الخط الزمني الطبي الشامل لسجل المريض',
      subtitle: 'استعراض تسلسلي لكافة الزيارات، التحاليل المعملية CBC، أشعة X-Ray، والروشتات',
      image: '/presentations/صور/timeline.jpg',
      tags: ['الخط الزمني', 'سجل شامل', 'أشعة وتحاليل']
    },
    {
      id: 'phone_book',
      title: 'بوابة حجز واستعلام تذكرة المريض',
      subtitle: 'بحث فوري بالهاتف عن تذكرة الدور ومواعيد العيادات وحجز مسبق ميسر',
      image: '/presentations/صور/phone-book.jpg',
      tags: ['حجز مواعيد', 'استعلام تذاكر', 'هاتف المريض']
    }
  ],

  /* Legal, Sovereign Handover & Accreditation Documents Vault */
  legalHandoverDocs: [
    {
      id: 'handover_receipt',
      title: 'محضر تسليم واستلام وإيصال سداد رسمي',
      description: 'وثيقة التسليم الرسمية التي تتضمن بنود التحقق العشرة، بيانات الترخيص، وإقرار استلام مفتاح الاسترجاع وسداد القيمة.',
      format: 'HTML / طباعة فورية A4',
      url: '/legal-docs/محضر_التسليم_وإيصال_السداد.html',
      isPrintable: true
    },
    {
      id: 'eula_contract',
      title: 'عقد ترخيص الاستخدام النهائي (EULA)',
      description: 'العقد القانوني الكامل المنظم لحقوق استخدام المنظومة، شروط الترخيص الدائم الأوفلاين، وحماية الملكية الفكرية.',
      format: 'HTML / طباعة قانونية',
      url: '/legal-docs/عقد_ترخيص_الاستخدام_EULA.html',
      isPrintable: true
    },
    {
      id: 'sla_agreement',
      title: 'اتفاقية مستوى الخدمة والدعم الفني (SLA)',
      description: 'اتفاقية الضمان والصيانة ومستويات الاستجابة التقنية والدعم الفني المباشر لعيادات ومراكز العملاء.',
      format: 'HTML / طباعة قانونية',
      url: '/legal-docs/اتفاقية_مستوى_الخدمة_والدعم_SLA.html',
      isPrintable: true
    },
    {
      id: 'sovereign_warranty',
      title: 'شهادة تسليم وضمان المنظومة السيادية',
      description: 'شهادة فخمة تثبت تشغيل المنظومة أوفلاين كحصن سيادي 100% Air-Gapped برقم ترخيص دائم مدى الحياة.',
      format: 'HTML / شهادة مذهبة قابلة للطباعة',
      url: '/legal-docs/شهادة_الضمان_والتسليم_السيادي.html',
      isPrintable: true
    },
    {
      id: 'quick_start_guide',
      title: 'دليل التشغيل السريع للمنشأة الطبية',
      description: 'دليل عملي موجز يوضح للمدير والسكرتارية والطبيب خطوات التشغيل اليومي من أول دقيقة.',
      format: 'HTML / دليل مرجعي للمنشأة',
      url: '/legal-docs/دليل_التشغيل_السريع_للمنشأة.html',
      isPrintable: true
    },
    {
      id: 'illustrated_admin_guide',
      title: 'دليل المدير المصور الشامل',
      description: 'المرجع المصور الكامل (PDF) الذي يشرح كافة أقسام المنظومة، إدارة الصلاحيات، النسخ الاحتياطي، وحسابات الوردية.',
      format: 'PDF وثائقي أصلي',
      url: '/legal-docs/دليل_المدير_المصور.pdf',
      isPrintable: false
    }
  ],

  /* Presentation Decks & Sales Collateral */
  presentationCollateral: [
    {
      id: 'master_presentation',
      title: 'العرض التقديمي الشامل المجمع للمنظومة',
      description: 'ملف العرض التقديمي الكامل الذي يستعرض كل مزايا كالكس الطبية التنافسية أمام مجالس إدارة المستشفيات والمراكز.',
      htmlUrl: '/presentations/العرض_التقديمي_الشامل_المجمع.html',
      pdfUrl: '/presentations/العرض_التقديمي_الشامل_المجمع.pdf'
    },
    {
      id: 'one_pager_card',
      title: 'بطاقة العرض والأسعار الموحدة (One-Pager Card)',
      description: 'ملف A4 ملون فائق الأناقة يوضح باقات المنظومة الثلاث ومقارنة الميزات مع عرض خصم 40% لأسيوط.',
      htmlUrl: '/presentations/بطاقة_عرض_منظومة_كالكس_الطبية_الموحدة.html',
      pdfUrl: '/presentations/بطاقة_عرض_منظومة_كالكس_الطبية_الموحدة.pdf',
      pngUrl: '/presentations/بطاقة_عرض_منظومة_كالكس_الطبية_الموحدة.png'
    },
    {
      id: 'sales_delivery_guide',
      title: 'دليل المبيعات والتسعير والتسليم للموزعين',
      description: 'الدليل الاحترافي المرجعي لممثلي المبيعات والموزعين: خطة الزيارات، معالجة الاعتراضات، بروتوكول التسليم والتسعير.',
      htmlUrl: '/presentations/دليل_المبيعات_والتسعير_والتسليم.html',
      pdfUrl: '/presentations/دليل_المبيعات_والتسعير_والتسليم.pdf'
    },
    {
      id: 'doctor_phone_demo',
      title: 'عرض هاتف الطبيب التفاعلي السريع',
      description: 'عرض تفاعلي مصمم خصيصاً ليفتحه الطبيب على شاشة هاتفه أثناء الزيارة الميدانية ليتعرف على المنظومة في ثوانٍ.',
      htmlUrl: '/presentations/عرض_هاتف_الطبيب.html',
      pdfUrl: '/presentations/عرض_هاتف_الطبيب.pdf'
    },
    {
      id: 'trial_download_page',
      title: 'صفحة تحميل وتثبيت كالكس الطبية التجريبية',
      description: 'صفحة ويب نظيفة ومباشرة تشرح للطبيب خطوات تنزيل وتثبيت النسخة التجريبية 14 يوماً مع بيانات الدخول الافتراضية.',
      htmlUrl: '/presentations/تحميل كالكس الطبية.html'
    }
  ],

  /* Marketing Videos (Salma Voice Studio) */
  marketingVideos: [
    {
      id: 'video_4x5_v2',
      title: 'فيديو كالكس الطبية بصوت سلمى (الإصدار الجديد - 4:5 للمنشورات)',
      description: 'مقطع فيديو ترويجي رسمي عالي الجودة بنسبة أبعاد 4:5 مناسب تماماً لمنشورات فيسبوك وإنستجرام.',
      url: '/presentations/فيديو_تسويقي/فيديو_كالكس_الطبية_بصوت_سلمى_الإصدار_الجديد_4x5.mp4'
    },
    {
      id: 'video_vertical_v2',
      title: 'فيديو كالكس الطبية بصوت سلمى (عمودي 9:16 للريلز والستوري)',
      description: 'مقطع فيديو ترويجي طولي مصمم باحترافية كاملة لحملات الـ Reels و Stories مع المؤثرات الصوتية.',
      url: '/presentations/فيديو_تسويقي/فيديو_كالكس_الطبية_بصوت_سلمى_الإصدار_الجديد_عمودي.mp4'
    },
    {
      id: 'video_4x5_v1',
      title: 'فيديو كالكس الطبية الكلاسيكي بصوت سلمى (4:5)',
      description: 'النسخة الأصلية من الفيديو التسويقي بنسبة 4:5 للمنشورات والتغذية الإخبارية.',
      url: '/presentations/فيديو_تسويقي/فيديو_كالكس_الطبية_بصوت_سلمى_4x5.mp4'
    },
    {
      id: 'video_vertical_v1',
      title: 'فيديو كالكس الطبية الكلاسيكي عمودي (9:16)',
      description: 'النسخة العمودية الأصلية للقصص وحالات واتساب والريلز.',
      url: '/presentations/فيديو_تسويقي/فيديو_كالكس_الطبية_بصوت_سلمى_عمودي.mp4'
    }
  ]
};

const { generateSimpleSvgQr } = require('./network_diagnostics');

function renderWhatsAppCatalogA4() {
  const qrSvg = generateSimpleSvgQr('https://wa.me/201122166076', 90);
  const cardsHtml = MARKETING_MATERIALS.whatsAppTemplates.map((t, idx) => `
    <div class="template-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
        <div>
          <span class="badge" style="background:#0284c7; color:#fff; font-size:11px; padding:2px 8px; border-radius:6px;">${t.category}</span>
          <strong style="margin-right:8px; font-size:14px; color:#0f172a;">${t.title}</strong>
        </div>
        <span style="font-size:11.5px; color:#64748b;">🎯 الفئة المستهدفة: ${t.target}</span>
      </div>
      <pre class="script-box">${t.text}</pre>
      <div class="no-print" style="display:flex; gap:10px; margin-top:10px; justify-content:flex-end;">
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(t.text)}" target="_blank" class="action-btn wa-btn">
          📲 فتح وإرسال عبر تطبيق واتساب مباشرة
        </a>
        <button onclick="navigator.clipboard.writeText(${JSON.stringify(t.text).replace(/"/g, '&quot;')}); alert('تم نسخ نص الرسالة للحافظة بنجاح!');" class="action-btn copy-btn">
          📋 نسخ النص
        </button>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>كتالوج رسائل واتساب البيعية وسيناريوهات الاستقطاب | Qalix Medical</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; direction: rtl; }
    .doc-container { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .title-box h1 { margin: 0; font-size: 20px; color: #0284c7; }
    .title-box p { margin: 4px 0 0; font-size: 12.5px; color: #64748b; }
    .guidance-box { background: #eff6ff; border-right: 4px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12.5px; color: #1e3a8a; line-height: 1.6; }
    .template-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
    .script-box { white-space: pre-wrap; font-family: inherit; font-size: 12px; line-height: 1.6; margin: 0; background: #ffffff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; }
    .action-btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .wa-btn { background: #10b981; color: #ffffff; }
    .copy-btn { background: #e2e8f0; color: #334155; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11.5px; color: #64748b; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .template-card { border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; background:#f1f5f9; padding:10px 16px; border-radius:8px;">
      <span style="font-size:12.5px; color:#475569;">📄 وثيقة رسمية معتمدة قابلة للطباعة A4 أو الحفظ كـ PDF للموزعين الميدانيين</span>
      <button onclick="window.print()" style="padding:8px 16px; background:#0284c7; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ طباعة الكتالوج (A4 / PDF)</button>
    </div>

    <div class="header">
      <div class="logo-box">
        <div style="width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg,#0284c7,#0369a1); display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px;">💬</div>
        <div class="title-box">
          <h1>كتالوج رسائل واتساب البيعية وسيناريوهات الاستقطاب الميداني</h1>
          <p>منظومة كالكس ميديكال الطبية الشاملة · الوكيل الرسمي المعتمد: 01122166076</p>
        </div>
      </div>
      <div>
        ${qrSvg}
      </div>
    </div>

    <div class="guidance-box">
      <strong>تعليمات الموزع الميداني:</strong> هذه الرسائل صيغت بعناية فائقة لتخاطب اهتمامات الأطباء العملية وتغلق الصفقات بسرعة. اختر الرسالة المناسبة لحالة الطبيب واضغط زر الفتح لإرسالها مباشرة من حساب واتساب الخاص بك.
    </div>

    ${cardsHtml}

    <div class="footer">
      <div>
        <strong>وكيل منظومة كالكس ميديكال — جمهورية مصر العربية</strong><br>
        هاتف وواتساب الدعم والمبيعات الموحد: 01122166076
      </div>
      <div style="text-align:left;">
        وثيقة معتمدة ومحدثة دورياً · ترخيص دائم مدى الحياة 100% أوفلاين
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderWowDemoA4() {
  const qrSvg = generateSimpleSvgQr('https://wa.me/201122166076', 90);
  const stepsHtml = MARKETING_MATERIALS.fiveMinuteDemo.steps.map(s => `
    <div class="step-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="step-badge">الخطوة ${s.step} · ${s.time}</span>
        <strong style="font-size:14px; color:#0f172a;">${s.title}</strong>
      </div>
      <div style="font-size:12.5px; line-height:1.6; margin-bottom:6px;">
        <strong style="color:#0284c7;">🎯 الإجراء الميداني المطلوب من الموزع:</strong> ${s.action}
      </div>
      <div style="font-size:12.5px; line-height:1.6; margin-bottom:6px;">
        <strong style="color:#10b981;">⚡ ما يحدث على الشاشة:</strong> ${s.whatHappens}
      </div>
      <div style="font-size:12px; line-height:1.5; background:#fffbeb; border:1px solid #fef3c7; padding:8px 12px; border-radius:6px; color:#92400e;">
        <strong>💡 رد فعل الطبيب المتوقع:</strong> ${s.doctorReaction}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>دليل سيناريو العرض الميداني الحاسم في 5 دقائق | Qalix Medical</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; direction: rtl; }
    .doc-container { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 20px; }
    .title-box h1 { margin: 0; font-size: 20px; color: #7c3aed; }
    .title-box p { margin: 4px 0 0; font-size: 12.5px; color: #64748b; }
    .step-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
    .step-badge { background: #7c3aed; color: #fff; font-size: 11px; padding: 3px 10px; border-radius: 6px; font-weight: bold; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11.5px; color: #64748b; }
    @media print {
      body { background: #fff; padding: 0; }
      .doc-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .step-card { border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; background:#f1f5f9; padding:10px 16px; border-radius:8px;">
      <span style="font-size:12.5px; color:#475569;">📄 دليل تدريب الموزع الميداني — خطة الإبهار السريع في 5 دقائق</span>
      <button onclick="window.print()" style="padding:8px 16px; background:#7c3aed; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ طباعة الدليل (A4 / PDF)</button>
    </div>

    <div class="header">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg,#8b5cf6,#6d28d9); display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px;">⏱️</div>
        <div class="title-box">
          <h1>سيناريو العرض الميداني الحاسم في 5 دقائق (WOW Demo)</h1>
          <p>خطة الإبهار الفوري في العيادة · وكيل المنظومة الرسمي: 01122166076</p>
        </div>
      </div>
      <div>
        ${qrSvg}
      </div>
    </div>

    <div style="background:#f5f3ff; border-right:4px solid #7c3aed; padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:12.5px; color:#5b21b6; line-height:1.6;">
      <strong>الهدف الميداني:</strong> إقناع الطبيب ومدير المركز بجدارة المنظومة التامة في أول 5 دقائق بدون إسهاب نظري ممل، عبر إجراءات عملية يراها الطبيب بعينيه ويسمعها بأذنيه.
    </div>

    ${stepsHtml}

    <div class="footer">
      <div>
        <strong>منظومة كالكس ميديكال الطبية الشاملة</strong><br>
        هاتف وواتساب الوكيل المعتمد: 01122166076
      </div>
      <div style="text-align:left;">
        دليل معتمد للموزعين الميدانيين · معدل إغلاق صفقات +80%
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderBattleCardA4(distributor) {
  const qrSvg = generateSimpleSvgQr('https://wa.me/201122166076', 84);
  const bc = MARKETING_MATERIALS.battleCardData;
  const rowsHtml = bc.comparisonPoints.map(p => `
    <tr>
      <td style="font-weight:700; color:#0f172a; background:#f8fafc;">${p.feature}</td>
      <td style="color:#065f46; font-weight:700; background:#ecfdf5;">✔ ${p.qalix}</td>
      <td style="color:#9f1239; background:#fff1f2;">✖ ${p.competitors}</td>
    </tr>
  `).join('');

  const distLine = distributor
    ? `الموزع المعتمد: <strong>${distributor.name} (${distributor.code})</strong>`
    : `وكيل منظومة كالكس ميديكال الطبية المعتمد`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>بطاقة المقارنة التنافسية (A4 Battle Card) | Qalix Medical</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; direction: rtl; }
    .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 26px 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: #e2e8f0; padding: 10px 14px; border-radius: 8px; }
    .hero { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0f172a, #0284c7); color: #fff; padding: 18px 22px; border-radius: 12px; margin-bottom: 16px; }
    .hero h1 { margin: 0; font-size: 20px; line-height: 1.4; }
    .hero p { margin: 4px 0 0; font-size: 12.5px; color: #bae6fd; }
    .savings-banner { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 10px; padding: 12px 16px; text-align: center; margin-bottom: 16px; color: #92400e; }
    .savings-banner strong { font-size: 15px; display: block; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12.2px; margin-bottom: 16px; }
    th, td { padding: 9px 10px; border: 1px solid #cbd5e1; text-align: right; line-height: 1.5; }
    thead th { background: #0f172a; color: #ffffff; font-size: 13px; }
    thead th.qalix-col { background: #059669; }
    thead th.comp-col { background: #be123c; }
    .pricing-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
    .tier-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; text-align: center; background: #f8fafc; }
    .tier-box.featured { border: 2px solid #0284c7; background: #f0f9ff; }
    .tier-box b { display: block; font-size: 13.5px; color: #0f172a; }
    .tier-box .price { font-size: 18px; font-weight: 900; color: #059669; margin: 4px 0; }
    .tier-box small { font-size: 11px; color: #64748b; display: block; }
    .assiut-box { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 8px 12px; text-align: center; font-size: 12px; color: #065f46; font-weight: 700; margin-bottom: 14px; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #0f172a; padding-top: 12px; font-size: 12px; color: #334155; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar no-print">
      <span style="font-size:12.5px; color:#334155; font-weight:bold;">⚔️ بطاقة المقارنة التنافسية (صفحة A4 واحدة مغلفة للزيارات الميدانية)</span>
      <button onclick="window.print()" style="padding:8px 18px; background:#0284c7; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">🖨️ طباعة بطاقة المقارنة (A4 / PDF)</button>
    </div>

    <div class="hero">
      <div>
        <h1>⚔️ ${bc.title}</h1>
        <p>${bc.subtitle}</p>
      </div>
      <div style="background:#fff; padding:4px; border-radius:8px;">
        ${qrSvg}
      </div>
    </div>

    <div class="savings-banner">
      <strong>💰 لماذا يختار الأطباء منظومة كالكس؟ توفير يتجاوز 40,000+ ج.م خلال 3 سنوات!</strong>
      <span>توقف عن دفع اشتراكات شهرية متجددة وامتلك نظام عيادتك بالكامل دفعة واحدة مدى الحياة — 100% أوفلاين بدون إنترنت.</span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:22%;">وجه المقارنة الحاسم</th>
          <th class="qalix-col" style="width:42%;">★ منظومة كالكس الطبية (Qalix Medical v1.0)</th>
          <th class="comp-col" style="width:36%;">الأنظمة السحابية والمنافسون</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="pricing-strip">
      <div class="tier-box">
        <b>الباقة الأساسية</b>
        <div class="price">4,500 ج.م</div>
        <small>ترخيص دائم · طبيب واحد · مستخدمان</small>
      </div>
      <div class="tier-box featured">
        <b>الباقة التخصصية ⭐ الأكثر مبيعاً</b>
        <div class="price" style="color:#0284c7;">8,500 ج.م</div>
        <small>دائم · شاشة الانتظار + النداء الصوتي + QR</small>
      </div>
      <div class="tier-box">
        <b>باقة المراكز الكبرى</b>
        <div class="price">18,500 ج.م</div>
        <small>أطباء وفروع غير محدودة + ذكاء الأعمال</small>
      </div>
    </div>

    <div class="assiut-box">
      🏛️ مبادرة دعم عيادات محافظة أسيوط (خصم 40%): الأساسية 2,700 ج.م · التخصصية 5,100 ج.م · المراكز 11,100 ج.م
    </div>

    <div class="footer">
      <div>
        <div style="margin-bottom:2px;">${distLine}</div>
        <div>المبيعات والاشتراكات والدعم الفني المعتمد (واتساب واتصال): <strong dir="ltr" style="font-size:14px; color:#0284c7;">01122166076</strong></div>
      </div>
      <div style="text-align:left;">
        <strong>تجربة مجانية 14 يوماً بكامل المزايا</strong><br/>
        <span style="font-size:11px; color:#64748b;">تشفير عسكري AES-256 · بدون إنترنت</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  MARKETING_MATERIALS,
  renderWhatsAppCatalogA4,
  renderWowDemoA4,
  renderBattleCardA4
};

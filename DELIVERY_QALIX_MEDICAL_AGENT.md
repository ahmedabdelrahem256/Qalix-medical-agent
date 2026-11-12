# وثيقة التسليم واستكمال التطوير — مشروع كالكس لإدارة الوكلاء والموزعين
## Qalix Agents & Distributors Management — Official Developer Handoff & Architecture Guide
**تاريخ التحديث:** 2026-11-11 · **الإصدار التجريبي الأول:** `v1.0.0` · **الحالة:** مكتمل ومختبر 100% (`83/83` اختبار آلي ناجح)  
**الاسم الرسمي بالعربية:** كالكس لإدارة الوكلاء والموزعين  
**الاسم الرسمي بالإنجليزية:** `Qalix Agents & Distributors Management`  
**المسار المعتمد للتطوير على ويندوز:** `G:\Qalix medical agent`  
**مستودع GitHub الرسمي:** [Qalix-medical-agent](https://github.com/ahmedabdelrahem256/Qalix-medical-agent)  
**هوية وكيل كالكس الطبية النشط محلياً:** `01122166076` (بينما حزمة التسليم المصدّرة لمدير الوكلاء مصفّرة 100%)

---

## 🎯 1. ملخص تنفيذي للمطور عند الاستلام (ماذا ينتظرك لاستكمال المشروع؟)

تم تسليم نسخة تشغيلية أولى (`v1.0`) كاملة أوفلاين لمدير الوكلاء في صيغة برنامج تثبيت ويندوز مستقل [`data/exports/Qalix_11Systems_Setup_v1.0.exe`](file:///G:/Qalix%20medical%20agent/data/exports/Qalix_11Systems_Setup_v1.0.exe) (ومضغوطها [`Qalix_11Systems_Setup_v1.0.zip`](file:///G:/Qalix%20medical%20agent/data/exports/Qalix_11Systems_Setup_v1.0.zip)).  
عند عودتك لاستكمال الربط الإداري، المطلوب الرئيسي منك ينحصر **خارج هذا المشروع بالكامل** داخل أداة **المنصة الأم المستقلة** كما يلي:

1. **مراجعة المنظومة والتحقق المحلي:**
   - شغّل `node tests/test_agent.js` للتحقق الفوري من اجتياز الاختبارات الـ **83**.
   - راجع ملف التحقق من التراخيص [`server/license.js`](file:///G:/Qalix%20medical%20agent/server/license.js) وتنسيقات `QLX2.<payload>.<signature>`.
2. **إضافة هذه المنظومة والـ 11 منظومة بداخلها داخل أداة المنصة الأم فقط (لإصدار المفاتيح يدوياً):**
   - **قاعدة دستورية صارمة:** لا تُضِف أي مفتاح خاص (`Private Key`) أو كود توليد مفاتيح داخل مشروع `G:\Qalix medical agent` أبداً.
   - هذا المشروع يحتوي **حصراً على المفتاح العام للمنصة** (`QALIX_PUBLIC_KEY_HEX` في [`server/license.js`](file:///G:/Qalix%20medical%20agent/server/license.js#L30)):
     ```text
     342a869366524be5b2c2dfffc8d032fce89c9bd6326e19c3366e7e1a4807b434
     ```
   - في أداة المنصة الأم الخارجية الخاصة بك:
     - سجّل معرّف هذه المنظومة (`SYSTEM_ID = 'qalix-platform'`، والمعرّفات المقبولة في `ACCEPTED_SYSTEM_IDS`: `qalix-platform`, `qalix_platform`, `qalix-agents`, `qalix_agents`, `universal-agents`, `universal_agent`).
     - تأكد من شمول كافة منظومات كالكس الـ **11** المدمجة هنا (مفهرسة في [`server/systems_manager.js`](file:///G:/Qalix%20medical%20agent/server/systems_manager.js)):
       1. `qalix_medical` (كالكس ميديكال — الطبي)
       2. `qalix_platform` (منظومة إدارة الوكلاء / المنصة)
       3. `qalix_finance` (المالية والمحاسبة)
       4. `qalix_assets` (الأصول والصيانة)
       5. `qalix_enterprise` (المؤسسات الكبرى ERP)
       6. `qalix_stores` (المخازن والمبيعات POS)
       7. `qalix_hr` (الموارد البشرية والرواتب)
       8. `qalix_education` (المؤسسات التعليمية)
       9. `qalix_inspection` (التفتيش والجودة والرقابة)
       10. `qalix_security` (الأمن السيبراني والمراقبة)
       11. `qalix_ai` (الذكاء الاصطناعي والتحليل)
     - تطابق بصمة الجهاز `getHardwareId()` (`SHA-256` أول 24 خانة من `MachineGuid` + `COMPUTERNAME` + `PROCESSOR_IDENTIFIER`).
   - يظل مدير الوكلاء يرفع أو يستلم طلبات المفاتيح عبر صندوق `agent_key_requests` (`manual_license_key` يظل فارغاً أو `PENDING_MANUAL_KEY_FROM_PLATFORM` حتى يجلب مدير الوكلاء المفتاح يدوياً من المنصة الأم عند الطلب).
3. **إصدار تحديثات قادمة لبرنامج التثبيت (إذا أضفت ميزات جديدة):**
   - عدّل الشيفرة هنا في `G:\Qalix medical agent` ➔ شغّل `node tests/test_agent.js` ➔ أعد بناء المُثبِّت عبر [`server/installer_builder.js`](file:///G:/Qalix%20medical%20agent/server/installer_builder.js) (يستخدم **Inno Setup 6** لتجميع `Qalix_11Systems_Setup_v1.0.exe`).

---

## 📜 2. دستور كالكس والقواعد الحاكمة للمشروع (غير قابلة للكسر)

1. **100% أوفلاين (`Air-Gapped`) ومنع الاستضافة السحابية:**
   - الخادم في [`server/agent_server.js`](file:///G:/Qalix%20medical%20agent/server/agent_server.js#L74) مضبوط على عنوان الاسترجاع المحلي `127.0.0.1` فقط.
   - ممنوع إضافة أي سكريبت أو إعداد تشغيل سحابي أونلاين (تم إزالة `START_SERVER.sh`).
   - جميع حزم Node (`server/*.js`) مكتوبة بدون أي حزم خارجية (`"dependencies": {}` في [`package.json`](file:///G:/Qalix%20medical%20agent/package.json)) وتعتمد على `node:sqlite` المدمجة في Node 22/24.
2. **التشغيل كبرنامج ويندوز حديث + ضمان الكتابة المحلية:**
   - يشتغل التطبيق عبر [`Qalix_Desktop_App.vbs`](file:///G:/Qalix%20medical%20agent/Qalix_Desktop_App.vbs) و[`server/windows_app_launcher.js`](file:///G:/Qalix%20medical%20agent/server/windows_app_launcher.js) في وضع نافذة تطبيق مستقلة (`--app`) بدون شاشة CMD سوداء.
   - مسار التثبيت المعتمد على ويندوز هو `{localappdata}\QalixAgentsPlatform` بوضع `PrivilegesRequired=lowest` (وليس `Program Files` المحمي للقراءة فقط) لضمان حفظ البيانات في `data\` بدون مشاكل صلاحيات.
   - تثبيت قواعد SQLite WAL عبر `PRAGMA wal_checkpoint(TRUNCATE)` عند الإغلاق (`gracefulShutdown`) وعبر مسار `/api/system/flush-storage` وفحص الكتابة الحي `/api/system/storage-health`.
3. **الأسعار الرسمية الموحدة (مع إلغاء خصم أسيوط 40%):**
   - **الأساسية (Basic):** `4,500 ج.م`
   - **المتقدمة (Pro):** `8,500 ج.م`
   - **المؤسسية (Enterprise):** `18,500 ج.م`
   - شرائح عمولات الموزعين: `Bronze 27%`، `Silver 29%`، `Gold 32%`، `Platinum 35%`.
4. **العزل الكامل والأمان:**
   - حظر تعديل ملفات منظومة العيادات (`Qalix_Medical_v1.0.zip`) أو الدخول للقرص `E:`.
   - عزل لوحة الوكيل عن الأدوات السريرية، وحجب بيانات صاحب المنصة عن العقود وبوابات الموزعين والأطباء، وعزل الـ 11 منظومة بحيث يكون لكل منظومة مجلدها وقاعدة بياناتها المستقلة `data/systems/<id>/agent.db`.
   - حماية العمليات الإدارية والسرية لمدير الوكلاء برمز `PIN` عبر [`isManagerAuthorized`](file:///G:/Qalix%20medical%20agent/server/manager_security.js#L142).

---

## 🏗️ 3. البنية التحتية وقواعد البيانات والنسخة الحالية

### أ) قواعد البيانات في مجلد التطوير (`G:\Qalix medical agent\data`)
* **`data/agent.db` (المنظومة النشطة `qalix_medical`):** تحتوي على بيانات كالكس الطبية التشغيلية الحالية (`3` موزعين، `3` صفقات، `PRAGMA integrity_check = ok`).
* **`data/systems/<id>/agent.db` (الـ 10 منظومات الأخرى):** خام ومصفّرة بالكامل (`0` موزعين، `0` صفقات، جميعها `PRAGMA integrity_check = ok`).
* **`data/manager_hub.db`:** مركز إدارة الوكلاء (`manager_settings`, `agent_key_requests`, `manager_sessions`, `synced_agent_snapshots`، `PRAGMA integrity_check = ok`).
* **تنظيف بيئة العمل:** لا توجد ملفات `install.json` أو `.trial_clock.json` أو `-wal`/`-shm` معلّقة في `data/`.

### ب) حزمة التسليم النهائية الموجودة في [`data/exports/`](file:///G:/Qalix%20medical%20agent/data/exports)
| الملف | الحجم | الوصف | بصمة `SHA-256` |
| :--- | :--- | :--- | :--- |
| [`Qalix_11Systems_Setup_v1.0.exe`](file:///G:/Qalix%20medical%20agent/data/exports/Qalix_11Systems_Setup_v1.0.exe) | `141.99 MB` | برنامج تثبيت ويندوز الكامل (Inno Setup + `runtime/node.exe` + الـ 11 منظومة مصفّرة + الوسائط + أيقونة كالكس + `unins000.exe`) | `ea184fdd07a5109833a07aeb134a13e5ca27a3dd381b87df72453d57281f7c1d` |
| [`Qalix_11Systems_Setup_v1.0.zip`](file:///G:/Qalix%20medical%20agent/data/exports/Qalix_11Systems_Setup_v1.0.zip) | `141.45 MB` | الحزمة المضغوطة الجاهزة للمشاركة (تضم `Qalix_11Systems_Setup_v1.0.exe` + `README_INSTALL.txt`) | `90c80674151d32e6da9f38dcc484ecd13a852b1be304847618a681c4a47730a8` |
| [`Qalix_11Systems_Setup_v1.0.sha256.txt`](file:///G:/Qalix%20medical%20agent/data/exports/Qalix_11Systems_Setup_v1.0.sha256.txt) | `< 1 KB` | ملف بصمات التحقق للنسختين | — |

---

## 🧩 4. سجل المراحل المنجزة (من التأسيس حتى v1.0)

* **المراحل 1 – 9 (التأسيس والتشغيل التجاري للوكيل والموزعين):** خادم الوكيل والأسعار الموحدة وسجل التدقيق `SHA-256`، ركن التطوير والمنافسين، حزم التخصصات وهجرة Excel/CSV، فحص الشبكة `QR` والعقود وكشوف الحسابات، عروض الأسعار A4 وكتيب الاعتراضات ومتابعة ما بعد البيع والنسخ الاحتياطي WAL، التحليلات البصرية Pure SVG وامتحان اعتماد الموزعين وجاهزية العيادات وحملات واتساب، شرائح العمولات 27%–35% والتنبؤ المالي، مكتبة العروض والوسائط والوثائق القانونية، الحماية الجغرافية `lead_locks` وسندات القبض والتقارير التنفيذية.
* **المراحل 10 – 11 (التطهير والترابط والتثبيت الميداني):** لوحة المطور والتصفير الآمن ([`dev_console.js`](file:///G:/Qalix%20medical%20agent/server/dev_console.js))، توظيف الموزعين ([`distributor_recruitment.js`](file:///G:/Qalix%20medical%20agent/server/distributor_recruitment.js))، الدليل الفني الميداني ([`technical_field_guide.js`](file:///G:/Qalix%20medical%20agent/server/technical_field_guide.js))، توقيع الموزع المستقل وبوابات HTML المعزولة ([`portal_template.js`](file:///G:/Qalix%20medical%20agent/server/portal_template.js)).
* **مراحل التطوير المتقدمة لمدير الوكلاء والتسليم الكامل (الاختبارات 61 – 83):**
  1. **عزل الـ 11 منظومة وبناء النسخ المصفّرة:** [`systems_manager.js`](file:///G:/Qalix%20medical%20agent/server/systems_manager.js) و[`reseller_edition.js`](file:///G:/Qalix%20medical%20agent/server/reseller_edition.js) (مع خيار `includeRuntime` لتضمين `runtime/node.exe`).
  2. **تراخيص Ed25519 الأوفلاين:** [`license.js`](file:///G:/Qalix%20medical%20agent/server/license.js) (فترة تجريبية 14 يوماً، منع تدوير الساعة، والتحقق أوفلاين من `QLX2` بدون أي توليد محلي للمفاتيح).
  3. **أمن وحوكمة مدير الوكلاء والمزامنة (المراحل 1–6):** فحص سلامة الاستعادة (`PRAGMA integrity_check`)، مدقق طلبات المفاتيح ومنبه SLA، حزم المزامنة الموقعة `.qlxsync` ([`sync_engine.js`](file:///G:/Qalix%20medical%20agent/server/sync_engine.js))، قفل `PIN` وصلاحيات [`manager_security.js`](file:///G:/Qalix%20medical%20agent/server/manager_security.js)، تحليلات التحويل Funnel والتقرير التنفيذي A4، وتجهيز مُثبِّت Inno Setup 6 ([`installer_builder.js`](file:///G:/Qalix%20medical%20agent/server/installer_builder.js)).
  4. **واجهة برنامج ويندوز الأصلية واستمرارية التخزين:** [`windows_app_launcher.js`](file:///G:/Qalix%20medical%20agent/server/windows_app_launcher.js) + مؤشر سلامة الملفات الحي في [`public/index.html`](file:///G:/Qalix%20medical%20agent/public/index.html) + اختبارات الاستمرارية عبر إعادة التشغيل (Test 83).

---

## 📁 5. الفهرس الكامل للملفات الحالية بالمشروع

### أ) مشغّلات وملفات الجذر
| المسار | الدور |
| :--- | :--- |
| [`Qalix_Desktop_App.vbs`](file:///G:/Qalix%20medical%20agent/Qalix_Desktop_App.vbs) | التشغيل الصامت المباشر كبرنامج ويندوز (بدون نافذة CMD) |
| [`START_AGENTS_MANAGER_PLATFORM.bat`](file:///G:/Qalix%20medical%20agent/START_AGENTS_MANAGER_PLATFORM.bat) | مشغّل منصة مدير الوكلاء والـ 11 منظومة (يدعم `runtime\node.exe` أو Node 32/64-bit) |
| [`START_QALIX_MEDICAL_AGENT.bat`](file:///G:/Qalix%20medical%20agent/START_QALIX_MEDICAL_AGENT.bat) | المشغّل السريع لوحدة كالكس الطبية |
| [`INSTALL_ON_WINDOWS.bat`](file:///G:/Qalix%20medical%20agent/INSTALL_ON_WINDOWS.bat) | التثبيت المحلي في `%LOCALAPPDATA%\QalixAgentsPlatform` مع اختصارات الأيقونة |
| [`UNINSTALL_FROM_WINDOWS.bat`](file:///G:/Qalix%20medical%20agent/UNINSTALL_FROM_WINDOWS.bat) | إزالة التثبيت والاختصارات بنظافة |
| [`CREATE_BACKUP.bat`](file:///G:/Qalix%20medical%20agent/CREATE_BACKUP.bat) | إنشاء نسخة احتياطية مضغوطة عبر `server/create_backup.js` |
| [`DEPLOY_TO_G_DRIVE.ps1`](file:///G:/Qalix%20medical%20agent/DEPLOY_TO_G_DRIVE.ps1) | سكربت النشر على مسار `G:\Qalix medical agent` |
| [`package.json`](file:///G:/Qalix%20medical%20agent/package.json) | تعريف الحزمة الأوفلاين بدون أي dependencies خارجية |

### ب) محركات الخادم ([`server/`](file:///G:/Qalix%20medical%20agent/server) — 34 وحدة فعلية)
| المجموعة | الملفات |
| :--- | :--- |
| **النواة والأمن والتراخيص** | [`agent_server.js`](file:///G:/Qalix%20medical%20agent/server/agent_server.js)، [`license.js`](file:///G:/Qalix%20medical%20agent/server/license.js)، [`manager_security.js`](file:///G:/Qalix%20medical%20agent/server/manager_security.js)، [`systems_manager.js`](file:///G:/Qalix%20medical%20agent/server/systems_manager.js)، [`sync_engine.js`](file:///G:/Qalix%20medical%20agent/server/sync_engine.js)، [`backup_manager.js`](file:///G:/Qalix%20medical%20agent/server/backup_manager.js)، [`create_backup.js`](file:///G:/Qalix%20medical%20agent/server/create_backup.js)، [`dev_console.js`](file:///G:/Qalix%20medical%20agent/server/dev_console.js)، [`html_escape.js`](file:///G:/Qalix%20medical%20agent/server/html_escape.js) |
| **التحزيم والتشغيل على ويندوز** | [`windows_app_launcher.js`](file:///G:/Qalix%20medical%20agent/server/windows_app_launcher.js)، [`reseller_edition.js`](file:///G:/Qalix%20medical%20agent/server/reseller_edition.js)، [`installer_builder.js`](file:///G:/Qalix%20medical%20agent/server/installer_builder.js) |
| **العمليات التجارية والعقود والموزعين** | [`portal_template.js`](file:///G:/Qalix%20medical%20agent/server/portal_template.js)، [`contract_generator.js`](file:///G:/Qalix%20medical%20agent/server/contract_generator.js)، [`financial_ledger.js`](file:///G:/Qalix%20medical%20agent/server/financial_ledger.js)، [`payment_receipt_engine.js`](file:///G:/Qalix%20medical%20agent/server/payment_receipt_engine.js)، [`quotation_engine.js`](file:///G:/Qalix%20medical%20agent/server/quotation_engine.js)، [`commission_hierarchy.js`](file:///G:/Qalix%20medical%20agent/server/commission_hierarchy.js)، [`territory_protection.js`](file:///G:/Qalix%20medical%20agent/server/territory_protection.js)، [`distributor_recruitment.js`](file:///G:/Qalix%20medical%20agent/server/distributor_recruitment.js) |
| **التمكين الميداني والتدريب والتحليلات** | [`marketing_kit.js`](file:///G:/Qalix%20medical%20agent/server/marketing_kit.js)، [`broadcast_composer.js`](file:///G:/Qalix%20medical%20agent/server/broadcast_composer.js)، [`objection_playbook.js`](file:///G:/Qalix%20medical%20agent/server/objection_playbook.js)، [`after_sales_tracker.js`](file:///G:/Qalix%20medical%20agent/server/after_sales_tracker.js)، [`distributor_training_simulator.js`](file:///G:/Qalix%20medical%20agent/server/distributor_training_simulator.js)، [`clinic_audit_checklist.js`](file:///G:/Qalix%20medical%20agent/server/clinic_audit_checklist.js)، [`technical_field_guide.js`](file:///G:/Qalix%20medical%20agent/server/technical_field_guide.js)، [`specialty_packs.js`](file:///G:/Qalix%20medical%20agent/server/specialty_packs.js)، [`data_migrator.js`](file:///G:/Qalix%20medical%20agent/server/data_migrator.js)، [`network_diagnostics.js`](file:///G:/Qalix%20medical%20agent/server/network_diagnostics.js)، [`visual_analytics.js`](file:///G:/Qalix%20medical%20agent/server/visual_analytics.js)، [`financial_forecast.js`](file:///G:/Qalix%20medical%20agent/server/financial_forecast.js)، [`executive_digest.js`](file:///G:/Qalix%20medical%20agent/server/executive_digest.js)، [`rd_proposals_exporter.js`](file:///G:/Qalix%20medical%20agent/server/rd_proposals_exporter.js) |

### ج) الواجهة والأصول والاختبارات
* [`public/index.html`](file:///G:/Qalix%20medical%20agent/public/index.html) + `public/img/` (شعارات وأيقونة `.ico`) + `public/fonts/` (خطوط محلية أوفلاين).
* [`ملفات_العروض_التقديمية/`](file:///G:/Qalix%20medical%20agent/ملفات_العروض_التقديمية) و[`الوثائق_القانونية_والتسليم/`](file:///G:/Qalix%20medical%20agent/الوثائق_القانونية_والتسليم).
* [`tests/test_agent.js`](file:///G:/Qalix%20medical%20agent/tests/test_agent.js) (**`83/83 PASSED`**).

---

## ⚡ 6. أوامر التحقق السريعة للمطور

```powershell
# 1. تشغيل حزمة الاختبارات الكاملة (83 اختباراً)
node tests/test_agent.js

# 2. إعادة بناء مرحلة التثبيت وملف Qalix_11Systems_Setup_v1.0.exe (يتطلب Inno Setup 6)
node -e "const path=require('path'),{buildWindowsInstallerKit}=require('./server/installer_builder'); console.log(buildWindowsInstallerKit({rootDir:process.cwd(),baseDataDir:path.join(process.cwd(),'data'),edition:'qalix11',includeMediaAssets:true}));"

# 3. التشغيل الفعلي كبرنامج ويندوز محلي
wscript.exe //nologo "G:\Qalix medical agent\Qalix_Desktop_App.vbs"
```

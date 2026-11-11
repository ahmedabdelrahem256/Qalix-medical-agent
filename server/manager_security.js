/* server/manager_security.js — حوكمة مدير الوكلاء: مدقق المفاتيح + مراقب SLA + قفل PIN + تقارير التحويل التنفيذية
 * 100% Offline Air-Gapped · Zero External Dependencies · node:crypto scryptSync + node:sqlite
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { escapeHtml: escHtml } = require('./html_escape');
const { initSystemSchema, getSystemPaths } = require('./systems_manager');

/* ---------------- Key Request Validator ---------------- */
function validateKeyRequestInput({ targetSys, tier, hardwareId, amountPaid }) {
  const pricing = targetSys?.pricing || {};
  const validTiers = ['basic', 'professional', 'enterprise'];
  if (!validTiers.includes(tier)) {
    return {
      ok: false,
      error: `الباقة المحددة (${tier}) غير معترف بها في جدول التسعير الرسمي (basic / professional / enterprise)`
    };
  }
  const hw = String(hardwareId || '').trim().toUpperCase();
  if (hw && hw.length < 8) {
    return {
      ok: false,
      error: 'بصمة الجهاز (Hardware ID) قصيرة جداً أو غير مكتملة — يرجى نسخ البصمة الكاملة من جهاز العميل.'
    };
  }
  const expectedPrice = Number(pricing?.[tier]?.price || (tier === 'basic' ? 4500 : tier === 'enterprise' ? 18500 : 8500));
  const paidNum = Number(amountPaid || 0);
  const hwidValid24Hex = /^[0-9A-F]{24}$/.test(hw);
  const warnings = [];
  if (!hw) {
    warnings.push('تنبيه: لم تُرفق بصمة الجهاز (HWID) بعد؛ سيحتاج صاحب المنصة للبصمة لإصدار مفتاح القفل.');
  } else if (!hwidValid24Hex) {
    warnings.push('تنبيه: بصمة الجهاز لا تطابق الصيغة السداسية القياسية ذات الـ 24 خانة (0-9, A-F).');
  }
  if (paidNum > 0 && paidNum < expectedPrice) {
    warnings.push(`تنبيه مالي: المبلغ المسجل (${paidNum} ج.م) أقل من السعر الرسمي للباقة (${expectedPrice} ج.م).`);
  }
  return {
    ok: true,
    hwidValid24Hex,
    expectedPrice,
    amountMatchesTier: paidNum === 0 || paidNum >= expectedPrice,
    warnings
  };
}

/* ---------------- SLA Watchdog ---------------- */
const OPEN_STAGES = new Set(['rep_visit', 'trial_active', 'trial_extended', 'tech_deploying', 'payment_pending']);

function collectSlaAlerts({ systemsRegistry, baseDataDir, baseKitsDir, activeSystemId, activeDb, slaMaxDays = 5, systemIdFilter = '' }) {
  const alerts = [];
  const thresholdDays = Math.max(0, Number(slaMaxDays ?? 5));
  const nowMs = Date.now();
  const sysList = (systemsRegistry?.systems || []).filter(s => !systemIdFilter || s.id === systemIdFilter);

  for (const sysMeta of sysList) {
    const useActive = sysMeta.id === activeSystemId;
    const paths = getSystemPaths(baseDataDir, baseKitsDir, sysMeta.id);
    if (!useActive && !fs.existsSync(paths.dbPath)) continue;
    const sdb = useActive ? activeDb : new DatabaseSync(paths.dbPath);
    try {
      if (!useActive) initSystemSchema(sdb);
      const rows = sdb.prepare(`
        SELECT uc.case_code, uc.customer_name, uc.stage, uc.rep_name, uc.tech_name, uc.updated_at, uc.created_at,
               d.name AS distributor_name, d.code AS distributor_code
        FROM unified_workflow_cases uc
        JOIN distributors d ON d.id = uc.distributor_id
      `).all();
      for (const r of rows) {
        if (!OPEN_STAGES.has(r.stage)) continue;
        const refTs = Date.parse(r.updated_at || r.created_at || '');
        if (!Number.isFinite(refTs)) continue;
        const ageDays = Math.max(0, (nowMs - refTs) / 86400000);
        if (ageDays >= thresholdDays) {
          alerts.push({
            systemId: sysMeta.id,
            systemNameAr: sysMeta.nameAr,
            caseCode: r.case_code,
            customerName: r.customer_name,
            distributorCode: r.distributor_code,
            distributorName: r.distributor_name,
            repName: r.rep_name || '',
            techName: r.tech_name || '',
            stage: r.stage,
            updatedAt: r.updated_at,
            ageDays: Number(ageDays.toFixed(1)),
            severity: ageDays >= Math.max(thresholdDays * 2, 10) ? 'critical' : 'warning'
          });
        }
      }
    } finally {
      if (!useActive) try { sdb.close(); } catch (_) {}
    }
  }
  alerts.sort((a, b) => b.ageDays - a.ageDays);
  return {
    thresholdDays,
    alertsCount: alerts.length,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    alerts
  };
}

/* ---------------- Manager Local PIN Lock (scrypt + SQLite sessions) ---------------- */
function getSetting(mdb, key) {
  const r = mdb.prepare('SELECT value FROM manager_settings WHERE key = ?').get(key);
  return r ? r.value : '';
}

function setSetting(mdb, key, val) {
  mdb.prepare('INSERT INTO manager_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, String(val ?? ''));
}

function hashPin(pin, saltHex) {
  return crypto.scryptSync(String(pin), Buffer.from(saltHex, 'hex'), 32).toString('hex');
}

function verifyPinMatch(pin, saltHex, hashHex) {
  if (!saltHex || !hashHex) return false;
  const derived = crypto.scryptSync(String(pin), Buffer.from(saltHex, 'hex'), 32);
  const stored = Buffer.from(hashHex, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function extractManagerToken(req) {
  const hdr = String(req?.headers?.['x-qalix-manager-token'] || '').trim();
  if (hdr) return hdr;
  try {
    const u = new URL(req.url, 'http://localhost');
    return String(u.searchParams.get('managerToken') || '').trim();
  } catch (_) {
    return '';
  }
}

function isManagerAuthorized(mdb, req) {
  const pinHash = getSetting(mdb, 'manager_pin_hash');
  if (!pinHash) return true; // لم يتم تفعيل قفل PIN بعد -> وضع التوافق المفتوح
  const token = extractManagerToken(req);
  if (!token) return false;
  const row = mdb.prepare('SELECT token, expires_at FROM manager_sessions WHERE token = ?').get(token);
  if (!row) return false;
  if (Date.parse(row.expires_at) < Date.now()) {
    try { mdb.prepare('DELETE FROM manager_sessions WHERE token = ?').run(token); } catch (_) {}
    return false;
  }
  return true;
}

function getManagerAuthStatus(mdb, req) {
  const pinEnabled = Boolean(getSetting(mdb, 'manager_pin_hash'));
  const authorized = isManagerAuthorized(mdb, req);
  return {
    pinEnabled,
    authorized,
    locked: pinEnabled && !authorized
  };
}

function createManagerSession(mdb) {
  const token = 'qm_' + crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const exp = new Date(now.getTime() + 12 * 3600 * 1000);
  mdb.prepare('INSERT INTO manager_sessions(token, created_at, expires_at) VALUES(?, ?, ?)')
    .run(token, now.toISOString(), exp.toISOString());
  return { token, expiresAt: exp.toISOString() };
}

function configureManagerPin(mdb, { newPin, currentPin }) {
  const existingHash = getSetting(mdb, 'manager_pin_hash');
  const existingSalt = getSetting(mdb, 'manager_pin_salt');
  if (existingHash && !verifyPinMatch(currentPin || '', existingSalt, existingHash)) {
    return { ok: false, status: 401, error: 'رمز PIN الحالي غير صحيح' };
  }
  const cleanPin = String(newPin || '').trim();
  if (!cleanPin) {
    // إلغاء القفل
    mdb.prepare("DELETE FROM manager_settings WHERE key IN ('manager_pin_hash', 'manager_pin_salt')").run();
    mdb.prepare('DELETE FROM manager_sessions').run();
    return { ok: true, pinEnabled: false, session: null };
  }
  if (cleanPin.length < 4 || cleanPin.length > 32) {
    return { ok: false, status: 400, error: 'يجب أن يكون رمز PIN بين 4 و 32 خانة' };
  }
  const saltHex = crypto.randomBytes(16).toString('hex');
  const hashHex = hashPin(cleanPin, saltHex);
  setSetting(mdb, 'manager_pin_salt', saltHex);
  setSetting(mdb, 'manager_pin_hash', hashHex);
  mdb.prepare('DELETE FROM manager_sessions').run();
  const session = createManagerSession(mdb);
  return { ok: true, pinEnabled: true, session };
}

function loginWithManagerPin(mdb, pin) {
  const pinHash = getSetting(mdb, 'manager_pin_hash');
  const pinSalt = getSetting(mdb, 'manager_pin_salt');
  if (!pinHash) {
    return { ok: true, pinEnabled: false, session: createManagerSession(mdb) };
  }
  if (!verifyPinMatch(String(pin || '').trim(), pinSalt, pinHash)) {
    return { ok: false, status: 401, error: 'رمز PIN لمدير الوكلاء غير صحيح' };
  }
  return { ok: true, pinEnabled: true, session: createManagerSession(mdb) };
}

/* ---------------- Time-Filtered Executive Conversion Funnel & A4 Report ---------------- */
function buildManagerExecutiveAnalytics({
  systemsRegistry,
  baseDataDir,
  baseKitsDir,
  activeSystemId,
  activeDb,
  managerHubDb,
  fromDate = '',
  toDate = '',
  systemIdFilter = '',
  slaMaxDays
}) {
  const fromIso = fromDate ? `${String(fromDate).slice(0, 10)}T00:00:00.000Z` : '';
  const toIso = toDate ? `${String(toDate).slice(0, 10)}T23:59:59.999Z` : '';
  const inRange = iso => {
    const v = String(iso || '');
    if (!v) return !(fromIso || toIso);
    if (fromIso && v < fromIso) return false;
    if (toIso && v > toIso) return false;
    return true;
  };

  const rows = [];
  const totals = {
    systemsCount: 0,
    distributorsCount: 0,
    repsCount: 0,
    techsCount: 0,
    unifiedCasesCount: 0,
    repActionsCount: 0,
    techActionsCount: 0,
    trialsCount: 0,
    pendingPaymentsCount: 0,
    completedDealsCount: 0,
    grossSales: 0,
    agentNetRevenue: 0
  };

  const targetSystems = (systemsRegistry?.systems || []).filter(s => !systemIdFilter || s.id === systemIdFilter);
  for (const sysMeta of targetSystems) {
    totals.systemsCount++;
    const useActive = sysMeta.id === activeSystemId;
    const paths = getSystemPaths(baseDataDir, baseKitsDir, sysMeta.id);
    const entry = {
      systemId: sysMeta.id,
      systemNameAr: sysMeta.nameAr,
      agentName: sysMeta.agentInfo?.agentName || sysMeta.agentInfo?.titleAr || '',
      agentPhone: sysMeta.agentInfo?.phone || '',
      isActive: useActive,
      distributorsCount: 0,
      repsCount: 0,
      techsCount: 0,
      unifiedCasesCount: 0,
      repActionsCount: 0,
      techActionsCount: 0,
      trialsCount: 0,
      pendingPaymentsCount: 0,
      completedDealsCount: 0,
      grossSales: 0,
      agentNetRevenue: 0,
      conversionRatePct: 0,
      activityScore: 0,
      recentCases: []
    };

    if (useActive || fs.existsSync(paths.dbPath)) {
      const sdb = useActive ? activeDb : new DatabaseSync(paths.dbPath);
      try {
        if (!useActive) initSystemSchema(sdb);
        entry.distributorsCount = sdb.prepare('SELECT COUNT(*) AS c FROM distributors').get().c;
        entry.repsCount = sdb.prepare("SELECT COUNT(*) AS c FROM distributor_field_team WHERE role = 'rep'").get().c;
        entry.techsCount = sdb.prepare("SELECT COUNT(*) AS c FROM distributor_field_team WHERE role = 'tech'").get().c;

        const casesAll = sdb.prepare(`
          SELECT uc.*, d.name AS distributor_name, d.code AS distributor_code
          FROM unified_workflow_cases uc JOIN distributors d ON d.id = uc.distributor_id
          ORDER BY uc.updated_at DESC
        `).all().filter(c => inRange(c.updated_at || c.created_at));

        entry.unifiedCasesCount = casesAll.length;
        entry.repActionsCount = casesAll.filter(c => c.rep_action).length;
        entry.techActionsCount = casesAll.filter(c => c.tech_action).length;
        entry.recentCases = casesAll.slice(0, 6);

        entry.trialsCount = sdb.prepare('SELECT created_at FROM trial_stage_reports').all().filter(t => inRange(t.created_at)).length;
        entry.pendingPaymentsCount = sdb.prepare("SELECT created_at FROM payment_requests WHERE status = 'pending'").all().filter(p => inRange(p.created_at)).length;

        const completedDeals = sdb.prepare("SELECT fixed_price, agent_net_amount, created_at FROM deals WHERE status = 'completed'").all().filter(d => inRange(d.created_at));
        entry.completedDealsCount = completedDeals.length;
        entry.grossSales = completedDeals.reduce((s, d) => s + Number(d.fixed_price || 0), 0);
        entry.agentNetRevenue = completedDeals.reduce((s, d) => s + Number(d.agent_net_amount || 0), 0);

        const baseFunnel = Math.max(entry.repActionsCount, entry.trialsCount, entry.unifiedCasesCount, entry.completedDealsCount);
        entry.conversionRatePct = baseFunnel > 0 ? Math.min(100, Number(((entry.completedDealsCount / baseFunnel) * 100).toFixed(1))) : 0;
        entry.activityScore = (entry.distributorsCount * 10) + (entry.repActionsCount * 5) + (entry.techActionsCount * 5) + (entry.completedDealsCount * 20);
      } finally {
        if (!useActive) try { sdb.close(); } catch (_) {}
      }
    }

    totals.distributorsCount += entry.distributorsCount;
    totals.repsCount += entry.repsCount;
    totals.techsCount += entry.techsCount;
    totals.unifiedCasesCount += entry.unifiedCasesCount;
    totals.repActionsCount += entry.repActionsCount;
    totals.techActionsCount += entry.techActionsCount;
    totals.trialsCount += entry.trialsCount;
    totals.pendingPaymentsCount += entry.pendingPaymentsCount;
    totals.completedDealsCount += entry.completedDealsCount;
    totals.grossSales += entry.grossSales;
    totals.agentNetRevenue += entry.agentNetRevenue;
    rows.push(entry);
  }

  const slaDaysVal = slaMaxDays !== undefined ? Number(slaMaxDays) : Number(getSetting(managerHubDb, 'sla_max_days') || 5);
  const slaSummary = collectSlaAlerts({
    systemsRegistry,
    baseDataDir,
    baseKitsDir,
    activeSystemId,
    activeDb,
    slaMaxDays: slaDaysVal,
    systemIdFilter
  });

  const baseGrand = Math.max(totals.repActionsCount, totals.trialsCount, totals.unifiedCasesCount, totals.completedDealsCount);
  const funnel = {
    repVisits: totals.repActionsCount,
    trialsRegistered: totals.trialsCount,
    techActions: totals.techActionsCount,
    completedDeals: totals.completedDealsCount,
    repToTrialPct: totals.repActionsCount > 0 ? Number(((totals.trialsCount / totals.repActionsCount) * 100).toFixed(1)) : 0,
    trialToDealPct: totals.trialsCount > 0 ? Number(((totals.completedDealsCount / totals.trialsCount) * 100).toFixed(1)) : 0,
    overallConversionPct: baseGrand > 0 ? Math.min(100, Number(((totals.completedDealsCount / baseGrand) * 100).toFixed(1))) : 0
  };

  rows.sort((a, b) => b.activityScore - a.activityScore);
  const syncedSnapshotsCount = managerHubDb.prepare('SELECT COUNT(*) AS c FROM synced_agent_snapshots').get().c;

  return {
    filters: { fromDate: fromDate || null, toDate: toDate || null, systemId: systemIdFilter || null, slaMaxDays: slaSummary.thresholdDays },
    grandTotals: totals,
    funnel,
    slaSummary,
    syncedSnapshotsCount,
    agentsActivity: rows
  };
}

function generateManagerExecutiveReportHtml(analytics, managerProfile = {}) {
  const gt = analytics.grandTotals || {};
  const fn = analytics.funnel || {};
  const sla = analytics.slaSummary || { alertsCount: 0, criticalCount: 0, alerts: [] };
  const rowsHtml = (analytics.agentsActivity || []).map((a, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${escHtml(a.systemNameAr)}</strong><div style="font-size:11px; color:#64748b;">${escHtml(a.agentName || 'غير معين')} ${a.agentPhone ? `(${escHtml(a.agentPhone)})` : ''}</div></td>
      <td>${a.distributorsCount} / ${a.repsCount}+${a.techsCount}</td>
      <td>${a.unifiedCasesCount}</td>
      <td>${a.trialsCount}</td>
      <td>${a.completedDealsCount}</td>
      <td>${a.conversionRatePct}%</td>
      <td><strong>${Number(a.grossSales || 0).toLocaleString('en-US')} ج.م</strong></td>
      <td>${Number(a.agentNetRevenue || 0).toLocaleString('en-US')} ج.م</td>
    </tr>
  `).join('');

  const slaHtml = (sla.alerts || []).slice(0, 12).map(al => `
    <tr>
      <td>${escHtml(al.caseCode)}</td>
      <td>${escHtml(al.systemNameAr)}</td>
      <td>${escHtml(al.customerName)}</td>
      <td>${escHtml(al.stage)}</td>
      <td style="color:${al.severity === 'critical' ? '#b91c1c' : '#b45309'}; font-weight:700;">${al.ageDays} يوم</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>التقرير التنفيذي لمدير الوكلاء — كالكس لإدارة الوكلاء والموزعين | Qalix Agents &amp; Distributors Management</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; color: #0f172a; margin: 0; background: #fff; }
    .hdr { border-bottom: 3px solid #0284c7; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; background: #f8fafc; }
    .kpi small { color: #64748b; display: block; font-size: 11px; }
    .kpi strong { font-size: 16px; color: #0369a1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; }
    th { background: #0f172a; color: #fff; }
    .print-btn { background: #0284c7; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-family: inherit; font-weight: 700; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1 style="margin:0; font-size:20px;">🏛️ التقرير التنفيذي لمدير الوكلاء (${escHtml(managerProfile.managerName || 'مدير الوكلاء العام')})</h1>
      <div style="font-size:12px; color:#475569; margin-top:4px;">وثيقة إشرافية سرية خاصة بمدير الوكلاء فقط · التاريخ: ${escHtml(new Date().toLocaleString('ar-EG'))}</div>
    </div>
    <button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><small>المنظومات والوكلاء</small><strong>${gt.systemsCount || 0} منظومة</strong></div>
    <div class="kpi"><small>الموزعون / المندوبون+الفنيون</small><strong>${gt.distributorsCount || 0} / ${(gt.repsCount || 0) + (gt.techsCount || 0)}</strong></div>
    <div class="kpi"><small>معدل التحويل العام (Funnel)</small><strong>${fn.overallConversionPct || 0}%</strong></div>
    <div class="kpi"><small>إجمالي المبيعات المعتمدة</small><strong>${Number(gt.grossSales || 0).toLocaleString('en-US')} ج.م</strong></div>
  </div>

  <h3 style="margin:8px 0; font-size:14px;">📊 أداء المنظومات الـ 11 ومعدلات التحويل الميداني</h3>
  <table>
    <thead>
      <tr><th>#</th><th>المنظومة والوكيل</th><th>موزعين / ميدان</th><th>حالات موحدة</th><th>تجارب</th><th>صفقات</th><th>التحويل</th><th>المبيعات</th><th>صافي الوكيل</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <h3 style="margin:8px 0; font-size:14px;">⏱️ تنبيهات التأخير الميداني (SLA Watchdog &ge; ${sla.thresholdDays} أيام — الإجمالي: ${sla.alertsCount})</h3>
  ${sla.alertsCount ? `<table><thead><tr><th>الكود</th><th>المنظومة</th><th>العميل</th><th>المرحلة</th><th>مدة التأخير</th></tr></thead><tbody>${slaHtml}</tbody></table>` : '<div style="padding:10px; border:1px solid #86efac; background:#f0fdf4; border-radius:6px; font-size:12px;">✅ لا توجد حالات متأخرة تتجاوز مهلة المتابعة المحددة.</div>'}
</body>
</html>`;
}

module.exports = {
  validateKeyRequestInput,
  collectSlaAlerts,
  getManagerAuthStatus,
  isManagerAuthorized,
  configureManagerPin,
  loginWithManagerPin,
  buildManagerExecutiveAnalytics,
  generateManagerExecutiveReportHtml
};

/* server/sync_engine.js — محرك حزم المزامنة الموقعة أوفلاين (.qlxsync)
 * ينقل تحديثات فريق الميدان (المندوب ← الفني ← الموزع) والوكلاء إلى مدير الوكلاء بدون إنترنت وببصمة SHA-256
 */
'use strict';

const crypto = require('node:crypto');

const SYNC_FORMAT_VERSION = 'QLXSYNC-1.0';

function canonicalSha256(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function buildAgentSyncPacket(db, activeSystem, managerHubDb, { upsertUnifiedCase }) {
  const distributors = db.prepare('SELECT id, code, name, governorate, phone, commission_rate, status, notes, created_at FROM distributors').all();
  const fieldTeam = db.prepare('SELECT * FROM distributor_field_team').all();
  const unifiedCases = db.prepare('SELECT * FROM unified_workflow_cases').all();
  const trialReports = db.prepare('SELECT * FROM trial_stage_reports').all();
  const paymentRequests = db.prepare('SELECT id, req_code, distributor_id, customer_name, contact_name, customer_phone, city, tier, fixed_price, commission_rate, distributor_commission, agent_net_amount, payment_channel, payment_ref, status, activation_key, deal_id, created_at, reviewed_at FROM payment_requests').all();
  const deals = db.prepare('SELECT * FROM deals').all();
  const keyRequests = managerHubDb
    ? managerHubDb.prepare('SELECT * FROM agent_key_requests WHERE system_id = ?').all(activeSystem.id)
    : [];

  const body = {
    format: SYNC_FORMAT_VERSION,
    packetType: 'agent_snapshot',
    systemId: activeSystem.id,
    systemNameAr: activeSystem.nameAr,
    agentName: activeSystem.agentInfo?.agentName || activeSystem.agentInfo?.titleAr || '',
    agentPhone: activeSystem.agentInfo?.phone || '',
    exportedAt: new Date().toISOString(),
    stats: {
      distributorsCount: distributors.length,
      fieldTeamCount: fieldTeam.length,
      unifiedCasesCount: unifiedCases.length,
      trialReportsCount: trialReports.length,
      dealsCount: deals.length,
      grossSales: deals.filter(d => d.status === 'completed').reduce((s, d) => s + Number(d.fixed_price || 0), 0)
    },
    payload: {
      distributors,
      fieldTeam,
      unifiedCases,
      trialReports,
      paymentRequests,
      deals,
      keyRequests
    }
  };
  const integritySha256 = canonicalSha256(body);
  return { ...body, integritySha256 };
}

function verifySyncPacket(packet) {
  if (!packet || typeof packet !== 'object') {
    return { ok: false, error: 'محتوى حزمة المزامنة (.qlxsync) غير صالح' };
  }
  if (packet.format !== SYNC_FORMAT_VERSION) {
    return { ok: false, error: `إصدار حزمة المزامنة غير مدعوم (${packet.format || 'غير معروف'})` };
  }
  const providedHash = String(packet.integritySha256 || '').trim().toLowerCase();
  if (!providedHash) {
    return { ok: false, error: 'الحزمة تفتقد بصمة التحقق الرقمية integritySha256' };
  }
  const clone = { ...packet };
  delete clone.integritySha256;
  const computed = canonicalSha256(clone);
  if (computed !== providedHash) {
    return { ok: false, error: 'فشل التحقق من سلامة حزمة المزامنة: تم تعديل المحتوى أو تلف الملف.' };
  }
  return { ok: true, integritySha256: computed };
}

function importSyncPacket({ db, activeSystem, managerHubDb, packet, upsertUnifiedCase }) {
  const chk = verifySyncPacket(packet);
  if (!chk.ok) return { ok: false, status: 400, error: chk.error };

  const pType = String(packet.packetType || 'agent_snapshot');
  if (pType === 'distributor_field_packet') {
    const p = packet.payload || {};
    const distCode = String(p.distributorCode || '').trim().toUpperCase();
    const distRow = distCode
      ? db.prepare('SELECT * FROM distributors WHERE UPPER(code) = ?').get(distCode)
      : db.prepare('SELECT * FROM distributors LIMIT 1').get();
    if (!distRow) {
      return { ok: false, status: 404, error: `الموزع (${distCode || 'غير محدد'}) غير مسجل في هذه المنظومة` };
    }

    let importedMembers = 0;
    for (const m of (p.fieldTeam || [])) {
      if (!m?.name) continue;
      const role = m.role === 'tech' ? 'tech' : 'rep';
      const id = String(m.id || ('ft_' + crypto.createHash('md5').update(`${distRow.id}:${role}:${m.name}`).digest('hex').slice(0, 12)));
      db.prepare(`
        INSERT INTO distributor_field_team(id, distributor_id, name, role, phone, zone, fee, status, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, 'active', ?)
        ON CONFLICT(id) DO UPDATE SET phone=excluded.phone, zone=excluded.zone, fee=excluded.fee
      `).run(id, distRow.id, String(m.name).slice(0, 120), role, String(m.phone || '').slice(0, 20), String(m.zone || m.area || '').slice(0, 120), Number(m.fee || 0), m.created_at || new Date().toISOString());
      importedMembers++;
    }

    let importedCases = 0;
    for (const c of (p.unifiedCases || [])) {
      if (!c?.customer_name && !c?.customerName) continue;
      upsertUnifiedCase(db, {
        caseCode: c.case_code || c.caseCode,
        distributorId: distRow.id,
        customerName: c.customer_name || c.customerName,
        customerPhone: c.customer_phone || c.customerPhone || '',
        repName: c.rep_name || c.repName || '',
        repAction: c.rep_action || c.repAction || '',
        techName: c.tech_name || c.techName || '',
        techAction: c.tech_action || c.techAction || '',
        stage: c.stage || 'rep_visit',
        outcome: c.outcome || '',
        timelineEvent: {
          actorRole: 'distributor',
          actorName: distRow.name,
          stage: c.stage || 'rep_visit',
          actionText: `استيراد مزامنة أوفلاين (.qlxsync) من بوابة ${distRow.code}`
        }
      });
      importedCases++;
    }

    return {
      ok: true,
      packetType: pType,
      integritySha256: chk.integritySha256,
      imported: { distributorCode: distRow.code, fieldMembers: importedMembers, unifiedCases: importedCases }
    };
  }

  // agent_snapshot -> يُحفظ في قاعدة مدير الوكلاء لمتابعة المنظومات المنفصلة أوفلاين
  const id = 'sync_' + crypto.randomBytes(6).toString('hex');
  const sysId = String(packet.systemId || activeSystem.id);
  const stats = packet.stats || {};
  managerHubDb.prepare(`
    INSERT INTO synced_agent_snapshots(id, system_id, packet_type, packet_sha256, source_label, cases_count, deals_count, gross_sales, payload_json, imported_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, sysId, pType, chk.integritySha256,
    String(packet.agentName || packet.systemNameAr || sysId),
    Number(stats.unifiedCasesCount || 0),
    Number(stats.dealsCount || 0),
    Number(stats.grossSales || 0),
    JSON.stringify(packet),
    new Date().toISOString()
  );

  return {
    ok: true,
    packetType: pType,
    snapshotId: id,
    systemId: sysId,
    integritySha256: chk.integritySha256,
    stats
  };
}

module.exports = {
  SYNC_FORMAT_VERSION,
  buildAgentSyncPacket,
  verifySyncPacket,
  importSyncPacket
};

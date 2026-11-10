/* Territory & Lead Protection Engine (Phase 9)
 * Prevents distributor collisions, locks clinic leads for 14 days, and assigns Egyptian regional territories.
 * 100% Offline Air-Gapped · Zero External Dependencies · Agent: 01122166076 / 01122166704
 */
'use strict';

const crypto = require('crypto');

const PROTECTED_TERRITORIES = [
  { id: 'assiut_city', gov: 'أسيوط', district: 'مدينة أسيوط وأحيائها (شرق وغرب وشارع النميس والجمهورية)', leadCountMax: 50, notes: 'قطاع كثافة الأبراج الطبية والمستشفيات التخصصية' },
  { id: 'assiut_dayrut', gov: 'أسيوط', district: 'مركز ديروط وقراها', leadCountMax: 30, notes: 'عيادات ومراكز ديروط الطبية التخصصية' },
  { id: 'assiut_qusiya', gov: 'أسيوط', district: 'مركز القوصية', leadCountMax: 25, notes: 'المراكز الجراحية والعيادات الخاصة' },
  { id: 'assiut_manfalut', gov: 'أسيوط', district: 'مركز منفلوط', leadCountMax: 25, notes: 'عيادات الباطنة والأطفال والأسنان' },
  { id: 'assiut_abnub', gov: 'أسيوط', district: 'مركز أبنوب والفتح', leadCountMax: 20, notes: 'مجمعات العيادات التخصصية' },
  { id: 'assiut_sedfa_badari', gov: 'أسيوط', district: 'صدفا والغنايم والبداري وساحل سليم', leadCountMax: 25, notes: 'جنوب محافظة أسيوط' },
  { id: 'cairo_east', gov: 'القاهرة', district: 'مدينة نصر والتجمع الخامس ومصر الجديدة', leadCountMax: 60, notes: 'المستشفيات التخصصية والمراكز الكبرى' },
  { id: 'cairo_west', gov: 'الجيزة والقاهرة', district: 'المعادي والدقي والمهندسين والشيخ زايد', leadCountMax: 50, notes: 'المجمعات الطبية النشطة' },
  { id: 'delta_mansoura', gov: 'الدقهلية والغربية', district: 'المنصورة وطنطا والمحلة الكبرى', leadCountMax: 45, notes: 'مراكز جراحة الكلى والعيادات التخصصية' },
  { id: 'alex_beheira', gov: 'الإسكندرية والبحيرة', district: 'الإسكندرية (سموحة ومحرم بك ودمنهور)', leadCountMax: 40, notes: 'عيادات البحر المتوسط والبحيرة' }
];

function initializeTerritoryTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_locks (
      id TEXT PRIMARY KEY,
      distributor_id TEXT NOT NULL,
      distributor_name TEXT NOT NULL,
      clinic_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      clinic_phone TEXT NOT NULL,
      governorate TEXT NOT NULL,
      district TEXT NOT NULL,
      tier_interest TEXT NOT NULL DEFAULT 'professional',
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT DEFAULT '',
      locked_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      converted_deal_id TEXT DEFAULT '',
      hash_signature TEXT NOT NULL
    );
  `);
}

function lockClinicLead(db, data) {
  const {
    distributorId,
    distributorName,
    clinicName,
    doctorName,
    clinicPhone,
    governorate,
    district,
    tierInterest,
    notes
  } = data;

  if (!distributorId || !clinicName || !doctorName || !clinicPhone) {
    throw new Error('يرجى استيفاء كافة بيانات العيادة (اسم العيادة، الطبيب، الهاتف، والموزع)');
  }

  const cleanPhone = clinicPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    throw new Error('رقم هاتف العيادة غير صحيح');
  }

  // Check if clinic phone is already locked and active
  const now = new Date();
  const existing = db.prepare(`
    SELECT * FROM lead_locks 
    WHERE clinic_phone = ? AND status = 'active'
  `).get(cleanPhone);

  if (existing) {
    const exp = new Date(existing.expires_at);
    if (exp > now) {
      if (existing.distributor_id === distributorId) {
        throw new Error(`العيادة محجوزة لك بالفعل حتى تاريخ ${exp.toLocaleDateString('ar-EG')}`);
      }
      throw new Error(`عذراً، هذه العيادة محجوزة حصرياً للموزع "${existing.distributor_name}" بموجب نظام الحماية الجغرافية حتى ${exp.toLocaleDateString('ar-EG')}`);
    } else {
      // Mark as expired
      db.prepare(`UPDATE lead_locks SET status = 'expired' WHERE id = ?`).run(existing.id);
    }
  }

  const lockId = 'LOCK-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  const lockedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 Days protection lock

  const hashSignature = crypto.createHash('sha256')
    .update(`${lockId}|${distributorId}|${cleanPhone}|${lockedAt}|${expiresAt}`)
    .digest('hex');

  db.prepare(`
    INSERT INTO lead_locks (
      id, distributor_id, distributor_name, clinic_name, doctor_name, clinic_phone,
      governorate, district, tier_interest, status, notes, locked_at, expires_at, hash_signature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
  `).run(
    lockId, distributorId, distributorName || 'موزع مستقل', clinicName, doctorName, cleanPhone,
    governorate || 'أسيوط', district || 'مدينة أسيوط', tierInterest || 'professional',
    notes || '', lockedAt, expiresAt, hashSignature
  );

  return {
    ok: true,
    lockId,
    clinicName,
    doctorName,
    cleanPhone,
    lockedAt,
    expiresAt,
    daysProtected: 14,
    hashSignature: hashSignature.substring(0, 16) + '...'
  };
}

function getLeadLocks(db) {
  const now = new Date();
  const rows = db.prepare('SELECT * FROM lead_locks ORDER BY locked_at DESC').all();
  return rows.map(r => {
    const isExpired = new Date(r.expires_at) < now && r.status === 'active';
    const status = isExpired ? 'expired' : r.status;
    const daysRemaining = Math.max(0, Math.ceil((new Date(r.expires_at) - now) / (1000 * 60 * 60 * 24)));
    return {
      ...r,
      status,
      daysRemaining
    };
  });
}

module.exports = {
  PROTECTED_TERRITORIES,
  initializeTerritoryTables,
  lockClinicLead,
  getLeadLocks
};

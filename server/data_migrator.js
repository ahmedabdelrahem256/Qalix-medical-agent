/* Legacy Excel & CSV to Qalix Data Migration Engine (Phase 3)
 * 100% Offline Air-Gapped · Zero External Dependencies · Official Agent: 01122166076
 */
'use strict';

const crypto = require('node:crypto');

function parseDelimitedText(rawText, delimiter) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  // Auto-detect delimiter if not provided
  if (!delimiter) {
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    if (tabCount >= commaCount && tabCount >= semiCount && tabCount > 0) delimiter = '\t';
    else if (semiCount >= commaCount && semiCount > 0) delimiter = ';';
    else delimiter = ',';
  }

  // Parse header
  const headers = splitLine(lines[0], delimiter).map(h => normalizeHeader(h));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delimiter);
    if (!values.some(v => v.trim())) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] !== undefined ? values[j].trim() : '');
    }
    records.push(row);
  }
  return { headers, records };
}

function splitLine(line, delimiter) {
  // Simple CSV parser supporting double quotes
  const res = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      res.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur.trim());
  return res;
}

function normalizeHeader(h) {
  const clean = h.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  // Patient mappings
  if (/^(patientname|fullname|name|اسم|الاسم|اسم_المريض|اسمالمريض)$/.test(clean)) return 'name';
  if (/^(phone|mobile|tel|هاتف|موبايل|تليفون|رقم_الهاتف|رقم_الموبايل)$/.test(clean)) return 'phone';
  if (/^(age|عمر|العمر|السن)$/.test(clean)) return 'age';
  if (/^(gender|sex|نوع|النوع|الجنس)$/.test(clean)) return 'gender';
  if (/^(address|city|عنوان|العنوان|المدينة)$/.test(clean)) return 'address';
  if (/^(notes|history|allergies|ملاحظات|التاريخ_المرضي|تاريخمرضي|حساسية)$/.test(clean)) return 'notes';
  if (/^(code|id|file_no|fileno|كود|رقم_الملف|رقم_المريض)$/.test(clean)) return 'fileNo';

  // Drug mappings
  if (/^(tradename|drugname|drug|medicine|اسم_الدواء|الدواء|الاسم_التجاري)$/.test(clean)) return 'tradeName';
  if (/^(genericname|generic|المادة_الفعالة|المادةالفعالة|علمي)$/.test(clean)) return 'genericName';
  if (/^(form|dosageform|الشكل_الدوائي|الشكلكبسولات)$/.test(clean)) return 'form';
  if (/^(concentration|strength|التركيز|تركيز)$/.test(clean)) return 'concentration';
  if (/^(price|cost|سعر|السعر|سعر_البيع)$/.test(clean)) return 'price';
  if (/^(category|class|تصنيف|القسم|التصنيف)$/.test(clean)) return 'category';

  // Service mappings
  if (/^(servicename|service|الخدمة|اسم_الخدمة|الإجراء)$/.test(clean)) return 'serviceName';
  if (/^(department|dept|القسم|العيادة)$/.test(clean)) return 'department';

  return clean;
}

function migratePatients(records) {
  const migrated = [];
  const errors = [];
  let index = 1;

  for (const r of records) {
    const name = r.name || r.patientname || r.fullname;
    if (!name) {
      errors.push(`تخطي سطر بدون اسم مريض: ${JSON.stringify(r)}`);
      continue;
    }
    const phone = (r.phone || '').replace(/[^\d+]/g, '');
    let gender = 'غير محدد';
    const rawGen = String(r.gender || '').toLowerCase();
    if (rawGen.includes('انثى') || rawGen.includes('أنثى') || rawGen.includes('f') || rawGen.includes('female')) gender = 'أنثى';
    else if (rawGen.includes('ذكر') || rawGen.includes('m') || rawGen.includes('male')) gender = 'ذكر';

    const clean = {
      id: 'PAT-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      fileNo: r.fileNo || `FL-${String(index).padStart(4, '0')}`,
      name: name.trim(),
      phone: phone || 'لا يوجد هاتف',
      age: parseInt(r.age) || null,
      gender,
      address: r.address || 'غير محدد',
      medicalHistory: r.notes || '',
      importedAt: new Date().toISOString()
    };
    migrated.push(clean);
    index++;
  }
  return { migrated, errors, total: migrated.length };
}

function migrateDrugs(records) {
  const migrated = [];
  const errors = [];
  let index = 1;

  for (const r of records) {
    const tradeName = r.tradeName || r.name;
    if (!tradeName) {
      errors.push(`تخطي سطر بدون اسم تجاري للدواء: ${JSON.stringify(r)}`);
      continue;
    }
    const clean = {
      id: 'DRG-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      code: `DRG-${String(index).padStart(4, '0')}`,
      tradeName: tradeName.trim(),
      genericName: (r.genericName || tradeName).trim(),
      form: r.form || 'أقراص',
      concentration: r.concentration || 'عادي',
      price: parseFloat(r.price) || 0,
      category: r.category || 'أدوية عامة',
      importedAt: new Date().toISOString()
    };
    migrated.push(clean);
    index++;
  }
  return { migrated, errors, total: migrated.length };
}

function migrateServices(records) {
  const migrated = [];
  const errors = [];
  let index = 1;

  for (const r of records) {
    const name = r.serviceName || r.name;
    if (!name) {
      errors.push(`تخطي سطر بدون اسم خدمة: ${JSON.stringify(r)}`);
      continue;
    }
    const clean = {
      id: 'SRV-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      code: `SRV-${String(index).padStart(4, '0')}`,
      name: name.trim(),
      department: r.department || 'عام',
      price: parseFloat(r.price) || 0,
      notes: r.notes || '',
      importedAt: new Date().toISOString()
    };
    migrated.push(clean);
    index++;
  }
  return { migrated, errors, total: migrated.length };
}

function processMigration(type, rawText, delimiter) {
  const { headers, records } = parseDelimitedText(rawText, delimiter);
  if (!records.length) {
    return { ok: false, error: 'لم يتم العثور على أي صفوف صالحة للتحويل' };
  }

  let result;
  if (type === 'drugs') result = migrateDrugs(records);
  else if (type === 'services') result = migrateServices(records);
  else result = migratePatients(records);

  return {
    ok: true,
    type,
    detectedHeaders: headers,
    totalRecordsFound: records.length,
    successfulCount: result.migrated.length,
    errorsCount: result.errors.length,
    errors: result.errors.slice(0, 10),
    data: result.migrated
  };
}

module.exports = {
  parseDelimitedText,
  processMigration
};

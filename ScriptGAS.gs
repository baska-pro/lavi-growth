
/**
 * ============================================================
 * LAVI GROWTH TRACKER - BACKEND V9.0 (Hashed PIN + Rate Limit)
 * ============================================================
 */

const CONFIG = {
  SHEET_NAMES: {
    PROFILES: "DB_Profiles",
    RECORDS: "DB_Records",
    VACCINES: "DB_Vaccines",
    MILESTONES: "DB_Milestones",
    TARGETS: "DB_Targets",
    REMINDERS: "DB_Reminders",
    MENSTRUAL: "DB_Menstrual"
  },
  DRIVE_FOLDER_NAME: "Lavi_Growth_Images",
  PIN_MIN_LENGTH: 6,
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_MINUTES: 5,
  HEADERS: {
    PROFILES: ["id", "name", "type", "dob", "gender", "avatar", "is_pregnant", "last_updated", "created_at"],
    RECORDS: ["id", "profile_id", "date_time", "weight", "height", "temp", "head_circ", "notes", "symptoms", "photos", "details_json", "last_updated", "created_at"],
    VACCINES: ["id", "profile_id", "vaccine_name", "date_given", "notes", "last_updated"],
    MILESTONES: ["id", "profile_id", "milestone_id", "date_achieved", "notes", "last_updated"],
    TARGETS: ["id", "profile_id", "field", "target_value", "last_updated"],
    REMINDERS: ["id", "profile_id", "title", "time", "days_json", "active", "type", "specific_date", "last_updated"],
    MENSTRUAL: ["id", "profile_id", "start_date", "end_date", "flow", "symptoms_json", "notes", "last_updated"]
  }
};

function pinSalt(props) {
  let salt = props.getProperty('PIN_SALT');
  if (!salt) { salt = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('PIN_SALT', salt); }
  return salt;
}
function hashPin(pin, props) {
  const input = pinSalt(props) + ':' + String(pin);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { const v = b < 0 ? b + 256 : b; return ('0' + v.toString(16)).slice(-2); }).join('');
}
function setPinHash(pin, props) { props.setProperty('APP_PIN_HASH', hashPin(pin, props)); props.deleteProperty('APP_PIN'); clearPinFailures(props); }
function verifyPin(pin, props) { const stored = props.getProperty('APP_PIN_HASH'); return !!stored && stored === hashPin(pin, props); }
function migrateLegacyPin(props) { const legacy = props.getProperty('APP_PIN'); if (legacy && !props.getProperty('APP_PIN_HASH')) setPinHash(String(legacy), props); }
function isPinLocked(props) { return Number(props.getProperty('PIN_LOCKED_UNTIL') || 0) > Date.now(); }
function clearPinFailures(props) { props.setProperty('PIN_FAILED_ATTEMPTS', '0'); props.deleteProperty('PIN_LOCKED_UNTIL'); }
function recordPinFailure(props) {
  let attempts = Number(props.getProperty('PIN_FAILED_ATTEMPTS') || 0) + 1;
  if (attempts >= CONFIG.MAX_FAILED_ATTEMPTS) { props.setProperty('PIN_FAILED_ATTEMPTS', '0'); props.setProperty('PIN_LOCKED_UNTIL', String(Date.now() + CONFIG.LOCK_MINUTES * 60 * 1000)); }
  else props.setProperty('PIN_FAILED_ATTEMPTS', String(attempts));
}
function validNewPin(pin) { return new RegExp('^[0-9]{' + CONFIG.PIN_MIN_LENGTH + ',12}$').test(String(pin || '')); }

function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  migrateLegacyPin(props);
  if (!props.getProperty('APP_PIN_HASH')) {
    const initialPin = String(Math.floor(100000 + Math.random() * 900000));
    setPinHash(initialPin, props);
    Logger.log('PIN awal Lavi Growth: ' + initialPin + ' (simpan lalu ganti dari aplikasi)');
  }

  const schema = CONFIG.HEADERS;
  Object.keys(schema).forEach(key => {
    const sheetName = CONFIG.SHEET_NAMES[key];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      try { const s1 = ss.getSheetByName('Sheet1'); if(s1) ss.deleteSheet(s1); } catch(e){}
    }
    const headerRange = sheet.getRange(1, 1, 1, schema[key].length);
    if (headerRange.getValues()[0][0] === "") {
      headerRange.setValues([schema[key]]);
      headerRange.setFontWeight("bold").setBackground("#dcfce7").setBorder(true, true, true, true, true, true);
      sheet.setFrozenRows(1);
    } else if (key === 'REMINDERS' && sheet.getLastColumn() < schema[key].length) {
       // Auto-update header if missing specific_date (length diff)
       headerRange.setValues([schema[key]]);
    }
  });
  getOrCreateDriveFolder();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return responseJSON({ status: 'error', message: 'Server busy' });
  try {
    const props = PropertiesService.getScriptProperties();
    migrateLegacyPin(props);
    if (!props.getProperty('APP_PIN_HASH')) initialSetup();
    const postData = JSON.parse(e.postData.contents || '{}');
    const action = postData.action;
    const clientPin = String(postData.pin || '');
    if (action === 'health_check') return responseJSON({ status: 'success', version: '9.0' });
    if (isPinLocked(props)) return responseJSON({ status: 'error', message: 'Terlalu banyak percobaan PIN. Coba lagi beberapa menit.' });
    const pinValid = verifyPin(clientPin, props);
    if (action === 'check_pin') {
      if (pinValid) clearPinFailures(props); else recordPinFailure(props);
      return responseJSON({ status: 'success', valid: pinValid });
    }
    if (!pinValid) { recordPinFailure(props); return responseJSON({ status: 'error', message: 'Invalid PIN' }); }
    clearPinFailures(props);
    let result;
    switch (action) {
      case 'sync_pull': result = handlePull(); break;
      case 'sync_push': result = handlePush(postData.payload || {}); break;
      case 'delete_data': result = handleDelete(postData.type, postData.id); break;
      case 'upload_image': result = uploadImageToDrive(postData.fileData, postData.fileName); break;
      case 'update_pin':
        if (!validNewPin(postData.newPin)) result = { status: 'error', message: 'PIN baru harus 6-12 angka' };
        else { setPinHash(String(postData.newPin), props); result = { status: 'success' }; }
        break;
      case 'reset_data': result = resetAllData(); break;
      default: result = { status: 'error', message: 'Unknown Action' };
    }
    return responseJSON(result);
  } catch (err) { return responseJSON({ status: 'error', message: err.toString() }); }
  finally { lock.releaseLock(); }
}

function handlePull() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    status: 'success',
    data: {
      profiles: readSheet(ss, CONFIG.SHEET_NAMES.PROFILES, reverseProfile),
      records: readSheet(ss, CONFIG.SHEET_NAMES.RECORDS, reverseRecord),
      vaccines: readSheet(ss, CONFIG.SHEET_NAMES.VACCINES, reverseVaccine),
      milestones: readSheet(ss, CONFIG.SHEET_NAMES.MILESTONES, reverseMilestone),
      targets: readSheet(ss, CONFIG.SHEET_NAMES.TARGETS, reverseTarget),
      reminders: readSheet(ss, CONFIG.SHEET_NAMES.REMINDERS, reverseReminder),
      menstrualCycles: readSheet(ss, CONFIG.SHEET_NAMES.MENSTRUAL, reverseMenstrual)
    }
  };
}

function handlePush(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timestamp = new Date().toISOString();
  
  if (data.profiles) updateSheet(ss, CONFIG.SHEET_NAMES.PROFILES, data.profiles, transformProfile, timestamp);
  if (data.records) updateSheet(ss, CONFIG.SHEET_NAMES.RECORDS, data.records, transformRecord, timestamp);
  if (data.vaccines) updateSheet(ss, CONFIG.SHEET_NAMES.VACCINES, data.vaccines, transformVaccine, timestamp);
  if (data.milestones) updateSheet(ss, CONFIG.SHEET_NAMES.MILESTONES, data.milestones, transformMilestone, timestamp);
  
  if (data.targets) updateSheet(ss, CONFIG.SHEET_NAMES.TARGETS, data.targets, transformTarget, timestamp);
  if (data.reminders) updateSheet(ss, CONFIG.SHEET_NAMES.REMINDERS, data.reminders, transformReminder, timestamp);
  if (data.menstrualCycles) updateSheet(ss, CONFIG.SHEET_NAMES.MENSTRUAL, data.menstrualCycles, transformMenstrual, timestamp);

  return { status: 'success', syncedAt: timestamp };
}

function updateSheet(ss, sheetName, dataArray, transformFn, serverTimestamp) {
  if (!dataArray || dataArray.length === 0) return;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { initialSetup(); sheet = ss.getSheetByName(sheetName); }

  const lastRow = sheet.getLastRow();
  let existingIds = [];
  if (lastRow > 1) existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => String(r[0]));

  dataArray.forEach(item => {
    item._serverTimestamp = serverTimestamp;
    const rowData = transformFn(item);
    const idx = existingIds.indexOf(String(item.id));
    if (idx > -1) sheet.getRange(idx + 2, 1, 1, rowData.length).setValues([rowData]);
    else {
      sheet.appendRow(rowData);
      existingIds.push(String(item.id));
    }
  });
}

function handleDelete(type, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetName;
  
  switch(type) {
    case 'profile': sheetName = CONFIG.SHEET_NAMES.PROFILES; break;
    case 'record': sheetName = CONFIG.SHEET_NAMES.RECORDS; break;
    case 'vaccine': sheetName = CONFIG.SHEET_NAMES.VACCINES; break;
    case 'milestone': sheetName = CONFIG.SHEET_NAMES.MILESTONES; break;
    case 'target': sheetName = CONFIG.SHEET_NAMES.TARGETS; break;
    case 'reminder': sheetName = CONFIG.SHEET_NAMES.REMINDERS; break;
    case 'cycle': sheetName = CONFIG.SHEET_NAMES.MENSTRUAL; break;
    default: return { status: 'error', message: 'Unknown type' };
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet not found' };

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'success' };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i]) === String(id)) {
      sheet.deleteRow(i + 2);
      if (type === 'profile') {
        [
          CONFIG.SHEET_NAMES.RECORDS, 
          CONFIG.SHEET_NAMES.VACCINES, 
          CONFIG.SHEET_NAMES.MILESTONES,
          CONFIG.SHEET_NAMES.TARGETS,
          CONFIG.SHEET_NAMES.REMINDERS,
          CONFIG.SHEET_NAMES.MENSTRUAL
        ].forEach(sn => deleteRelatedRows(ss, sn, 1, id));
      }
      return { status: 'success' };
    }
  }
  return { status: 'success' };
}

function deleteRelatedRows(ss, sheetName, colIndex, value) {
  const sheet = ss.getSheetByName(sheetName);
  if(!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][colIndex]) === String(value)) sheet.deleteRow(i + 2);
  }
}

function readSheet(ss, sheetName, reverseFn) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  return data.filter(row => row[0]).map(row => reverseFn(row));
}

// --- TRANSFORMERS ---
function fmtDate(d) { 
  if(!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() <= 1970) return "";
  // STRICT WIB TIMEZONE
  try { return Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd HH:mm:ss"); } catch(e) { return ""; } 
}

function transformProfile(p) { 
  return [p.id, p.name, p.type, fmtDate(p.dob), p.gender, p.avatar, p.isPregnant ? "TRUE" : "FALSE", p._serverTimestamp, p.createdAt||p._serverTimestamp]; 
}

function reverseProfile(row) { 
  let dob = row[3]; try { dob = new Date(row[3]).toISOString().split('T')[0]; } catch(e){}
  const isPregnant = String(row[6]).toUpperCase() === "TRUE";
  return { id: row[0], name: row[1], type: row[2], dob: dob, gender: row[4], avatar: row[5], isPregnant: isPregnant }; 
}

function transformRecord(r) {
  let dateVal = r.date; 
  if (!dateVal || dateVal === "undefined" || dateVal === "null") dateVal = new Date().toISOString().split('T')[0];
  if(r.time && dateVal) dateVal = `${dateVal}T${r.time}`;
  else if (dateVal) dateVal = `${dateVal}T00:00:00`;
  const v = (val) => (val !== undefined && val !== null) ? val : "";
  const details = {
    ts_override: r.timestamp,
    systolicBP: r.systolicBP, diastolicBP: r.diastolicBP, bloodSugar: r.bloodSugar,
    gestationalAge: r.gestationalAge, bellyCircumference: r.bellyCircumference, fetalMovement: r.fetalMovement,
    usg_efw: r.usg_efw, usg_bpd: r.usg_bpd, usg_ac: r.usg_ac, usg_fl: r.usg_fl,
    sleepHours: r.sleepHours, chestCircumference: r.chestCircumference, chestWidth: r.chestWidth
  };
  return [
    r.id, r.profileId, fmtDate(dateVal), v(r.weight), v(r.height), v(r.temperature), 
    v(r.headCircumference), v(r.notes), (r.symptoms||[]).join(", "), (r.photos||[]).join("\n"), 
    JSON.stringify(details), r._serverTimestamp, r.createdAt||r._serverTimestamp
  ];
}

function reverseRecord(row) {
  let dateObj = (row[2] instanceof Date) ? row[2] : new Date(row[2]);
  let timestamp = dateObj.getTime();
  let dateStr = "";
  try { dateStr = Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd"); } catch(e) { dateStr = String(row[2]).split(" ")[0]; }
  let timeStr = "";
  try {
     const h = dateObj.getHours(); const m = dateObj.getMinutes();
     // Manual padding
     timeStr = (h<10?'0':'') + h + ':' + (m<10?'0':'') + m;
  } catch(e) {}
  const num = (v) => (v === "" || v === null) ? null : Number(v);
  let details = {}; try { details = JSON.parse(row[10]); } catch(e){}
  if (details.ts_override && !isNaN(details.ts_override)) timestamp = Number(details.ts_override);
  Object.keys(details).forEach(k => { if(details[k] === "") details[k] = null; });
  return { 
    id: row[0], profileId: row[1], 
    date: dateStr, time: timeStr, timestamp: timestamp, 
    weight: num(row[3]), height: num(row[4]), temperature: num(row[5]), headCircumference: num(row[6]), 
    notes: row[7], symptoms: row[8]?row[8].split(", "):[], photos: row[9]?row[9].split("\n"):[], 
    ...details 
  };
}

function transformVaccine(v) { return [v.id, v.profileId, v.vaccineName, fmtDate(v.dateGiven), v.notes, v._serverTimestamp]; }
function reverseVaccine(row) { return { id: row[0], profileId: row[1], vaccineName: row[2], dateGiven: new Date(row[3]).toISOString().split('T')[0], notes: row[4] }; }

function transformMilestone(m) { return [m.id, m.profileId, m.milestoneId, fmtDate(m.dateAchieved), m.notes, m._serverTimestamp]; }
function reverseMilestone(row) { return { id: row[0], profileId: row[1], milestoneId: row[2], dateAchieved: new Date(row[3]).toISOString().split('T')[0], notes: row[4] }; }

function transformTarget(t) { return [t.id, t.profileId, t.field, t.targetValue, t._serverTimestamp]; }
function reverseTarget(row) { return { id: row[0], profileId: row[1], field: row[2], targetValue: Number(row[3]) }; }

function transformReminder(r) { 
  // Added specificDate
  return [r.id, r.profileId, r.title, r.time, JSON.stringify(r.days), r.active?"TRUE":"FALSE", r.type, r.specificDate || "", r._serverTimestamp]; 
}
function reverseReminder(row) { 
  let days = []; try { days = JSON.parse(row[4]); } catch(e){}
  
  // FIX: Force year to 2024 to avoid 1899 timezone offset issues in Indonesia (GMT+7 vs Batavia Time)
  let timeVal = row[3];
  try {
      if (typeof timeVal === 'object' || String(timeVal).includes('T') || String(timeVal).includes('1899')) {
          const d = new Date(timeVal);
          if (!isNaN(d.getTime())) {
              // Force date to a modern epoch to ensure consistent timezone offset
              d.setFullYear(2024);
              d.setMonth(0);
              d.setDate(1);
              timeVal = Utilities.formatDate(d, "GMT+7", "HH:mm");
          }
      }
  } catch(e) {}
  
  // ROBUST BOOLEAN PARSING
  let isActive = false;
  const rawActive = String(row[5]).toUpperCase();
  if (rawActive === "TRUE") isActive = true;

  // New specific_date parsing (Column 7 / Index 7 in array)
  // FIX: Handle Date object to String conversion WITHOUT UTC shift by using Utilities.formatDate
  let specificDateStr = "";
  if (row[7]) {
      try { 
          if (row[7] instanceof Date) {
              // Use Utilities.formatDate to strictly keep the date in GMT+7 context
              specificDateStr = Utilities.formatDate(row[7], "GMT+7", "yyyy-MM-dd");
          } else {
              // If string, assume it is YYYY-MM-DD or attempt basic parse
              const s = String(row[7]).trim();
              if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  specificDateStr = s;
              } else {
                  // Fallback for other string formats
                  const d = new Date(s);
                  if(!isNaN(d.getTime())) specificDateStr = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
              }
          }
      } catch(e) { 
          specificDateStr = ""; // Fail safe
      }
  }

  return { id: row[0], profileId: row[1], title: row[2], time: String(timeVal), days: days, active: isActive, type: row[6], specificDate: specificDateStr }; 
}

function transformMenstrual(c) { return [c.id, c.profileId, fmtDate(c.startDate), c.endDate ? fmtDate(c.endDate) : "", c.flow, JSON.stringify(c.symptoms||[]), c.notes, c._serverTimestamp]; }
function reverseMenstrual(row) {
  let start = ""; try { start = new Date(row[2]).toISOString().split('T')[0]; } catch(e){}
  let end = undefined; if(row[3]) { try { end = new Date(row[3]).toISOString().split('T')[0]; } catch(e){} }
  let symptoms = []; try { symptoms = JSON.parse(row[5]); } catch(e){}
  return { id: row[0], profileId: row[1], startDate: start, endDate: end, flow: row[4], symptoms: symptoms, notes: row[6] };
}

function getOrCreateDriveFolder() {
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('DRIVE_FOLDER_ID');
  try { if (folderId) return DriveApp.getFolderById(folderId); } catch (e) {}
  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function uploadImageToDrive(base64Data, fileName) {
  try {
    const folder = getOrCreateDriveFolder();
    const split = base64Data.split('base64,');
    const blob = Utilities.newBlob(Utilities.base64Decode(split[1]), split[0].split(':')[1].split(';')[0], fileName);
    return { status: 'success', url: `https://lh3.googleusercontent.com/d/${folder.createFile(blob).getId()}` };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function resetAllData() { 
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(s => {
     if(Object.values(CONFIG.SHEET_NAMES).includes(s.getName())) {
       const lastRow = s.getLastRow();
       if (lastRow > 1) s.getRange(2, 1, lastRow - 1, s.getLastColumn()).clearContent();
     }
  });
  return { status: 'success' }; 
}

function responseJSON(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }

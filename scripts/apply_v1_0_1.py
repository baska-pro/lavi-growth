from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)


# utils.ts --------------------------------------------------------------------
p = 'utils.ts'
text = read(p)
text = replace_once(
    text,
    "import { WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS } from './data/medicalData';",
    "import { WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS } from './data/medicalData';\nimport { clearAppStateDb, clearQueueDb, loadAppStateFromDb, saveAppStateToDb } from './services/localDb';",
    'utils localDb import',
)
text, n = re.subn(
    r"const STORAGE_KEY = 'FAMHEALTH_DATA_V1';\n\n// --- ID Generator \(Simple & Short\) ---\nexport const generateId = \(\): string => \{\n  return Math\.random\(\)\.toString\(36\)\.substring\(2, 10\)\.toUpperCase\(\);\n\};\n\n// --- Local Storage Helpers ---.*?// --- DYNAMIC THEME HELPER",
    """const LEGACY_STORAGE_KEY = 'FAMHEALTH_DATA_V1';
let hydratedStateCache: AppState | null | undefined;

// --- ID Generator ---
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
};

// --- IndexedDB State Helpers ---
export const hydrateStateCache = async (): Promise<AppState | null> => {
  if (hydratedStateCache !== undefined) return hydratedStateCache;
  try {
    const fromDb = await loadAppStateFromDb();
    if (fromDb) {
      hydratedStateCache = fromDb;
      return fromDb;
    }
  } catch (error) {
    console.warn('IndexedDB load failed, checking legacy storage', error);
  }

  try {
    const serialized = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!serialized) {
      hydratedStateCache = null;
      return null;
    }
    const legacy = JSON.parse(serialized) as AppState;
    hydratedStateCache = legacy;
    try {
      await saveAppStateToDb(legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      console.warn('Legacy state migration to IndexedDB failed', error);
    }
    return legacy;
  } catch (error) {
    console.error('Failed to load legacy state', error);
    hydratedStateCache = null;
    return null;
  }
};

export const loadStateAsync = hydrateStateCache;

export const saveStateAsync = async (state: AppState): Promise<void> => {
  hydratedStateCache = state;
  try {
    await saveAppStateToDb(state);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('IndexedDB save failed', error);
  }
};

// Existing synchronous App API reads the pre-hydrated in-memory cache.
export const loadState = (): AppState | null => {
  if (hydratedStateCache !== undefined) return hydratedStateCache;
  try {
    const serialized = localStorage.getItem(LEGACY_STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : null;
  } catch {
    return null;
  }
};

export const saveState = (state: AppState): void => {
  void saveStateAsync(state);
};

export const clearLocalState = async (): Promise<void> => {
  hydratedStateCache = null;
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem('LAVI_REMINDER_FIRED');
  await Promise.allSettled([clearAppStateDb(), clearQueueDb()]);
};

// --- DYNAMIC THEME HELPER""",
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'utils storage replacement count={n}')

text, n = re.subn(
    r"export const exportData = \(state: AppState\) => \{.*?\n\};\n\nexport const exportToExcel",
    """export const exportData = (state: AppState) => {
  const { pin, dbConfig, ...safeState } = state;
  const backup = {
    format: 'lavi-growth-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: safeState
  };
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `LaviGrowth-Backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportToExcel""",
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'utils exportData replacement count={n}')
write(p, text)


# App.tsx ---------------------------------------------------------------------
p = 'App.tsx'
text = read(p)
text = replace_once(
    text,
    "import { loadState, saveState, exportData, calculateDetailedAge, formatDate, savePinRecovery, exportToExcel, generatePDF, generateId, calculateAge } from './utils';",
    "import { loadState, saveState, saveStateAsync, clearLocalState, exportData, calculateDetailedAge, formatDate, savePinRecovery, exportToExcel, generatePDF, generateId, calculateAge } from './utils';",
    'App utils import',
)
text = replace_once(
    text,
    "import { pullFromCloud, pushToCloud, deleteFromCloud, checkPinOnServer, updatePinOnServer, resetServerData, processQueueFIFO, getQueueLength } from './services/api';",
    "import { pullFromCloud, pushToCloud, deleteFromCloud, checkPinOnServer, updatePinOnServer, resetServerData, processQueueFIFO, getQueueLength, getQueueStatus, retryFailedQueue } from './services/api';",
    'App api import',
)
text = replace_once(
    text,
    "  const [pendingItems, setPendingItems] = useState(0);",
    "  const [pendingItems, setPendingItems] = useState(0);\n  const [failedItems, setFailedItems] = useState(0);",
    'App failed queue state',
)

text, n = re.subn(
    r"  // --- NOTIFICATION LOGIC ---.*?\n  // --- PREGNANCY MODE ---",
    r'''  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
      let intervalId: ReturnType<typeof setInterval> | null = null;
      const firedStorageKey = 'LAVI_REMINDER_FIRED';
      const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const alreadyFired = (key: string) => {
          try {
              const saved = JSON.parse(localStorage.getItem(firedStorageKey) || '{}');
              const cutoff = Date.now() - 48 * 60 * 60 * 1000;
              Object.keys(saved).forEach(k => { if (saved[k] < cutoff) delete saved[k]; });
              if (saved[key]) return true;
              saved[key] = Date.now();
              localStorage.setItem(firedStorageKey, JSON.stringify(saved));
              return false;
          } catch { return false; }
      };

      const notify = async (r: Reminder) => {
          const title = `Pengingat: ${r.title}`;
          const body = `Waktunya untuk ${r.title}.`;
          if (Notification.permission === 'granted') {
              try {
                  if ('serviceWorker' in navigator) {
                      const registration = await navigator.serviceWorker.ready;
                      await registration.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: `lavi-reminder-${r.id}` });
                      return;
                  }
                  new Notification(title, { body, icon: '/favicon.svg' });
                  return;
              } catch (error) { console.warn('Notification delivery failed', error); }
          }
          showToast(`Waktunya: ${r.title}`, 'info');
      };

      const checkReminders = () => {
          if (!state.reminders?.length) return;
          const now = new Date();
          const currentDay = now.getDay();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const today = localDateKey(now);
          state.reminders.forEach(r => {
              if (!r.active || r.time !== currentTime) return;
              const matchesDate = r.specificDate ? r.specificDate === today : r.days.includes(currentDay);
              if (!matchesDate) return;
              const fireKey = `${r.id}:${today}:${currentTime}`;
              if (!alreadyFired(fireKey)) void notify(r);
          });
      };

      checkReminders();
      const now = new Date();
      const delay = Math.max(250, (60 - now.getSeconds()) * 1000 - now.getMilliseconds());
      const timeoutId = setTimeout(() => {
          checkReminders();
          intervalId = setInterval(checkReminders, 60_000);
      }, delay);
      return () => {
          clearTimeout(timeoutId);
          if (intervalId) clearInterval(intervalId);
      };
  }, [state.reminders]);

  // --- PREGNANCY MODE ---''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'App reminder replacement count={n}')

text = replace_once(
    text,
    "        await processQueueFIFO();\n        setPendingItems(getQueueLength());\n        const cloudState = await pullFromCloud(pin);",
    "        await processQueueFIFO();\n        const queueStatus = await getQueueStatus();\n        setPendingItems(queueStatus.pending);\n        setFailedItems(queueStatus.failed);\n        if (queueStatus.total > 0) return;\n        const cloudState = await pullFromCloud(pin);",
    'App pull queue guard',
)
text = replace_once(
    text,
    "    setPendingItems(getQueueLength());",
    "    setPendingItems(getQueueLength());\n    void getQueueStatus().then(q => setFailedItems(q.failed));",
    'App queue status init',
)
text = replace_once(text, "    }, 10000);", "    }, 180000);", 'App sync interval')

text = replace_once(
    text,
    "  const resetProfileForm = () => {",
    """  const handleRetryFailedSync = async () => {
      if (!navigator.onLine) return showToast('Anda sedang offline', 'warning');
      setIsSyncing(true);
      try {
          const retried = await retryFailedQueue();
          await processQueueFIFO();
          const q = await getQueueStatus();
          setPendingItems(q.pending);
          setFailedItems(q.failed);
          if (q.total === 0 && state.pin && !state.isOfflineMode) await performPullSync(state.pin);
          showToast(retried > 0 ? 'Antrian gagal dicoba ulang.' : 'Tidak ada antrian gagal.', 'info');
      } finally { setIsSyncing(false); }
  };
  const resetProfileForm = () => {""",
    'App retry handler',
)

text = replace_once(
    text,
    "const newState = { ...state, profiles: newProfiles, records: state.records.filter(r => r.profileId !== targetId), activeProfileId: newProfiles[0]?.id || null };",
    "const newState = { ...state, profiles: newProfiles, records: state.records.filter(r => r.profileId !== targetId), vaccines: (state.vaccines || []).filter(v => v.profileId !== targetId), milestones: (state.milestones || []).filter(m => m.profileId !== targetId), targets: (state.targets || []).filter(t => t.profileId !== targetId), reminders: (state.reminders || []).filter(r => r.profileId !== targetId), menstrualCycles: (state.menstrualCycles || []).filter(c => c.profileId !== targetId), activeProfileId: newProfiles[0]?.id || null };",
    'App profile cascade delete',
)

text, n = re.subn(
    r"  const handleFileSelect = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\n  const handleExport = \(\) =>",
    r'''  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (file.size > 25 * 1024 * 1024) return showToast('File backup terlalu besar (maks. 25 MB).', 'error');
      const fileReader = new FileReader();
      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = event => {
          try {
              const raw = JSON.parse(event.target?.result as string);
              const parsed = raw?.format === 'lavi-growth-backup' ? raw.data : raw;
              if (!parsed || !Array.isArray(parsed.profiles) || !Array.isArray(parsed.records)) return showToast('Format backup tidak valid.', 'error');
              setImportPreview({
                  profiles: parsed.profiles,
                  records: parsed.records,
                  vaccines: Array.isArray(parsed.vaccines) ? parsed.vaccines : [],
                  milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
                  targets: Array.isArray(parsed.targets) ? parsed.targets : [],
                  reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
                  menstrualCycles: Array.isArray(parsed.menstrualCycles) ? parsed.menstrualCycles : [],
                  activeProfileId: parsed.activeProfileId || parsed.profiles[0]?.id || null,
                  darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : state.darkMode
              });
          } catch { showToast('File rusak atau tidak valid.', 'error'); }
      };
  };
  const handleExport = () =>''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'App import parser replacement count={n}')

text, n = re.subn(
    r"  const confirmImport = async \(\) => \{.*?\n  const handleDirectLogin = async \(\) =>",
    r'''  const confirmImport = async () => {
      if (!importPreview) return;
      setGlobalLoading('Mengimpor & Memvalidasi Data...');
      const importedState: AppState = {
          ...initialState,
          profiles: importPreview.profiles,
          records: importPreview.records,
          vaccines: importPreview.vaccines,
          milestones: importPreview.milestones,
          targets: importPreview.targets,
          reminders: importPreview.reminders,
          menstrualCycles: importPreview.menstrualCycles,
          activeProfileId: importPreview.activeProfileId,
          darkMode: importPreview.darkMode,
          pin: state.pin,
          isOfflineMode: state.isOfflineMode
      };
      setState(importedState);
      await saveStateAsync(importedState);
      if (state.pin && !state.isOfflineMode) {
          await pushToCloud({ profiles: importedState.profiles, records: importedState.records, vaccines: importedState.vaccines, milestones: importedState.milestones, targets: importedState.targets, reminders: importedState.reminders, menstrualCycles: importedState.menstrualCycles }, state.pin);
          const q = await getQueueStatus();
          setPendingItems(q.pending);
          setFailedItems(q.failed);
          showToast(q.total === 0 ? 'Data berhasil diimpor dan tersinkron.' : 'Data berhasil diimpor. Sinkronisasi masuk antrian.', q.failed ? 'warning' : 'success');
      } else {
          showToast('Data berhasil diimpor ke penyimpanan lokal.', 'success');
      }
      setGlobalLoading(null);
      setImportPreview(null);
  };
  const handleDirectLogin = async () =>''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'App confirmImport replacement count={n}')

text = replace_once(text, 'if (pinInput === state.pin || pinInput === "0000") isValid = true;', 'if (pinInput === state.pin) isValid = true;', 'App reset bypass')
text, n = re.subn(
    r"  const executeHardReset = async \(\) => \{.*?\n\n  if \(!isLoaded\) return null;",
    r'''  const executeHardReset = async () => {
      setGlobalLoading('Mereset Aplikasi...');
      await clearLocalState();
      setState(initialState);
      setGlobalLoading(null);
      setShowResetConfirmModal(false);
      showToast('Data lokal aplikasi direset.', 'success');
      setTimeout(() => window.location.reload(), 1000);
  };

  if (!isLoaded) return null;''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise RuntimeError(f'App hard reset replacement count={n}')

pending_ui = '{pendingItems > 0 && isOnline && !state.isOfflineMode && ( <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"> <RefreshCw size={14} className="animate-spin" /> Menyinkronkan {pendingItems} item... </div> )}'
text = replace_once(
    text,
    pending_ui,
    pending_ui + '\n      {failedItems > 0 && isOnline && !state.isOfflineMode && ( <button onClick={handleRetryFailedSync} className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[91] bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"> <AlertTriangle size={14} /> {failedItems} sync gagal · Coba lagi </button> )}',
    'App failed queue UI',
)
write(p, text)


# Reminders editor -------------------------------------------------------------
p = 'components/features/Reminders.tsx'
text = read(p)
text = replace_once(text, "            active: true, // WAJIB TRUE SAAT BUAT BARU", "            active: editingId ? (reminders.find(r => r.id === editingId)?.active ?? true) : true,", 'Reminder active state')
write(p, text)


# Settings --------------------------------------------------------------------
p = 'components/features/Settings.tsx'
text = read(p)
text = replace_once(
    text,
    '    if (newPin.length < 4) {\n      if(onShowToast) onShowToast("PIN baru minimal 4 angka", "error");\n      return;\n    }',
    '    if (!/^\\d{6,12}$/.test(newPin)) {\n      if(onShowToast) onShowToast("PIN baru harus 6-12 angka", "error");\n      return;\n    }',
    'Settings PIN validation',
)
text = text.replace('placeholder="****"', 'placeholder="PIN lama" inputMode="numeric" autoComplete="current-password"', 1)
text = text.replace('placeholder="****"', 'placeholder="6-12 angka" inputMode="numeric" autoComplete="new-password" maxLength={12}', 1)
text = replace_once(text, '*PIN digunakan untuk sinkronisasi data antar perangkat.', '*PIN baru wajib 6-12 angka. Server menyimpan hash PIN, bukan PIN asli.', 'Settings PIN note')
write(p, text)


# GAS backend -----------------------------------------------------------------
for p in ['ScriptGAS.gs', 'services/gasScriptContent.ts']:
    text = read(p)
    text = text.replace('LAVI GROWTH TRACKER - BACKEND V8.0 (Fix Date Timezone Bug)', 'LAVI GROWTH TRACKER - BACKEND V9.0 (Hashed PIN + Rate Limit)')
    text = replace_once(text, '  DEFAULT_PIN: "1234",', '  PIN_MIN_LENGTH: 6,\n  MAX_FAILED_ATTEMPTS: 5,\n  LOCK_MINUTES: 5,', f'{p} remove default PIN')
    text = replace_once(
        text,
        "  if (!props.getProperty('APP_PIN')) props.setProperty('APP_PIN', CONFIG.DEFAULT_PIN);",
        "  migrateLegacyPin(props);\n  if (!props.getProperty('APP_PIN_HASH')) {\n    const initialPin = String(Math.floor(100000 + Math.random() * 900000));\n    setPinHash(initialPin, props);\n    Logger.log('PIN awal Lavi Growth: ' + initialPin + ' (simpan lalu ganti dari aplikasi)');\n  }",
        f'{p} initial PIN',
    )
    helpers = r'''
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
'''
    text = replace_once(text, '\nfunction initialSetup() {', helpers + '\nfunction initialSetup() {', f'{p} helpers')
    text, n = re.subn(
        r"function doPost\(e\) \{.*?\n\}\n\nfunction handlePull\(\) \{",
        r'''function doPost(e) {
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

function handlePull() {''',
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise RuntimeError(f'{p} doPost replacement count={n}')
    write(p, text)


# api.ts queue count remains sync-compatible while the queue body lives in IDB.
p = 'services/api.ts'
text = read(p)
text = replace_once(text, "const LEGACY_QUEUE_KEY = 'LAVI_SYNC_QUEUE';", "const LEGACY_QUEUE_KEY = 'LAVI_SYNC_QUEUE';\nconst QUEUE_COUNT_KEY = 'LAVI_SYNC_QUEUE_COUNT';", 'api count key')
text = replace_once(text, "export const getQueueLength = async (): Promise<number> => (await getQueueStatus()).total;", "export const getQueueLength = (): number => Number(localStorage.getItem(QUEUE_COUNT_KEY) || 0);", 'api sync count')
text = replace_once(
    text,
    "export const getQueueStatus = async () => {\n  await migrateLegacyQueue();\n  return getQueueCounts();\n};",
    "export const getQueueStatus = async () => {\n  await migrateLegacyQueue();\n  const status = await getQueueCounts();\n  localStorage.setItem(QUEUE_COUNT_KEY, String(status.total));\n  return status;\n};",
    'api queue status cache',
)
text = replace_once(text, "  await putQueueItem(item);\n  if (isOnline())", "  await putQueueItem(item);\n  localStorage.setItem(QUEUE_COUNT_KEY, String(getQueueLength() + 1));\n  if (isOnline())", 'api add queue count')
text = replace_once(text, "        await deleteQueueItem(item.id);\n        continue;", "        await deleteQueueItem(item.id);\n        const status = await getQueueCounts();\n        localStorage.setItem(QUEUE_COUNT_KEY, String(status.total));\n        continue;", 'api delete queue count')
write(p, text)


# Cleanup one-shot files from the final branch.
Path('scripts/apply_v1_0_1.py').unlink()
Path('.github/workflows/apply-v1.0.1-upgrade.yml').unlink()

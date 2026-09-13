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


p = 'App.tsx'
text = read(p)
pattern = r"  const handleDirectLogin = async \(\) => \{.*?  const handlePinUpdate = async"
replacement = r'''  const handleDirectLogin = async () => {
      if (!/^\d{4,12}$/.test(pinInput)) return showToast('PIN harus berupa 4-12 angka.', 'error');
      const loginPin = pinInput;
      setGlobalLoading('Verifikasi & Mengunduh Data...');
      try {
          const isValid = await checkPinOnServer(loginPin);
          if (!isValid) {
              showToast('PIN salah atau akses sedang dibatasi sementara.', 'error');
              return;
          }
          const cloudState = await pullFromCloud(loginPin);
          if (!cloudState) {
              showToast('PIN benar tetapi data cloud gagal diambil.', 'warning');
              return;
          }
          const fixedRecords = cloudState.records.map(r => {
              if (r.timestamp) return r;
              const t = r.time || '23:59';
              const timestamp = new Date(`${r.date}T${t}`).getTime();
              return { ...r, timestamp: Number.isNaN(timestamp) ? Date.now() : timestamp };
          });
          const nextState: AppState = {
              ...state,
              pin: loginPin,
              profiles: cloudState.profiles,
              records: fixedRecords,
              vaccines: cloudState.vaccines,
              milestones: cloudState.milestones,
              targets: cloudState.targets || [],
              reminders: cloudState.reminders || [],
              menstrualCycles: cloudState.menstrualCycles || [],
              activeProfileId: cloudState.profiles[0]?.id || null,
              lastSyncTime: Date.now()
          };
          setState(nextState);
          await saveStateAsync(nextState);
          setShowLoginModal(false);
          setPinInput('');
          showToast('Berhasil Masuk & Data Tersinkron!', 'success');
      } finally {
          setGlobalLoading(null);
      }
  };
  const handlePinUpdate = async'''
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise RuntimeError(f'handleDirectLogin replacement count={count}')
text = text.replace('Masukkan PIN Aplikasi dari Google Apps Script.', 'Masukkan PIN backend cloud Anda.')
write(p, text)

p = 'utils.ts'
text = read(p)
text = replace_once(
    text,
    "  localStorage.removeItem('LAVI_REMINDER_FIRED');\n  await Promise.allSettled([clearAppStateDb(), clearQueueDb()]);",
    "  localStorage.removeItem('LAVI_REMINDER_FIRED');\n  localStorage.removeItem('LAVI_SYNC_QUEUE');\n  localStorage.removeItem('LAVI_SYNC_QUEUE_COUNT');\n  await Promise.allSettled([clearAppStateDb(), clearQueueDb()]);",
    'clear legacy sync keys',
)
write(p, text)

Path('scripts/final_patch_v1_0_1.py').unlink()
Path('.github/workflows/final-patch-v1.0.1.yml').unlink()

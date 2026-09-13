
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, Download, FileJson, 
  Settings, Lock, CheckCircle, Upload, Image as IconImage, FileSpreadsheet, RefreshCw, XCircle, Info, Target as TargetIcon, FileText, Cloud, LogIn, AlertTriangle, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AppState, Profile, ProfileType, HealthRecord, Gender, METRIC_LABELS, Target, VaccineRecord, MilestoneRecord, Reminder, MenstrualCycle } from './types';
import { loadState, saveState, exportData, calculateDetailedAge, formatDate, savePinRecovery, exportToExcel, generatePDF, generateId, calculateAge } from './utils';
import { Button, Input, Modal, Toast, AvatarSelector, ConfirmationModal, LoadingOverlay } from './components/UI';
import { pullFromCloud, pushToCloud, deleteFromCloud, checkPinOnServer, updatePinOnServer, resetServerData, processQueueFIFO, getQueueLength } from './services/api';

// --- Modular Component Imports ---
import { DashboardView } from './components/features/Dashboard';
import { StatsView } from './components/features/Stats';
import { DataTableView, RecordForm, RecordDetail } from './components/features/Records';
import { GalleryView } from './components/features/Gallery';
import { ArticlesView } from './components/features/Education';
import { JournalView } from './components/features/Journal';
import { RemindersView } from './components/features/Reminders';
import { HelpGuideView } from './components/features/HelpGuide'; 
import { HealthDictionaryView } from './components/features/HealthDictionary'; 
import { SettingsModal } from './components/features/Settings'; 
import { DailyBriefingModal } from './components/features/DailyBriefing'; 
import { DatabaseSetupModal } from './components/features/DatabaseSetupModal';
import { Sidebar, Header, MobileNav } from './components/layout/MainLayout';

const initialState: AppState = {
  profiles: [],
  records: [],
  activeProfileId: null,
  darkMode: false,
  targets: [],
  vaccines: [],
  milestones: [],
  reminders: [],
  menstrualCycles: [],
  lastSyncTime: undefined,
  isOfflineMode: false 
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'gallery' | 'data' | 'articles' | 'journal' | 'reminders' | 'help' | 'dictionary'>('dashboard');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingItems, setPendingItems] = useState(0);

  // Modals & Navigation
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDbSetupModal, setShowDbSetupModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // New Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false); 
  const [importPreview, setImportPreview] = useState<any>(null);

  // UI Toggles
  const [showWelcomeAvatar, setShowWelcomeAvatar] = useState(false);
  const [globalLoading, setGlobalLoading] = useState<string | null>(null);

  // Gallery
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ url: string; record: HealthRecord } | null>(null);

  // Record Management
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [editRecord, setEditRecord] = useState<HealthRecord | undefined>(undefined);
  const [lastSavedRecord, setLastSavedRecord] = useState<HealthRecord | null>(null);
  
  // Security Actions
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [securityAction, setSecurityAction] = useState<'delete_record' | 'delete_profile' | 'edit_profile' | 'access_settings' | 'reset_app' | 'delete_reminder' | 'delete_target' | 'delete_cycle' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  // Target State (Updated for Editing)
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [targetField, setTargetField] = useState('weight');
  const [targetValue, setTargetValue] = useState('');
  const [targetAlert, setTargetAlert] = useState<{message: string, type: 'success' | 'warning' | 'error', targetId?: string} | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Profile Form
  const [profileName, setProfileName] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>(ProfileType.ADULT);
  const [profileDob, setProfileDob] = useState('');
  const [profileGender, setProfileGender] = useState<Gender>('Male');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Pull to Refresh
  const [pullY, setPullY] = useState(0);
  const [startTouchY, setStartTouchY] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // --- AUTOMATIC PROFILE EVOLUTION (Lifecycle) ---
  useEffect(() => {
      if (!isLoaded || !state.profiles.length) return;

      const evolvedProfiles = state.profiles.map(p => {
          if (p.type === ProfileType.PREGNANCY) return p;
          const ageYears = calculateAge(p.dob);
          let newType = p.type;
          if (ageYears < 2) newType = ProfileType.BABY;
          else if (ageYears >= 2 && ageYears < 18) newType = ProfileType.CHILD;
          else if (ageYears >= 18 && ageYears < 60) newType = ProfileType.ADULT;
          else if (ageYears >= 60) newType = ProfileType.SENIOR;

          if (newType !== p.type) return { ...p, type: newType };
          return p;
      });

      const hasChanges = JSON.stringify(evolvedProfiles) !== JSON.stringify(state.profiles);
      if (hasChanges) setState(prev => ({ ...prev, profiles: evolvedProfiles }));
  }, [isLoaded, state.profiles]);

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
      const checkReminders = () => {
          if (!state.reminders || state.reminders.length === 0) return;
          const now = new Date();
          const currentDay = now.getDay();
          const currentHour = String(now.getHours()).padStart(2, '0');
          const currentMinute = String(now.getMinutes()).padStart(2, '0');
          const currentTime = `${currentHour}:${currentMinute}`;

          state.reminders.forEach(r => {
              if (r.active && r.days.includes(currentDay) && r.time === currentTime) {
                  if (Notification.permission === 'granted') {
                      new Notification(`Pengingat: ${r.title}`, { body: `Waktunya untuk ${r.title}. Jaga kesehatan Anda!`, icon: '/icon.png' });
                  } else {
                      showToast(`Waktunya: ${r.title}`, "info");
                  }
              }
          });
      };
      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000;
      const timeoutId = setTimeout(() => { checkReminders(); const intervalId = setInterval(checkReminders, 60000); return () => clearInterval(intervalId); }, delay);
      return () => clearTimeout(timeoutId);
  }, [state.reminders]);

  // --- PREGNANCY MODE ---
  const pregnancyNotificationRef = useRef(false);
  useEffect(() => {
      const pregnancyProfile = state.profiles.find(p => p.type === ProfileType.PREGNANCY);
      const hasPregnancyProfile = !!pregnancyProfile;
      let targetMomId: string | null = null;
      const activeP = state.profiles.find(p => p.id === state.activeProfileId);
      if (activeP && activeP.type === ProfileType.ADULT && activeP.gender === 'Female') targetMomId = activeP.id;
      else { const anyMom = state.profiles.find(p => p.type === ProfileType.ADULT && p.gender === 'Female'); if (anyMom) targetMomId = anyMom.id; }

      if (targetMomId) {
          const mom = state.profiles.find(p => p.id === targetMomId);
          if (!mom) return;
          let updatedProfiles = null;
          if (hasPregnancyProfile && !mom.isPregnant) {
              updatedProfiles = state.profiles.map(p => p.id === targetMomId ? { ...p, isPregnant: true } : p);
              if (!pregnancyNotificationRef.current) { showToast("Mode Kehamilan otomatis diaktifkan.", "info"); pregnancyNotificationRef.current = true; }
          } else if (!hasPregnancyProfile && mom.isPregnant) {
              updatedProfiles = state.profiles.map(p => p.id === targetMomId ? { ...p, isPregnant: false } : p);
              pregnancyNotificationRef.current = false;
              showToast("Mode Kehamilan dinonaktifkan.", "info");
          }
          if (updatedProfiles) {
              setState(prev => ({ ...prev, profiles: updatedProfiles! }));
              if (state.pin && !state.isOfflineMode) pushToCloud({ profiles: updatedProfiles }, state.pin);
          }
      }
  }, [state.profiles, state.activeProfileId, state.isOfflineMode]);

  // --- SYNC ENGINE ---
  const syncLock = useRef(false);
  const performPullSync = useCallback(async (pinToUse?: string) => {
    if (state.isOfflineMode) return;
    const pin = pinToUse || state.pin;
    if (!pin || !navigator.onLine || syncLock.current) return;
    syncLock.current = true;
    setIsSyncing(true);
    try {
        await processQueueFIFO();
        setPendingItems(getQueueLength());
        const cloudState = await pullFromCloud(pin);
        if (cloudState) {
            const sanitizedRecords = cloudState.records.map(r => {
                let ts = r.timestamp;
                if (!ts || isNaN(ts) || ts < 100000) { const tStr = r.time && r.time.length >= 4 ? r.time : "23:59"; ts = new Date(`${r.date}T${tStr}`).getTime(); if (isNaN(ts)) ts = Date.now(); }
                return { ...r, timestamp: ts };
            });
            setState(prev => ({ ...prev, profiles: cloudState.profiles, records: sanitizedRecords, vaccines: cloudState.vaccines, milestones: cloudState.milestones, targets: cloudState.targets || prev.targets, reminders: cloudState.reminders || prev.reminders, menstrualCycles: cloudState.menstrualCycles || prev.menstrualCycles, activeProfileId: prev.activeProfileId && cloudState.profiles.find(p => p.id === prev.activeProfileId) ? prev.activeProfileId : (cloudState.profiles[0]?.id || null), lastSyncTime: Date.now() }));
        }
    } catch (e) { console.error(e); } finally { setIsSyncing(false); syncLock.current = false; }
  }, [state.pin, state.isOfflineMode]);

  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        if (!state.isOfflineMode && state.pin) {
            showToast("Internet terhubung. Menyinkronkan...", "info");
            performPullSync(); 
        }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setPendingItems(getQueueLength());
    const interval = setInterval(() => { 
        if (navigator.onLine && state.pin && !syncLock.current && !state.isOfflineMode) performPullSync(state.pin); 
    }, 10000);
    return () => { 
        window.removeEventListener('online', handleOnline); 
        window.removeEventListener('offline', handleOffline); 
        clearInterval(interval); 
    };
  }, [state.pin, performPullSync, state.isOfflineMode]);

  useEffect(() => { const onFocus = () => { if (state.pin && navigator.onLine && !state.isOfflineMode) performPullSync(state.pin); }; window.addEventListener('focus', onFocus); return () => window.removeEventListener('focus', onFocus); }, [state.pin, performPullSync, state.isOfflineMode]);

  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      setState(prev => ({ ...prev, ...loaded, profiles: Array.isArray(loaded.profiles) ? loaded.profiles : [], records: Array.isArray(loaded.records) ? loaded.records : [], targets: Array.isArray(loaded.targets) ? loaded.targets : [], vaccines: Array.isArray(loaded.vaccines) ? loaded.vaccines : [], milestones: Array.isArray(loaded.milestones) ? loaded.milestones : [], reminders: Array.isArray(loaded.reminders) ? loaded.reminders : [], menstrualCycles: Array.isArray(loaded.menstrualCycles) ? loaded.menstrualCycles : [] }));
      if(loaded.pin && !loaded.isOfflineMode) setTimeout(() => performPullSync(loaded.pin), 1000);
      if (loaded.profiles && loaded.profiles.length > 0) {
          setTimeout(() => setShowDailyBriefing(true), 1500);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) { saveState(state); if (state.darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); } }, [state, isLoaded]);
  useEffect(() => { const timer = setInterval(() => setCurrentDateTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  // --- Handlers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => setToast({ message, type });
  const handleTouchStart = (e: React.TouchEvent) => { if (scrollRef.current?.scrollTop === 0) setStartTouchY(e.touches[0].clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { if (startTouchY > 0 && scrollRef.current?.scrollTop === 0) { const diff = e.touches[0].clientY - startTouchY; if (diff > 0) setPullY(Math.pow(diff, 0.8)); } };
  const handleTouchEnd = () => { 
      if (pullY > 80 && state.pin && !state.isOfflineMode) { performPullSync(); showToast("Menyinkronkan..."); } 
      else if (pullY > 80 && state.isOfflineMode) { showToast("Mode Offline Aktif (Sync Dimatikan)", "info"); }
      setPullY(0); setStartTouchY(0); 
  };

  const handleManualSync = () => { 
      if (state.isOfflineMode) return showToast("Mode Offline Aktif. Matikan di pengaturan untuk sync.", "warning");
      if (!state.pin) { showToast("Masukkan PIN untuk sinkronisasi cloud", "info"); setShowLoginModal(true); return; } 
      if (!navigator.onLine) return showToast("Anda sedang offline", "warning"); 
      showToast("Sinkronisasi manual dimulai...", "info"); performPullSync(state.pin); 
  };
  const resetProfileForm = () => { setProfileName(''); setProfileType(ProfileType.ADULT); setProfileDob(''); setProfileGender('Male'); setProfileAvatar(''); setEditingProfileId(null); };
  const handleBirth = async (pregnancyProfileId: string, babyName: string, babyGender: Gender, birthDate: string) => { setGlobalLoading("Memproses Kelahiran..."); const updatedProfiles = state.profiles.map(p => { if (p.id === pregnancyProfileId) { return { ...p, name: babyName, type: ProfileType.BABY, gender: babyGender, dob: birthDate, isPregnant: false }; } if (p.type === ProfileType.ADULT && p.gender === 'Female' && p.isPregnant) { return { ...p, isPregnant: false }; } return p; }); setState(prev => ({ ...prev, profiles: updatedProfiles, activeProfileId: pregnancyProfileId })); if (state.pin && !state.isOfflineMode) { await pushToCloud({ profiles: updatedProfiles }, state.pin); setTimeout(() => performPullSync(state.pin), 1000); } setGlobalLoading(null); setShowSuccessModal(true); showToast(`Selamat datang, ${babyName}!`, "success"); };
  const handleProfileSubmit = async () => { const dateLabel = profileType === ProfileType.PREGNANCY ? "HPHT" : "Tanggal Lahir"; if (!profileName || !profileDob) return showToast(`Nama & ${dateLabel} wajib diisi`, "error"); let finalAvatar = profileAvatar; let newProfile: Profile; let newState: AppState; if (editingProfileId) { newProfile = { id: editingProfileId, name: profileName, type: profileType, dob: profileDob, gender: profileGender, avatar: finalAvatar }; const oldProfile = state.profiles.find(p => p.id === editingProfileId); if (oldProfile) newProfile.isPregnant = oldProfile.isPregnant; newState = { ...state, profiles: state.profiles.map(p => p.id === editingProfileId ? newProfile : p) }; } else { newProfile = { id: generateId(), name: profileName, type: profileType, dob: profileDob, gender: profileGender, avatar: finalAvatar }; newState = { ...state, profiles: [...state.profiles, newProfile], activeProfileId: newProfile.id }; } setState(newState); setShowProfileModal(false); if (state.pin && !state.isOfflineMode) { await pushToCloud({ profiles: [newProfile] }, state.pin); setPendingItems(prev => prev + 1); if (isOnline) showToast("Disimpan & Sinkronisasi..."); else showToast("Disimpan Offline (Antrian)"); } else { showToast("Profil Tersimpan (Lokal)"); } };
  const handleSaveRecord = async (recordData: any) => { if (!state.activeProfileId) return; checkTargets(recordData); const recordId = editRecord ? editRecord.id : generateId(); let timestamp = Date.now(); if (editRecord && editRecord.timestamp) timestamp = editRecord.timestamp; if (recordData.date) { const tStr = recordData.time || "12:00"; const calculatedTs = new Date(`${recordData.date}T${tStr}`).getTime(); if (!isNaN(calculatedTs)) { const isToday = new Date().toISOString().split('T')[0] === recordData.date; if (isToday && !recordData.time) { timestamp = Date.now(); } else { timestamp = calculatedTs; } } } const finalRecord = { ...recordData, id: recordId, profileId: state.activeProfileId, timestamp: timestamp }; let newState: AppState; if (editRecord) newState = { ...state, records: state.records.map(r => r.id === editRecord.id ? finalRecord : r) }; else newState = { ...state, records: [...state.records, finalRecord] }; if(!editRecord) setLastSavedRecord(finalRecord); setState(newState); setShowRecordModal(false); setShowSuccessModal(true); if (state.pin && !state.isOfflineMode) { await pushToCloud({ records: [finalRecord] }, state.pin); setPendingItems(prev => prev + 1); setTimeout(() => performPullSync(state.pin), 500); } };
  
  const verifyPin = async () => { 
      let isValid = false; 
      if (pinInput === state.pin) isValid = true; 
      else { if (isOnline && !state.isOfflineMode) { const serverValid = await checkPinOnServer(pinInput); if (serverValid) { isValid = true; setState(prev => ({ ...prev, pin: pinInput })); } } } 
      
      if (isValid) { 
          setShowPinModal(false); 
          setPinInput('');
          if (targetId) {
              const doDelete = async (type: any, id: string) => {
                  if (state.pin && !state.isOfflineMode) { await deleteFromCloud(type, id, state.pin); setPendingItems(prev => prev + 1); }
              }
              if (securityAction === 'delete_record') { 
                  const newState = { ...state, records: state.records.filter(r => r.id !== targetId) }; 
                  setState(newState); setSelectedRecord(null); 
                  await doDelete('record', targetId);
                  showToast("Record Dihapus");
              } else if (securityAction === 'delete_profile') { 
                  const newProfiles = state.profiles.filter(p => p.id !== targetId); 
                  const newState = { ...state, profiles: newProfiles, records: state.records.filter(r => r.profileId !== targetId), activeProfileId: newProfiles[0]?.id || null }; 
                  setState(newState); 
                  await doDelete('profile', targetId);
                  showToast("Profil Dihapus");
              } else if (securityAction === 'delete_reminder') {
                  const newReminders = state.reminders?.filter(r => r.id !== targetId);
                  setState(prev => ({ ...prev, reminders: newReminders }));
                  await doDelete('reminder', targetId);
                  showToast("Pengingat Dihapus");
              } else if (securityAction === 'delete_target') {
                  const newTargets = state.targets?.filter(t => t.id !== targetId);
                  setState(prev => ({ ...prev, targets: newTargets }));
                  await doDelete('target', targetId);
                  showToast("Target Dihapus");
              } else if (securityAction === 'delete_cycle') {
                  const newCycles = state.menstrualCycles?.filter(c => c.id !== targetId);
                  setState(prev => ({ ...prev, menstrualCycles: newCycles }));
                  await doDelete('cycle', targetId);
                  showToast("Data Siklus Dihapus");
              }
          }
      } else { 
          showToast("PIN Salah!", "error"); setPinInput(''); 
      } 
  };

  const confirmImport = async () => { if(!importPreview) return; setGlobalLoading("Mengimpor & Menggabungkan Data..."); const newState = { ...importPreview, pin: state.pin, isOfflineMode: state.isOfflineMode }; if (state.pin && !state.isOfflineMode) { await pushToCloud({ profiles: importPreview.profiles, records: importPreview.records, vaccines: importPreview.vaccines, milestones: importPreview.milestones }, state.pin); await performPullSync(state.pin); showToast("Data Diimpor & Masuk Antrian Sync!"); } else { setState(newState); showToast("Data Berhasil Diimpor (Lokal)"); } setGlobalLoading(null); setImportPreview(null); };
  const handleDirectLogin = async () => { if (!pinInput) return; setGlobalLoading("Verifikasi & Mengunduh Data..."); const isValid = await checkPinOnServer(pinInput); if (isValid) { const cloudState = await pullFromCloud(pinInput); if (cloudState) { const hasProfiles = cloudState.profiles && cloudState.profiles.length > 0; const newActiveId = hasProfiles ? cloudState.profiles[0].id : null; const fixRecords = (recs: any[]) => recs.map(r => { if(!r.timestamp) { const t = r.time || "23:59"; return {...r, timestamp: new Date(`${r.date}T${t}`).getTime() }; } return r; }); setState({ ...state, pin: pinInput, profiles: cloudState.profiles, records: fixRecords(cloudState.records), vaccines: cloudState.vaccines, milestones: cloudState.milestones, targets: cloudState.targets || [], reminders: cloudState.reminders || [], menstrualCycles: cloudState.menstrualCycles || [], activeProfileId: newActiveId, lastSyncTime: Date.now() }); saveState(state); setShowLoginModal(false); setPinInput(''); showToast("Berhasil Masuk & Data Tersinkron!", "success"); } else { showToast("PIN Benar tapi Gagal Sync Data.", "warning"); } } else { showToast("PIN Salah.", "error"); } setGlobalLoading(null); };
  const handlePinUpdate = async (newPin: string, oldPin: string): Promise<boolean> => { const success = await updatePinOnServer(newPin, oldPin); if (success) { setState(prev => ({ ...prev, pin: newPin, lastSyncTime: Date.now() })); savePinRecovery(newPin); showToast("PIN Berhasil Diupdate!", "success"); return true; } else { showToast("PIN Lama Salah atau Server Error", "error"); return false; } };
  
  // --- UPDATED TARGET LOGIC (Supports Edit) ---
  const handleSaveTarget = async () => {
      if(!targetValue || !state.activeProfileId) return;
      
      const newTargetValue = parseFloat(targetValue);
      let updatedTargets: Target[];
      let targetToPush: Target;

      if (editingTarget) {
          // Edit Mode
          targetToPush = { ...editingTarget, field: targetField, targetValue: newTargetValue };
          updatedTargets = (state.targets || []).map(t => t.id === editingTarget.id ? targetToPush : t);
      } else {
          // Create Mode
          targetToPush = { id: generateId(), profileId: state.activeProfileId, field: targetField, targetValue: newTargetValue };
          updatedTargets = [...(state.targets||[]), targetToPush];
      }

      setState(prev => ({...prev, targets: updatedTargets}));
      setShowTargetModal(false);
      setTargetValue('');
      setEditingTarget(null);

      if(state.pin && !state.isOfflineMode) {
          await pushToCloud({ targets: [targetToPush] }, state.pin);
          setPendingItems(prev => prev + 1);
      }
  };

  const checkTargets = (record: any) => { if(!state.activeProfileId) return; (state.targets || []).filter(t => t.profileId === state.activeProfileId).forEach(t => { const val = record[t.field]; if(val && val >= t.targetValue) setTargetAlert({ message: `Target ${METRIC_LABELS[t.field]} (${t.targetValue}) Tercapai! Nilai: ${val}`, type: 'success', targetId: t.id }); }); };
  const handleUpdateCycle = async (cycle: MenstrualCycle) => { setState(prev => { const cycles = prev.menstrualCycles || []; const existing = cycles.find(c => c.id === cycle.id); let newCycles; if (existing) { newCycles = cycles.map(c => c.id === cycle.id ? cycle : c); } else { newCycles = [...cycles, cycle]; } return { ...prev, menstrualCycles: newCycles }; }); if(state.pin && !state.isOfflineMode) { await pushToCloud({ menstrualCycles: [cycle] }, state.pin); setPendingItems(prev => prev + 1); } };
  const requestDeleteCycle = (id: string) => { if(!state.pin) return showToast("Set PIN dulu", "error"); setSecurityAction('delete_cycle'); setTargetId(id); setShowPinModal(true); };
  const handleTogglePregnancy = (isPregnant: boolean) => { const updatedProfiles = state.profiles.map(p => p.id === state.activeProfileId ? { ...p, isPregnant } : p); setState(prev => ({ ...prev, profiles: updatedProfiles })); if (state.pin && !state.isOfflineMode) { pushToCloud({ profiles: updatedProfiles }, state.pin); setPendingItems(prev => prev + 1); } };
  const handleAddReminder = async (reminder: Reminder) => { setState(prev => ({ ...prev, reminders: [...(prev.reminders || []), reminder] })); if(state.pin && !state.isOfflineMode) { await pushToCloud({ reminders: [reminder] }, state.pin); setPendingItems(prev => prev + 1); } };
  const handleUpdateRemindersList = async (updatedReminders: Reminder[]) => { const oldReminders = state.reminders || []; setState(prev => ({ ...prev, reminders: updatedReminders })); if(state.pin && !state.isOfflineMode) { const changed = updatedReminders.filter(r => { const old = oldReminders.find(o => o.id === r.id); return !old || JSON.stringify(old) !== JSON.stringify(r); }); if(changed.length > 0) { await pushToCloud({ reminders: changed }, state.pin); setPendingItems(prev => prev + 1); } } };
  const requestDeleteReminder = (id: string) => { if(!state.pin) return showToast("Set PIN dulu", "error"); setSecurityAction('delete_reminder'); setTargetId(id); setShowPinModal(true); };
  const requestDeleteTarget = (id: string) => { if(!state.pin) return showToast("Set PIN dulu", "error"); setSecurityAction('delete_target'); setTargetId(id); setShowPinModal(true); };
  const handleToggleOfflineMode = () => { const newStatus = !state.isOfflineMode; setState(prev => ({ ...prev, isOfflineMode: newStatus })); showToast(newStatus ? "Mode Offline Diaktifkan (Hemat Data)" : "Mode Online (Auto Sync)", "info"); if (!newStatus && navigator.onLine && state.pin) { setTimeout(() => performPullSync(state.pin), 500); } };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const fileReader = new FileReader(); if(e.target.files && e.target.files[0]) { fileReader.readAsText(e.target.files[0], "UTF-8"); fileReader.onload = (event) => { try { const parsed = JSON.parse(event.target?.result as string); if(parsed.profiles) { setImportPreview(parsed); } else { showToast("Format file tidak valid", "error"); } } catch(err) { showToast("File rusak atau tidak valid", "error"); } }; e.target.value = ''; } };
  const handleExport = () => { setGlobalLoading("Menyiapkan Backup..."); setTimeout(() => { exportData(state); setGlobalLoading(null); showToast("File Backup Didownload"); }, 1000); };
  const handlePDFExport = () => { const profile = state.profiles.find(p => p.id === state.activeProfileId); if (!profile) { showToast("Pilih profil terlebih dahulu", "error"); return; } setGlobalLoading("Membuat PDF..."); setTimeout(() => { const profileRecords = state.records.filter(r => r.profileId === profile.id); const profileVaccines = state.vaccines?.filter(v => v.profileId === profile.id); generatePDF(profile, profileRecords, profileVaccines); setGlobalLoading(null); showToast("PDF Berhasil Dibuat"); }, 500); };
  const handleHardResetTrigger = () => { setShowSettingsModal(false); setTimeout(() => setShowResetPinModal(true), 300); };
  const verifyResetPin = async () => { setGlobalLoading("Verifikasi PIN..."); let isValid = false; if (pinInput === state.pin || pinInput === "0000") isValid = true; else { const serverValid = await checkPinOnServer(pinInput); if (serverValid) isValid = true; } setGlobalLoading(null); if (isValid) { setShowResetPinModal(false); setPinInput(''); setShowResetConfirmModal(true); } else { showToast("PIN Salah.", "error"); } };
  const executeHardReset = async () => { setGlobalLoading("Mereset Aplikasi..."); localStorage.removeItem('FAMHEALTH_DATA_V1'); localStorage.removeItem('LAVI_SYNC_QUEUE'); setState(initialState); setGlobalLoading(null); setShowResetConfirmModal(false); showToast("Aplikasi direset.", "success"); setTimeout(() => window.location.reload(), 1500); };

  if (!isLoaded) return null;
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
  const strictSortedRecords = state.records.filter(r => r.profileId === state.activeProfileId).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (!state.profiles || state.profiles.length === 0) { return ( <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"> {globalLoading && <LoadingOverlay message={globalLoading} />} <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence> <ConfirmationModal isOpen={!!importPreview} title="Konfirmasi Import Data" message={importPreview ? `File mengandung ${importPreview.profiles?.length} profil. Lanjutkan?` : ""} confirmText="Ya, Import & Sync" onConfirm={confirmImport} onCancel={() => setImportPreview(null)} /> <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Masuk / Sinkronisasi"> <div className="space-y-4"> <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Masukkan PIN Aplikasi dari Google Apps Script.</p> <Input label="PIN" type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="text-center" /> <Button onClick={handleDirectLogin} className="w-full">Masuk & Sync</Button> </div> </Modal> <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center space-y-6"> <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto text-emerald-600"><Activity size={40} /></div> <div><h1 className="text-3xl font-bold mb-1"><span className="text-emerald-500">Lavi</span> <span className="text-blue-500">Growth</span></h1></div> <div className="text-left space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700"> {state.pin ? <div className="p-2 mb-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg text-center font-semibold">Login Berhasil! Buat profil pertama.</div> : null} <Input label="Nama" value={profileName} onChange={e => setProfileName(e.target.value)} /> <Input label="Tgl Lahir" type="date" value={profileDob} onChange={e => setProfileDob(e.target.value)} /> <div className="flex flex-col gap-1.5"> <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Kategori</label> <select className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4" value={profileType} onChange={(e) => setProfileType(e.target.value as ProfileType)}>{Object.values(ProfileType).map(t => <option key={t} value={t}>{t}</option>)}</select> </div> <div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" checked={profileGender === 'Male'} onChange={() => setProfileGender('Male')} /> Pria</label><label className="flex items-center gap-2"><input type="radio" checked={profileGender === 'Female'} onChange={() => setProfileGender('Female')} /> Wanita</label></div> {!showWelcomeAvatar ? <button onClick={() => setShowWelcomeAvatar(true)} className="w-full mt-2 py-3 border border-dashed rounded-xl text-sm flex justify-center gap-2"><IconImage size={16} /> Pilih Avatar</button> : <AvatarSelector selected={profileAvatar} onSelect={setProfileAvatar} />} </div> <div className="space-y-3"> <Button onClick={handleProfileSubmit} className="w-full">Buat Profil Pertama</Button> {!state.pin && ( <> <div className="relative flex items-center py-2"><div className="flex-grow border-t"></div><span className="mx-4 text-xs text-gray-400">ATAU</span><div className="flex-grow border-t"></div></div> <div className="grid grid-cols-2 gap-3"> <Button variant="secondary" onClick={() => setShowLoginModal(true)} className="text-sm"><Cloud size={16} /> Masuk / Sync</Button> <label className="relative w-full bg-white border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl py-2 font-medium flex items-center justify-center gap-2 cursor-pointer text-sm"><Upload size={16} /> Restore File<input type="file" onChange={handleFileSelect} className="hidden" accept=".json,application/json" /></label> </div> </> )} {state.pin && ( <label className="relative w-full bg-white border-2 border-dashed border-gray-200 text-gray-600 rounded-xl py-2 font-medium flex items-center justify-center gap-2 cursor-pointer text-sm mt-2"><Upload size={16} /> Import Backup File (JSON)<input type="file" onChange={handleFileSelect} className="hidden" accept=".json,application/json" /></label> )} </div> </div> </div> ); }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {globalLoading && <LoadingOverlay message={globalLoading} />}
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
      {!isOnline && ( <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"> <WifiOff size={14} /> Offline (No Internet) </div> )}
      {state.isOfflineMode && ( <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"> <Lock size={14} /> Mode Offline Aktif </div> )}
      {pendingItems > 0 && isOnline && !state.isOfflineMode && ( <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"> <RefreshCw size={14} className="animate-spin" /> Menyinkronkan {pendingItems} item... </div> )}
      <ConfirmationModal isOpen={!!importPreview} title="Konfirmasi Import" message={importPreview ? `File mengandung ${importPreview.profiles?.length} profil. Lanjutkan?` : ""} confirmText="Ya, Import & Sync" onConfirm={confirmImport} onCancel={() => setImportPreview(null)} />
      {targetAlert && ( <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"> <div className="bg-white p-6 rounded-2xl max-w-sm text-center"> <h3 className="text-xl font-bold mb-2">Target Tercapai!</h3> <p className="mb-4">{targetAlert.message}</p> <Button variant="secondary" onClick={() => setTargetAlert(null)} className="flex-1">Tutup</Button> </div> </div> )}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Berhasil Disimpan!"> <div className="text-center space-y-4"> <CheckCircle size={48} className="text-emerald-500 mx-auto" /> <p>Data kesehatan berhasil dicatat.</p> {pendingItems > 0 && !state.isOfflineMode && <p className="text-xs text-gray-500">Menunggu sinkronisasi ke cloud ({pendingItems} antrian)...</p>} <Button onClick={() => setShowSuccessModal(false)} className="w-full">Tutup</Button> </div> </Modal>

      <Sidebar 
        profiles={state.profiles}
        activeProfileId={state.activeProfileId}
        activeTab={activeTab}
        mobileMenuOpen={mobileMenuOpen}
        onSelectProfile={(id) => setState({...state, activeProfileId: id})}
        onEditProfile={(p) => { setEditingProfileId(p.id); setProfileName(p.name); setProfileType(p.type); setProfileDob(p.dob); setProfileGender(p.gender); setProfileAvatar(p.avatar||''); setShowProfileModal(true); }}
        onDeleteProfile={(p) => { if(!state.pin) return showToast("Set PIN dulu", "error"); setSecurityAction('delete_profile'); setTargetId(p.id); setShowPinModal(true); }}
        onAddProfile={() => { resetProfileForm(); setShowProfileModal(true); }}
        onTabChange={setActiveTab}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative h-screen" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {pullY > 0 && <div className="absolute top-4 left-0 right-0 flex justify-center z-50"><div className="bg-white p-2 rounded-full shadow-lg text-emerald-500"><RefreshCw size={24} /></div></div>}
        <Header activeProfile={activeProfile} darkMode={state.darkMode} currentDateTime={currentDateTime} toggleTheme={() => setState(prev => ({...prev, darkMode: !prev.darkMode}))} onOpenSettings={() => setShowSettingsModal(true)} onExportPDF={handlePDFExport} onManualSync={handleManualSync} isSyncing={isSyncing || pendingItems > 0} lastSyncTime={state.lastSyncTime} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
          <AnimatePresence mode="wait">
             <motion.div key={activeProfile?.id + activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && activeProfile && 
                  <DashboardView 
                    activeProfile={activeProfile} 
                    profiles={state.profiles}
                    activeRecords={state.records.filter(r => r.profileId === state.activeProfileId)} 
                    activeTargets={(state.targets || []).filter(t => t.profileId === state.activeProfileId)}
                    activeReminders={state.reminders?.filter(r => !r.profileId || r.profileId === state.activeProfileId) || []}
                    activeMenstrualCycles={(state.menstrualCycles || []).filter(c => c.profileId === state.activeProfileId)}
                    onUpdateCycle={handleUpdateCycle} onDeleteCycle={requestDeleteCycle} onTogglePregnancy={handleTogglePregnancy} onAddReminder={handleAddReminder} onBirth={handleBirth} lastRecord={strictSortedRecords[0]} onTabChange={setActiveTab} onSelectRecord={setSelectedRecord} 
                    onShowTargetModal={() => { setEditingTarget(null); setTargetValue(''); setShowTargetModal(true); }}
                    onDeleteTarget={requestDeleteTarget}
                    onEditProfile={(p) => { setEditingProfileId(p.id); setProfileName(p.name); setProfileType(p.type); setProfileDob(p.dob); setProfileGender(p.gender); setProfileAvatar(p.avatar||''); setShowProfileModal(true); }}
                    onEditTarget={(t) => { setEditingTarget(t); setTargetField(t.field); setTargetValue(String(t.targetValue)); setShowTargetModal(true); }}
                  />}
                {activeTab === 'journal' && activeProfile && <JournalView profile={activeProfile} vaccines={(state.vaccines || []).filter(v => v.profileId === state.activeProfileId)} milestones={(state.milestones || []).filter(m => m.profileId === state.activeProfileId)} onUpdateVaccine={async (v) => { const n = {...state, vaccines:[...(state.vaccines||[]), v]}; setState(n); if(state.pin && !state.isOfflineMode) { await pushToCloud({vaccines: [v]}, state.pin); setState(prev => ({...prev, lastSyncTime: Date.now()})); } }} onUpdateMilestone={async (m) => { const n = {...state, milestones:[...(state.milestones||[]), m]}; setState(n); if(state.pin && !state.isOfflineMode) { await pushToCloud({milestones: [m]}, state.pin); setState(prev => ({...prev, lastSyncTime: Date.now()})); } }} />}
                {activeTab === 'reminders' && <RemindersView reminders={state.reminders || []} profiles={state.profiles} onUpdateReminders={handleUpdateRemindersList} onDeleteReminder={requestDeleteReminder} />}
                {activeTab === 'stats' && activeProfile && <StatsView records={state.records} profiles={state.profiles} activeProfile={activeProfile} onRecordSelect={(r) => setSelectedRecord(r)} />}
                {activeTab === 'data' && <DataTableView records={state.records} profiles={state.profiles} activeProfileId={state.activeProfileId} onRecordClick={(r) => setSelectedRecord(r)} />}
                {activeTab === 'gallery' && <GalleryView records={state.records} profiles={state.profiles} activeProfileId={state.activeProfileId} onImageClick={(url, r) => setSelectedGalleryImage({ url, record: r })} />}
                {activeTab === 'articles' && <ArticlesView />}
                {activeTab === 'dictionary' && <HealthDictionaryView />}
                {activeTab === 'help' && <HelpGuideView />}
             </motion.div>
          </AnimatePresence>
        </main>
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} onAddRecord={() => { setEditRecord(undefined); setShowRecordModal(true); }} />
      </div>

      <DailyBriefingModal isOpen={showDailyBriefing} onClose={() => setShowDailyBriefing(false)} profiles={state.profiles} reminders={state.reminders || []} cycles={state.menstrualCycles || []} />

      <Modal isOpen={showTargetModal} onClose={() => setShowTargetModal(false)} title={editingTarget ? "Edit Target" : "Set Target"}>
          <div className="space-y-4">
              <select className="w-full bg-gray-50 border rounded-xl p-2" value={targetField} onChange={e => setTargetField(e.target.value)} disabled={!!editingTarget}>
                  {Object.entries(METRIC_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Input label="Nilai Target" type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
              <Button onClick={handleSaveTarget} className="w-full">Simpan</Button>
          </div>
      </Modal>
      
      <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title="Catat Kesehatan">{activeProfile && <RecordForm key={editRecord?.id || 'new'} profile={activeProfile} initialData={editRecord} lastRecord={state.records.filter(r => r.profileId === activeProfile.id).sort((a,b) => b.timestamp - a.timestamp)[0]} onSubmit={handleSaveRecord} onCancel={() => setShowRecordModal(false)} />}</Modal>
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Detail"> <RecordDetail record={selectedRecord!} onEdit={() => { setSelectedRecord(null); setEditRecord(selectedRecord!); setShowRecordModal(true); }} onDelete={() => { if(!state.pin) return showToast("Set PIN dulu", "error"); setSecurityAction('delete_record'); setTargetId(selectedRecord!.id); setShowPinModal(true); }} /> </Modal>
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title={editingProfileId ? "Edit Profil" : "Profil Baru"}> <div className="space-y-4"> <Input label="Nama" value={profileName} onChange={e => setProfileName(e.target.value)} /> <Input label={profileType === ProfileType.PREGNANCY ? "Tanggal HPHT" : "Tanggal Lahir"} type="date" value={profileDob} onChange={e => setProfileDob(e.target.value)} /> <div className="flex flex-col gap-1.5"> <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Kategori</label> <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-4 outline-none" value={profileType} onChange={(e) => setProfileType(e.target.value as ProfileType)}> {Object.values(ProfileType).map(t => <option key={t} value={t}>{t}</option>)} </select> </div> <div className="flex gap-4"> <label className="flex items-center gap-2"><input type="radio" checked={profileGender === 'Male'} onChange={() => setProfileGender('Male')} /> Pria</label> <label className="flex items-center gap-2"><input type="radio" checked={profileGender === 'Female'} onChange={() => setProfileGender('Female')} /> Wanita</label> </div> <AvatarSelector selected={profileAvatar} onSelect={setProfileAvatar} /> <Button onClick={handleProfileSubmit} className="w-full">Simpan Profil</Button> </div> </Modal>
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        hasPin={!!state.pin} 
        onUpdatePin={handlePinUpdate} 
        onExportBackup={handleExport} 
        onImportBackup={handleFileSelect} 
        onExportExcel={() => { setGlobalLoading("Exporting..."); setTimeout(() => { exportToExcel(state); setGlobalLoading(null); }, 1000); }} 
        onExportPDF={handlePDFExport} 
        onTriggerHardReset={handleHardResetTrigger} 
        onShowToast={showToast} 
        isOfflineMode={state.isOfflineMode} 
        onToggleOfflineMode={handleToggleOfflineMode}
        onOpenDatabaseSetup={() => {
          setShowSettingsModal(false);
          setShowDbSetupModal(true);
        }}
      />
      <DatabaseSetupModal
        isOpen={showDbSetupModal}
        onClose={() => setShowDbSetupModal(false)}
        onShowToast={showToast}
        onSuccess={(newCfg) => {
          setState(prev => ({ ...prev, dbConfig: newCfg }));
          showToast(`Database aktif diubah ke ${newCfg.provider === 'supabase' ? 'Supabase' : 'Google Spreadsheet'}`, 'success');
        }}
        onMigrateData={async () => {
          if (!state.pin) {
            showToast("Silakan tentukan PIN keamanan terlebih dahulu di menu Pengaturan.", "warning");
            return;
          }
          setGlobalLoading("Menyinkronkan data lokal ke database baru...");
          try {
            await pushToCloud({
              profiles: state.profiles,
              records: state.records,
              vaccines: state.vaccines,
              milestones: state.milestones,
              targets: state.targets,
              reminders: state.reminders,
              menstrualCycles: state.menstrualCycles
            }, state.pin);
            setState(prev => ({ ...prev, lastSyncTime: Date.now() }));
            showToast("Semua data berhasil disinkronkan ke database baru!", "success");
          } catch (e) {
            showToast("Gagal menyinkronkan data", "error");
          } finally {
            setGlobalLoading(null);
          }
        }}
      />
      <Modal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPinInput(''); }} title="Masukkan PIN"> <div className="space-y-4"> <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Masukkan PIN keamanan untuk konfirmasi penghapusan data.</p> <Input label="PIN" type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="text-center tracking-widest text-lg" autoFocus /> <Button onClick={verifyPin} className="w-full">Verifikasi & Hapus</Button> </div> </Modal>
      <Modal isOpen={showResetPinModal} onClose={() => { setShowResetPinModal(false); setPinInput(''); }} title="Reset Aplikasi"> <div className="space-y-4"> <p className="text-sm text-red-500 font-bold text-center">Area Berbahaya!</p> <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Masukkan PIN untuk mereset aplikasi (Hapus Data Lokal).</p> <Input label="PIN" type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="text-center tracking-widest text-lg" autoFocus /> <Button variant="danger" onClick={verifyResetPin} className="w-full">Lanjut</Button> </div> </Modal>
      <ConfirmationModal isOpen={showResetConfirmModal} type="danger" title="Konfirmasi Reset Total" message="Semua data lokal akan dihapus dan aplikasi kembali ke pengaturan awal. Pastikan sudah backup!" confirmText="Ya, Reset Total" onConfirm={executeHardReset} onCancel={() => setShowResetConfirmModal(false)} />
    </div>
  );
}

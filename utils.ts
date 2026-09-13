
import { AppState, HealthRecord, Profile, ProfileType, MenstrualCycle, Gender } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS } from './data/medicalData';
import { clearAppStateDb, clearQueueDb, loadAppStateFromDb, saveAppStateToDb } from './services/localDb';

const LEGACY_STORAGE_KEY = 'FAMHEALTH_DATA_V1';
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

// --- DYNAMIC THEME HELPER (Gender & Type Specific) ---
export const getProfileTheme = (type: ProfileType | undefined, gender: Gender = 'Male') => {
    // 1. Special Case: Pregnancy is always specialized Pink
    if (type === ProfileType.PREGNANCY) {
        return {
            primary: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-500',
            bgLight: 'bg-pink-50 dark:bg-pink-900/20',
            border: 'border-pink-200 dark:border-pink-800',
            ring: 'focus:ring-pink-500/20',
            hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
            gradient: 'from-pink-500 to-rose-500',
            name: 'pink'
        };
    }

    // 2. Gender Based Logic within Types
    switch (type) {
        case ProfileType.BABY:
            if (gender === 'Female') {
                return {
                    primary: 'text-rose-500 dark:text-rose-400',
                    bg: 'bg-rose-500',
                    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
                    border: 'border-rose-200 dark:border-rose-800',
                    ring: 'focus:ring-rose-500/20',
                    hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/30',
                    gradient: 'from-rose-400 to-pink-500',
                    name: 'rose'
                };
            }
            return {
                primary: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-500',
                bgLight: 'bg-sky-50 dark:bg-sky-900/20',
                border: 'border-sky-200 dark:border-sky-800',
                ring: 'focus:ring-sky-500/20',
                hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/30',
                gradient: 'from-sky-400 to-blue-500',
                name: 'sky'
            };

        case ProfileType.CHILD:
            if (gender === 'Female') {
                return {
                    primary: 'text-teal-600 dark:text-teal-400',
                    bg: 'bg-teal-500',
                    bgLight: 'bg-teal-50 dark:bg-teal-900/20',
                    border: 'border-teal-200 dark:border-teal-800',
                    ring: 'focus:ring-teal-500/20',
                    hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/30',
                    gradient: 'from-teal-400 to-emerald-500',
                    name: 'teal'
                };
            }
            return {
                primary: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-500',
                bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
                border: 'border-emerald-200 dark:border-emerald-800',
                ring: 'focus:ring-emerald-500/20',
                hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
                gradient: 'from-emerald-400 to-green-500',
                name: 'emerald'
            };

        case ProfileType.ADULT:
            if (gender === 'Female') {
                return {
                    primary: 'text-purple-600 dark:text-purple-400',
                    bg: 'bg-purple-600',
                    bgLight: 'bg-purple-50 dark:bg-purple-900/20',
                    border: 'border-purple-200 dark:border-purple-800',
                    ring: 'focus:ring-purple-500/20',
                    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
                    gradient: 'from-purple-500 to-fuchsia-600',
                    name: 'purple'
                };
            }
            return {
                primary: 'text-indigo-600 dark:text-indigo-400',
                bg: 'bg-indigo-600',
                bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
                border: 'border-indigo-200 dark:border-indigo-800',
                ring: 'focus:ring-indigo-500/20',
                hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
                gradient: 'from-indigo-500 to-blue-600',
                name: 'indigo'
            };

        case ProfileType.SENIOR:
            if (gender === 'Female') {
                return {
                    primary: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-500',
                    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    ring: 'focus:ring-amber-500/20',
                    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
                    gradient: 'from-amber-400 to-orange-500',
                    name: 'amber'
                };
            }
            return {
                primary: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-600',
                bgLight: 'bg-slate-100 dark:bg-slate-800',
                border: 'border-slate-200 dark:border-slate-700',
                ring: 'focus:ring-slate-500/20',
                hover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
                gradient: 'from-slate-500 to-gray-600',
                name: 'slate'
            };

        default:
            return {
                primary: 'text-gray-600 dark:text-gray-400',
                bg: 'bg-gray-500',
                bgLight: 'bg-gray-50 dark:bg-gray-800',
                border: 'border-gray-200 dark:border-gray-700',
                ring: 'focus:ring-gray-500/20',
                hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
                gradient: 'from-gray-500 to-slate-500',
                name: 'gray'
            };
    }
};

// --- CALCULATORS ---

export const calculateBMI = (weightKg: number, heightCm: number) => {
    // Prevent Division by Zero or missing height
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    
    // Safety check against Infinity
    if (!isFinite(bmi)) return null;

    let status = 'Normal';
    let color = 'text-green-500';
    
    if (bmi < 18.5) { 
        status = 'Kurus (Under)'; 
        color = 'text-blue-500'; 
    }
    else if (bmi >= 18.5 && bmi < 25) { 
        status = 'Normal (Ideal)'; 
        color = 'text-emerald-500'; 
    }
    else if (bmi >= 25 && bmi < 30) { 
        status = 'Berat Berlebih'; // Wording diperhalus
        color = 'text-orange-500'; 
    }
    else { 
        status = 'Obesitas'; 
        color = 'text-red-500'; 
    }

    return { value: bmi.toFixed(1), status, color };
};

export const calculateGrowthStatus = (weight: number, dob: string, gender: 'Male' | 'Female') => {
    const ageMonths = getAgeInMonths(dob);
    if (ageMonths > 60) return null; // WHO data only up to 5 years here

    const table = gender === 'Male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
    // Find closest month
    const ref = table.reduce((prev, curr) => 
        Math.abs(curr.month - ageMonths) < Math.abs(prev.month - ageMonths) ? curr : prev
    );

    let status = 'Gizi Baik';
    let color = 'text-emerald-500';

    if (weight < ref.p3) { status = 'Gizi Kurang'; color = 'text-red-500'; }
    else if (weight > ref.p97) { status = 'Gizi Lebih'; color = 'text-orange-500'; }
    else { status = 'Gizi Baik (Normal)'; color = 'text-emerald-500'; }

    return { status, color, ideal: ref.p50 };
};

// --- Menstrual Logic Helpers (Adaptive) ---
export const calculateCycleStats = (cycles: MenstrualCycle[]) => {
    // Default fallback
    const defaultStats = { avgLength: 28, isIrregular: false, historyCount: cycles ? cycles.length : 0, avgDuration: 5 };

    if (!cycles || cycles.length < 2) {
        return defaultStats;
    }

    // Sort by start date ascending
    const sorted = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    // Take last 7 cycles for calculation
    const recent = sorted.slice(-7); 
    
    let totalDays = 0;
    let count = 0;
    let lengths: number[] = [];
    
    // Calculate Average Duration (Bleeding length)
    let totalDuration = 0;
    let durationCount = 0;

    recent.forEach(c => {
        if(c.endDate) {
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            const dur = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            // Filter realistic duration (2-10 days)
            if(dur >= 2 && dur <= 10) {
                totalDuration += dur;
                durationCount++;
            }
        }
    });
    
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 5;

    // Calculate Cycle Length
    for (let i = 0; i < recent.length - 1; i++) {
        const startCurrent = new Date(recent[i].startDate);
        const startNext = new Date(recent[i+1].startDate);
        const diffTime = Math.abs(startNext.getTime() - startCurrent.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Filter out absurdly short/long cycles (noise filtering)
        if (diffDays > 15 && diffDays < 60) {
            totalDays += diffDays;
            lengths.push(diffDays);
            count++;
        }
    }

    if (count === 0) return { ...defaultStats, avgDuration };

    const avgLength = Math.round(totalDays / count);
    
    // Check irregularity: variation > 5 days or length outside 21-35 range
    const isIrregular = lengths.some(l => l < 21 || l > 35) || (Math.max(...lengths) - Math.min(...lengths) > 5);

    return { avgLength, isIrregular, historyCount: count, avgDuration };
};

export const savePinRecovery = (pin: string) => {
  // 1. Create content
  const content = `PIN Lavi Growth Tracker Anda: ${pin}\n\nSimpan file ini di tempat aman.`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  
  // 2. Trigger Download
  const url = URL.createObjectURL(blob);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", url);
  downloadAnchorNode.setAttribute("download", "PIN_LaviGrowth.txt");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  URL.revokeObjectURL(url);
};

export const exportData = (state: AppState) => {
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

export const exportToExcel = (state: AppState) => {
  // 1. Define Headers (Columns)
  const headers = [
    "Tanggal", "Jam", "Nama Profil", "Tipe", "Gender", "Usia Saat Record",
    "Berat (kg)", "Tinggi/Panjang (cm)", "Suhu (C)", "Detak Jantung (bpm)",
    "Sistolik", "Diastolik", "Gula Darah", 
    "Lingkar Kepala", "Lingkar Dada", 
    "Usia Kandungan (mg)", "Lingkar Perut Ibu", "Gerakan Janin",
    "Catatan", "Gejala"
  ];

  // 2. Map Data to Rows
  const rows = state.records.map(r => {
    const profile = state.profiles.find(p => p.id === r.profileId);
    
    // Helper to sanitize string for CSV (escape quotes)
    const escapeCsv = (str: string | undefined) => {
      if (!str) return '';
      return `"${str.replace(/"/g, '""')}"`;
    };

    return [
      r.date, 
      r.time || '', 
      escapeCsv(profile?.name), 
      profile?.type || '', 
      profile?.gender || '',
      profile ? calculateDetailedAge(profile.dob, profile.type) : '', // Approximate age at current time
      r.weight || '',
      r.height || '',
      r.temperature || '',
      r.heartRate || '',
      r.systolicBP || '',
      r.diastolicBP || '',
      r.bloodSugar || '',
      r.headCircumference || '',
      r.chestCircumference || '',
      r.gestationalAge || '',
      r.bellyCircumference || '',
      r.fetalMovement || '',
      escapeCsv(r.notes),
      escapeCsv((r.symptoms || []).join(', '))
    ].join(',');
  });

  // 3. Combine Headers and Rows with BOM for Excel UTF-8 compatibility
  const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');

  // 4. Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `LaviGrowth-Excel-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- PDF Generator ---
export const generatePDF = (profile: Profile, records: HealthRecord[], vaccines: any[] = []) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('id-ID');

  // Header
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Laporan Kesehatan", 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated by Lavi Growth Tracker on ${dateStr}`, 105, 22, { align: 'center' });

  // Profile Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Nama: ${profile.name}`, 14, 40);
  doc.text(`Tgl Lahir: ${formatDate(profile.dob)}`, 14, 46);
  doc.text(`Usia: ${calculateDetailedAge(profile.dob, profile.type)}`, 14, 52);
  doc.text(`Gender: ${profile.gender === 'Male' ? 'Laki-laki' : 'Perempuan'}`, 100, 40);
  doc.text(`Kategori: ${profile.type}`, 100, 46);

  // Recent Records Table
  const tableRows = records
    .slice(0, 20) // Limit to last 20 for one page brief
    .map(r => [
      formatDate(r.date),
      r.weight ? `${r.weight} kg` : '-',
      r.height ? `${r.height} cm` : '-',
      r.temperature ? `${r.temperature} °C` : '-',
      r.notes || r.symptoms?.join(', ') || '-'
    ]);

  autoTable(doc, {
    startY: 60,
    head: [['Tanggal', 'Berat', 'Tinggi', 'Suhu', 'Catatan/Gejala']],
    body: tableRows,
    headStyles: { fillColor: [16, 185, 129] },
    theme: 'grid'
  });

  // Vaccine Info (if exists and Child/Baby)
  if ((profile.type === ProfileType.BABY || profile.type === ProfileType.CHILD) && vaccines.length > 0) {
    let finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.text("Riwayat Vaksinasi Terakhir", 14, finalY + 15);
    
    const vaccineRows = vaccines.slice(0, 10).map(v => [
      v.vaccineName,
      formatDate(v.dateGiven),
      v.notes || '-'
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Vaksin', 'Tanggal', 'Catatan']],
      body: vaccineRows,
      headStyles: { fillColor: [59, 130, 246] }, // Blue
      theme: 'striped'
    });
  }

  doc.save(`Laporan_${profile.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};

// --- Image Helpers ---
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- Date Helpers ---
export const formatDate = (dateStr: string) => {
  // Handle different date formats or simple strings gracefully
  try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // Return original string if parse fails
      
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  } catch(e) {
      return dateStr;
  }
};

export const getAgeInMonths = (dob: string): number => {
    const birth = new Date(dob);
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += now.getMonth();
    return months <= 0 ? 0 : months;
};

export const getPregnancyWeek = (hpht: string): number => {
    try {
        const start = new Date(hpht);
        if(isNaN(start.getTime())) return 0;
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
        return weeks;
    } catch(e) {
        return 0;
    }
};

export const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const calculateDetailedAge = (dob: string, type: ProfileType): string => {
  try {
      const start = new Date(dob); // This is HPHT for pregnancy profiles
      if (isNaN(start.getTime())) return "-";
      
      const now = new Date();
      
      if (type === ProfileType.PREGNANCY) {
        // Kandungan: Hitung minggu dan hari dari HPHT (Hari Pertama Haid Terakhir)
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return "Belum mulai";
        
        const weeks = Math.floor(diffDays / 7);
        const days = diffDays % 7;
        
        // Exact format: "X Minggu Y Hari"
        return `${weeks} Minggu ${days} Hari`;
      }

      // Usia Normal (Bayi/Anak/Dewasa)
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      let days = now.getDate() - start.getDate();

      if (days < 0) {
        months--;
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      if (years === 0 && months === 0) {
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        return `${diffDays} Hari`;
      }
      if (years === 0) return `${months} Bulan`;
      if (months === 0) return `${years} Tahun`;
      return `${years} Tahun ${months} Bulan`;
  } catch (e) {
      return "-";
  }
};

// --- Relative Time Helper ---
export const getRelativeTime = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // seconds

  if (diff < 10) return 'Baru saja';
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  
  // Format Date in Indonesian Locale
  return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

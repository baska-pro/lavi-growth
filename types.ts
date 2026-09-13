
export enum ProfileType {
  PREGNANCY = 'Kandungan',
  BABY = 'Bayi',
  CHILD = 'Anak',
  ADULT = 'Dewasa',
  SENIOR = 'Orang Tua'
}

export type Gender = 'Male' | 'Female';

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  dob: string; // ISO Date (Untuk Kandungan = HPHT)
  gender: Gender;
  avatar?: string; // Base64
  themeColor?: string;
  isPregnant?: boolean; // New: Pregnancy Mode Toggle
}

export interface Target {
  id: string;
  profileId: string;
  field: string; // key from HealthRecord e.g. 'weight'
  targetValue: number;
}

// New Interface for Vaccination
export interface VaccineRecord {
  id: string;
  profileId: string;
  vaccineName: string;
  dateGiven: string;
  notes?: string;
}

// New Interface for Milestone
export interface MilestoneRecord {
  id: string;
  profileId: string;
  milestoneId: number; // ID from static data
  dateAchieved: string;
  notes?: string;
}

// New Interface for Reminders
export interface Reminder {
  id: string;
  profileId: string; // Optional: if null, global reminder
  title: string;
  time: string; // HH:mm
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  specificDate?: string; // YYYY-MM-DD (Optional for one-time events)
  active: boolean;
  type: 'medication' | 'vaccine' | 'checkup' | 'other';
}

export type MenstrualFlow = 'Light' | 'Medium' | 'Heavy' | 'Spotting';

// Updated Interface for Menstrual Cycle
export interface MenstrualCycle {
  id: string;
  profileId: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate?: string; // ISO Date YYYY-MM-DD
  flow?: MenstrualFlow; // New
  symptoms?: string[]; // New
  notes?: string;
}

export interface HealthRecord {
  id: string;
  profileId: string;
  date: string; // ISO Date
  timestamp: number;
  time?: string; // Optional Time string (HH:MM)
  
  // Common Metrics
  weight?: number; // kg
  notes?: string;
  photos?: string[]; // Array of Base64 strings

  // General Physical
  height?: number; // cm (All except pregnancy usually)
  temperature?: number; // Celsius (All)
  heartRate?: number; // bpm (All)
  systolicBP?: number; // mmHg (Adult, Senior)
  diastolicBP?: number; // mmHg (Adult, Senior)
  bloodSugar?: number; // mg/dL (Adult, Senior, Pregnancy)
  
  // Body Measurements (Baby, Child, Adult)
  headCircumference?: number; // cm (Baby, Pregnancy-USG)
  chestCircumference?: number; // cm (Baby, Child, Adult)
  chestWidth?: number; // cm (Baby, Child, Adult) - NEW
  footLength?: number; // cm (Baby, Child, Adult)
  
  // Pregnancy Specific
  gestationalAge?: number; // weeks
  bellyCircumference?: number; // cm (Ibu)
  fetalMovement?: number; // count
  
  // Pregnancy USG Data
  usg_bpd?: number; // mm (Biparietal Diameter)
  usg_ac?: number; // mm (Abdominal Circumference - Janin)
  usg_fl?: number; // mm (Femur Length)
  usg_efw?: number; // gram (Estimated Fetal Weight)
  
  // Baby/Child Specific
  sleepHours?: number; // hours
  symptoms?: string[];
}

export interface AppState {
  profiles: Profile[];
  records: HealthRecord[];
  activeProfileId: string | null;
  darkMode: boolean;
  pin?: string; // Security PIN
  targets?: Target[];
  vaccines?: VaccineRecord[]; 
  milestones?: MilestoneRecord[];
  reminders?: Reminder[];
  menstrualCycles?: MenstrualCycle[]; // New
  lastSyncTime?: number; // Timestamp of last successful sync
  isOfflineMode?: boolean; // New: Manual Offline Toggle
  dbConfig?: DatabaseConfig; // Cloud Database Provider Config
}

export type DatabaseProvider = 'gas' | 'supabase';

export interface GasConfig {
  webAppUrl: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface DatabaseConfig {
  provider: DatabaseProvider;
  gas: GasConfig;
  supabase: SupabaseConfig;
}

export const METRIC_LABELS: Record<string, string> = {
  weight: 'Berat Badan (kg)',
  height: 'Tinggi Badan (cm)',
  temperature: 'Suhu Tubuh (°C)',
  systolicBP: 'Sistolik (mmHg)',
  diastolicBP: 'Diastolik (mmHg)',
  heartRate: 'Detak Jantung (bpm)',
  bloodSugar: 'Gula Darah (mg/dL)',
  
  headCircumference: 'Lingkar Kepala (cm)',
  chestCircumference: 'Lingkar Dada (cm)',
  chestWidth: 'Lebar Dada (cm)',
  footLength: 'Panjang Telapak Kaki (cm)',
  
  gestationalAge: 'Usia Kandungan (minggu)',
  bellyCircumference: 'Lingkar Perut Ibu (cm)',
  fetalMovement: 'Gerakan Janin',
  
  usg_bpd: 'USG: BPD (mm)',
  usg_ac: 'USG: Lingkar Perut Janin (mm)',
  usg_fl: 'USG: Panjang Paha (mm)',
  usg_efw: 'USG: Taksiran Berat (g)',
  
  sleepHours: 'Durasi Tidur (jam)',
};

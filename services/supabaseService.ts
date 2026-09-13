import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Profile, HealthRecord, VaccineRecord, MilestoneRecord, Target, Reminder, MenstrualCycle, SupabaseConfig } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabaseClient = (config: SupabaseConfig): SupabaseClient | null => {
  if (!config || !config.url || !config.anonKey) return null;
  const key = `${config.url.trim()}::${config.anonKey.trim()}`;
  if (cachedClient && currentClientKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    currentClientKey = key;
    return cachedClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client", err);
    return null;
  }
};

export const testSupabaseConnection = async (config: SupabaseConfig): Promise<{ success: boolean; message: string; tablesReady?: boolean }> => {
  if (!config.url || !config.url.startsWith('https://')) {
    return { success: false, message: 'URL Supabase harus diawali dengan https://' };
  }
  if (!config.anonKey || config.anonKey.length < 20) {
    return { success: false, message: 'Anon/Public Key Supabase tidak valid.' };
  }

  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Gagal membuat Supabase client dari kredensial.' };
  }

  try {
    // Check if app_pins or profiles table is available
    const { data, error } = await client.from('app_pins').select('pin').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          tablesReady: false,
          message: 'Koneksi ke Supabase berhasil! Namun tabel database belum dibuat. Silakan salin & jalankan Skrip SQL di SQL Editor Supabase.'
        };
      }
      if (error.message?.includes('Invalid API key') || error.code === 'PGRST301') {
        return { success: false, message: `Otentikasi Supabase gagal: ${error.message}` };
      }
      // Any other database error
      return { success: false, message: `Pemeriksaan tabel gagal: ${error.message}` };
    }

    return {
      success: true,
      tablesReady: true,
      message: 'Koneksi ke Supabase aktif & tabel siap digunakan!'
    };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan ke Supabase: ${err.message || err}` };
  }
};

// --- DATA TRANSFORMERS ---

const mapRecordToDb = (r: HealthRecord, pin: string) => ({
  id: r.id,
  profile_id: r.profileId,
  date: r.date,
  timestamp: r.timestamp || Date.now(),
  time: r.time || null,
  weight: r.weight ?? null,
  height: r.height ?? null,
  temperature: r.temperature ?? null,
  heart_rate: r.heartRate ?? null,
  systolic_bp: r.systolicBP ?? null,
  diastolic_bp: r.diastolicBP ?? null,
  blood_sugar: r.bloodSugar ?? null,
  head_circumference: r.headCircumference ?? null,
  chest_circumference: r.chestCircumference ?? null,
  chest_width: r.chestWidth ?? null,
  foot_length: r.footLength ?? null,
  gestational_age: r.gestationalAge ?? null,
  belly_circumference: r.bellyCircumference ?? null,
  fetal_movement: r.fetalMovement ?? null,
  usg_bpd: r.usg_bpd ?? null,
  usg_ac: r.usg_ac ?? null,
  usg_fl: r.usg_fl ?? null,
  usg_efw: r.usg_efw ?? null,
  sleep_hours: r.sleepHours ?? null,
  symptoms: r.symptoms || [],
  photos: r.photos || [],
  notes: r.notes || null,
  pin: pin,
  updated_at: new Date().toISOString()
});

const mapDbToRecord = (row: any): HealthRecord => ({
  id: row.id,
  profileId: row.profile_id,
  date: row.date,
  timestamp: Number(row.timestamp),
  time: row.time || undefined,
  weight: row.weight != null ? Number(row.weight) : undefined,
  height: row.height != null ? Number(row.height) : undefined,
  temperature: row.temperature != null ? Number(row.temperature) : undefined,
  heartRate: row.heart_rate != null ? Number(row.heart_rate) : undefined,
  systolicBP: row.systolic_bp != null ? Number(row.systolic_bp) : undefined,
  diastolicBP: row.diastolic_bp != null ? Number(row.diastolic_bp) : undefined,
  bloodSugar: row.blood_sugar != null ? Number(row.blood_sugar) : undefined,
  headCircumference: row.head_circumference != null ? Number(row.head_circumference) : undefined,
  chestCircumference: row.chest_circumference != null ? Number(row.chest_circumference) : undefined,
  chestWidth: row.chest_width != null ? Number(row.chest_width) : undefined,
  footLength: row.foot_length != null ? Number(row.foot_length) : undefined,
  gestationalAge: row.gestational_age != null ? Number(row.gestational_age) : undefined,
  bellyCircumference: row.belly_circumference != null ? Number(row.belly_circumference) : undefined,
  fetalMovement: row.fetal_movement != null ? Number(row.fetal_movement) : undefined,
  usg_bpd: row.usg_bpd != null ? Number(row.usg_bpd) : undefined,
  usg_ac: row.usg_ac != null ? Number(row.usg_ac) : undefined,
  usg_fl: row.usg_fl != null ? Number(row.usg_fl) : undefined,
  usg_efw: row.usg_efw != null ? Number(row.usg_efw) : undefined,
  sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : undefined,
  symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
  photos: Array.isArray(row.photos) ? row.photos : [],
  notes: row.notes || undefined
});

// --- PULL ALL DATA FROM SUPABASE ---
export const pullFromSupabase = async (config: SupabaseConfig, pin: string): Promise<AppState | null> => {
  const client = getSupabaseClient(config);
  if (!client) return null;

  try {
    // Fetch in parallel for fast loading
    const [
      profilesRes,
      recordsRes,
      vaccinesRes,
      milestonesRes,
      targetsRes,
      remindersRes,
      cyclesRes
    ] = await Promise.all([
      client.from('profiles').select('*').eq('pin', pin),
      client.from('health_records').select('*').eq('pin', pin).order('timestamp', { ascending: false }),
      client.from('vaccines').select('*').eq('pin', pin),
      client.from('milestones').select('*').eq('pin', pin),
      client.from('targets').select('*').eq('pin', pin),
      client.from('reminders').select('*').eq('pin', pin),
      client.from('menstrual_cycles').select('*').eq('pin', pin)
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const profiles: Profile[] = (profilesRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      dob: p.dob,
      gender: p.gender,
      avatar: p.avatar || undefined,
      themeColor: p.theme_color || undefined,
      isPregnant: !!p.is_pregnant
    }));

    const records: HealthRecord[] = (recordsRes.data || []).map(mapDbToRecord);

    const vaccines: VaccineRecord[] = (vaccinesRes.data || []).map((v: any) => ({
      id: v.id,
      profileId: v.profile_id,
      vaccineName: v.vaccine_name,
      dateGiven: v.date_given,
      notes: v.notes || undefined
    }));

    const milestones: MilestoneRecord[] = (milestonesRes.data || []).map((m: any) => ({
      id: m.id,
      profileId: m.profile_id,
      milestoneId: m.milestone_id,
      dateAchieved: m.date_achieved,
      notes: m.notes || undefined
    }));

    const targets: Target[] = (targetsRes.data || []).map((t: any) => ({
      id: t.id,
      profileId: t.profile_id,
      field: t.field,
      targetValue: Number(t.target_value)
    }));

    const reminders: Reminder[] = (remindersRes.data || []).map((r: any) => ({
      id: r.id,
      profileId: r.profile_id || undefined,
      title: r.title,
      time: r.time,
      days: Array.isArray(r.days) ? r.days : [],
      specificDate: r.specific_date || undefined,
      active: !!r.active,
      type: r.type
    }));

    const menstrualCycles: MenstrualCycle[] = (cyclesRes.data || []).map((c: any) => ({
      id: c.id,
      profileId: c.profile_id,
      startDate: c.start_date,
      endDate: c.end_date || undefined,
      flow: c.flow || undefined,
      symptoms: Array.isArray(c.symptoms) ? c.symptoms : [],
      notes: c.notes || undefined
    }));

    return {
      profiles,
      records,
      vaccines,
      milestones,
      targets,
      reminders,
      menstrualCycles,
      activeProfileId: profiles.length > 0 ? profiles[0].id : null,
      darkMode: false,
      pin,
      lastSyncTime: Date.now()
    };
  } catch (err) {
    console.error("Supabase Pull Error:", err);
    return null;
  }
};

// --- PUSH DATA TO SUPABASE (UPSERT) ---
export const pushToSupabase = async (config: SupabaseConfig, data: Partial<AppState>, pin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;

  try {
    const promises: PromiseLike<any>[] = [];

    // Ensure PIN is registered in app_pins
    promises.push(
      client.from('app_pins').upsert({ pin, updated_at: new Date().toISOString() }, { onConflict: 'pin' })
    );

    if (data.profiles && data.profiles.length > 0) {
      const rows = data.profiles.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        dob: p.dob,
        gender: p.gender,
        avatar: p.avatar || null,
        theme_color: p.themeColor || null,
        is_pregnant: !!p.isPregnant,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('profiles').upsert(rows, { onConflict: 'id' }));
    }

    if (data.records && data.records.length > 0) {
      const rows = data.records.map(r => mapRecordToDb(r, pin));
      promises.push(client.from('health_records').upsert(rows, { onConflict: 'id' }));
    }

    if (data.vaccines && data.vaccines.length > 0) {
      const rows = data.vaccines.map(v => ({
        id: v.id,
        profile_id: v.profileId,
        vaccine_name: v.vaccineName,
        date_given: v.dateGiven,
        notes: v.notes || null,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('vaccines').upsert(rows, { onConflict: 'id' }));
    }

    if (data.milestones && data.milestones.length > 0) {
      const rows = data.milestones.map(m => ({
        id: m.id,
        profile_id: m.profileId,
        milestone_id: m.milestoneId,
        date_achieved: m.dateAchieved,
        notes: m.notes || null,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('milestones').upsert(rows, { onConflict: 'id' }));
    }

    if (data.targets && data.targets.length > 0) {
      const rows = data.targets.map(t => ({
        id: t.id,
        profile_id: t.profileId,
        field: t.field,
        target_value: t.targetValue,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('targets').upsert(rows, { onConflict: 'id' }));
    }

    if (data.reminders && data.reminders.length > 0) {
      const rows = data.reminders.map(r => ({
        id: r.id,
        profile_id: r.profileId || null,
        title: r.title,
        time: r.time,
        days: r.days || [],
        specific_date: r.specificDate || null,
        active: r.active !== false,
        type: r.type,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('reminders').upsert(rows, { onConflict: 'id' }));
    }

    if (data.menstrualCycles && data.menstrualCycles.length > 0) {
      const rows = data.menstrualCycles.map(c => ({
        id: c.id,
        profile_id: c.profileId,
        start_date: c.startDate,
        end_date: c.endDate || null,
        flow: c.flow || null,
        symptoms: c.symptoms || [],
        notes: c.notes || null,
        pin,
        updated_at: new Date().toISOString()
      }));
      promises.push(client.from('menstrual_cycles').upsert(rows, { onConflict: 'id' }));
    }

    const results = await Promise.all(promises);
    const hasError = results.some(r => r && r.error);
    if (hasError) {
      console.warn("One or more upserts had errors", results);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase Push Error:", err);
    return false;
  }
};

// --- DELETE FROM SUPABASE ---
export const deleteFromSupabase = async (
  config: SupabaseConfig,
  type: 'profile' | 'record' | 'target' | 'reminder' | 'cycle' | 'vaccine' | 'milestone',
  id: string,
  pin: string
): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;

  try {
    let tableName = '';
    switch (type) {
      case 'profile': tableName = 'profiles'; break;
      case 'record': tableName = 'health_records'; break;
      case 'vaccine': tableName = 'vaccines'; break;
      case 'milestone': tableName = 'milestones'; break;
      case 'target': tableName = 'targets'; break;
      case 'reminder': tableName = 'reminders'; break;
      case 'cycle': tableName = 'menstrual_cycles'; break;
      default: return false;
    }

    const { error } = await client.from(tableName).delete().eq('id', id).eq('pin', pin);
    return !error;
  } catch (err) {
    console.error("Supabase Delete Error:", err);
    return false;
  }
};

// --- PIN OPERATIONS ---
export const checkPinOnSupabase = async (config: SupabaseConfig, pin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;

  try {
    // 1. Check in app_pins
    const { data: pinData, error: pinErr } = await client.from('app_pins').select('pin').eq('pin', pin).maybeSingle();
    if (!pinErr && pinData) {
      return true;
    }

    // 2. Check if any profile has this pin
    const { data: profData } = await client.from('profiles').select('id').eq('pin', pin).limit(1);
    if (profData && profData.length > 0) {
      // Register in app_pins for faster subsequent lookups
      await client.from('app_pins').upsert({ pin, updated_at: new Date().toISOString() });
      return true;
    }

    // 3. If database is completely empty (no pins yet registered), allow initial pairing
    const { count } = await client.from('app_pins').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await client.from('app_pins').upsert({ pin, updated_at: new Date().toISOString() });
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const updatePinOnSupabase = async (config: SupabaseConfig, newPin: string, oldPin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;

  try {
    // Validate old PIN first
    const isValid = await checkPinOnSupabase(config, oldPin);
    if (!isValid) return false;

    // Update across all tables
    await Promise.all([
      client.from('profiles').update({ pin: newPin }).eq('pin', oldPin),
      client.from('health_records').update({ pin: newPin }).eq('pin', oldPin),
      client.from('vaccines').update({ pin: newPin }).eq('pin', oldPin),
      client.from('milestones').update({ pin: newPin }).eq('pin', oldPin),
      client.from('targets').update({ pin: newPin }).eq('pin', oldPin),
      client.from('reminders').update({ pin: newPin }).eq('pin', oldPin),
      client.from('menstrual_cycles').update({ pin: newPin }).eq('pin', oldPin),
      client.from('app_pins').delete().eq('pin', oldPin)
    ]);

    await client.from('app_pins').upsert({ pin: newPin, updated_at: new Date().toISOString() });
    return true;
  } catch (err) {
    console.error("Supabase Update PIN Error:", err);
    return false;
  }
};

export const resetSupabaseData = async (config: SupabaseConfig, pin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;

  try {
    await Promise.all([
      client.from('profiles').delete().eq('pin', pin),
      client.from('health_records').delete().eq('pin', pin),
      client.from('vaccines').delete().eq('pin', pin),
      client.from('milestones').delete().eq('pin', pin),
      client.from('targets').delete().eq('pin', pin),
      client.from('reminders').delete().eq('pin', pin),
      client.from('menstrual_cycles').delete().eq('pin', pin),
      client.from('app_pins').delete().eq('pin', pin)
    ]);
    return true;
  } catch {
    return false;
  }
};

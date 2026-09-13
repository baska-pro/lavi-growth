import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, SupabaseConfig } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabaseClient = (config: SupabaseConfig): SupabaseClient | null => {
  if (!config?.url || !config?.anonKey) return null;
  const key = `${config.url.trim()}::${config.anonKey.trim()}`;
  if (cachedClient && currentClientKey === key) return cachedClient;

  try {
    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    currentClientKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client', error);
    return null;
  }
};

const isMissingRpc = (error: any) =>
  error?.code === 'PGRST202' ||
  error?.code === '42883' ||
  String(error?.message || '').toLowerCase().includes('function') &&
    String(error?.message || '').toLowerCase().includes('does not exist');

const extractBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value) && typeof value[0] === 'boolean') return value[0];
  if (value && typeof value === 'object') {
    const first = Object.values(value as Record<string, unknown>)[0];
    if (typeof first === 'boolean') return first;
  }
  return false;
};

export const testSupabaseConnection = async (
  config: SupabaseConfig
): Promise<{ success: boolean; message: string; tablesReady?: boolean }> => {
  if (!config.url || !config.url.startsWith('https://')) {
    return { success: false, message: 'URL Supabase harus diawali dengan https://' };
  }
  if (!config.anonKey || config.anonKey.length < 20) {
    return { success: false, message: 'Anon/Public Key Supabase tidak valid.' };
  }

  const client = getSupabaseClient(config);
  if (!client) return { success: false, message: 'Gagal membuat Supabase client.' };

  try {
    const { data, error } = await client.rpc('lavi_healthcheck');
    if (error) {
      if (isMissingRpc(error)) {
        return {
          success: true,
          tablesReady: false,
          message: 'Koneksi Supabase berhasil, tetapi schema aman Lavi Growth v1.0.1 belum dipasang. Jalankan skrip SQL terbaru.'
        };
      }
      return { success: false, message: `Pemeriksaan Supabase gagal: ${error.message}` };
    }
    return {
      success: data === true || data === 'ok' || data?.status === 'ok',
      tablesReady: true,
      message: 'Koneksi Supabase aktif dan schema aman siap digunakan.'
    };
  } catch (error: any) {
    return { success: false, message: `Gagal menghubungkan ke Supabase: ${error?.message || error}` };
  }
};

export const checkPinOnSupabase = async (config: SupabaseConfig, pin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client || !pin) return false;
  try {
    const { data, error } = await client.rpc('lavi_check_pin', { p_pin: pin });
    if (error) {
      console.warn('Supabase PIN check failed', error.message);
      return false;
    }
    return extractBoolean(data);
  } catch {
    return false;
  }
};

export const pullFromSupabase = async (config: SupabaseConfig, pin: string): Promise<AppState | null> => {
  const client = getSupabaseClient(config);
  if (!client) return null;
  try {
    const { data, error } = await client.rpc('lavi_pull', { p_pin: pin });
    if (error || !data) {
      if (error) console.warn('Supabase pull failed', error.message);
      return null;
    }

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload || typeof payload !== 'object') return null;

    return {
      profiles: Array.isArray(payload.profiles) ? payload.profiles : [],
      records: Array.isArray(payload.records) ? payload.records : [],
      vaccines: Array.isArray(payload.vaccines) ? payload.vaccines : [],
      milestones: Array.isArray(payload.milestones) ? payload.milestones : [],
      targets: Array.isArray(payload.targets) ? payload.targets : [],
      reminders: Array.isArray(payload.reminders) ? payload.reminders : [],
      menstrualCycles: Array.isArray(payload.menstrualCycles) ? payload.menstrualCycles : [],
      activeProfileId: null,
      darkMode: false,
      pin,
      lastSyncTime: Date.now()
    };
  } catch (error) {
    console.error('Supabase Pull Error', error);
    return null;
  }
};

export const pushToSupabase = async (
  config: SupabaseConfig,
  data: Partial<AppState>,
  pin: string
): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;
  try {
    const payload = {
      profiles: data.profiles,
      records: data.records,
      vaccines: data.vaccines,
      milestones: data.milestones,
      targets: data.targets,
      reminders: data.reminders,
      menstrualCycles: data.menstrualCycles
    };
    const { data: result, error } = await client.rpc('lavi_push', {
      p_pin: pin,
      p_payload: payload
    });
    if (error) {
      console.warn('Supabase push failed', error.message);
      return false;
    }
    return extractBoolean(result);
  } catch (error) {
    console.error('Supabase Push Error', error);
    return false;
  }
};

export const deleteFromSupabase = async (
  config: SupabaseConfig,
  type: 'profile' | 'record' | 'target' | 'reminder' | 'cycle' | 'vaccine' | 'milestone',
  id: string,
  pin: string
): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;
  try {
    const { data, error } = await client.rpc('lavi_delete', {
      p_pin: pin,
      p_type: type,
      p_id: id
    });
    if (error) {
      console.warn('Supabase delete failed', error.message);
      return false;
    }
    return extractBoolean(data);
  } catch {
    return false;
  }
};

export const updatePinOnSupabase = async (
  config: SupabaseConfig,
  newPin: string,
  oldPin: string
): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client || !/^\d{6,12}$/.test(newPin)) return false;
  try {
    const { data, error } = await client.rpc('lavi_update_pin', {
      p_old_pin: oldPin,
      p_new_pin: newPin
    });
    if (error) {
      console.warn('Supabase PIN update failed', error.message);
      return false;
    }
    return extractBoolean(data);
  } catch {
    return false;
  }
};

export const resetSupabaseData = async (config: SupabaseConfig, pin: string): Promise<boolean> => {
  const client = getSupabaseClient(config);
  if (!client) return false;
  try {
    const { data, error } = await client.rpc('lavi_reset', { p_pin: pin });
    if (error) {
      console.warn('Supabase reset failed', error.message);
      return false;
    }
    return extractBoolean(data);
  } catch {
    return false;
  }
};

import { AppState, DatabaseConfig } from '../types';
import {
  pullFromSupabase,
  pushToSupabase,
  deleteFromSupabase,
  checkPinOnSupabase,
  updatePinOnSupabase,
  resetSupabaseData,
  testSupabaseConnection
} from './supabaseService';
import {
  StoredQueueItem,
  deleteQueueItem,
  getQueueCounts,
  getQueueItems,
  putQueueItem,
  retryFailedQueueItems
} from './localDb';

export const DEFAULT_GAS_URL = '';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  syncedAt?: string;
  valid?: boolean;
  url?: string;
}

export type QueueAction = 'SYNC_PUSH' | 'DELETE_DATA';
export interface QueueItem extends StoredQueueItem {
  action: QueueAction;
  payload: any;
}

const DB_CONFIG_KEY = 'LAVI_DB_CONFIG';
const LEGACY_QUEUE_KEY = 'LAVI_SYNC_QUEUE';
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 15_000;
let isProcessingQueue = false;
let legacyQueueMigrated = false;

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  provider: 'gas',
  gas: { webAppUrl: DEFAULT_GAS_URL },
  supabase: { url: '', anonKey: '' }
};

export const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const stored = localStorage.getItem(DB_CONFIG_KEY);
    if (!stored) return DEFAULT_DATABASE_CONFIG;
    const parsed = JSON.parse(stored);
    return {
      provider: parsed.provider === 'supabase' ? 'supabase' : 'gas',
      gas: { webAppUrl: parsed.gas?.webAppUrl || DEFAULT_GAS_URL },
      supabase: {
        url: parsed.supabase?.url || '',
        anonKey: parsed.supabase?.anonKey || ''
      }
    };
  } catch {
    return DEFAULT_DATABASE_CONFIG;
  }
};

export const saveDatabaseConfig = (config: DatabaseConfig): void => {
  try {
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save database config', error);
  }
};

const getFetchOptions = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(body),
  redirect: 'follow',
  credentials: 'omit'
});

const getActiveGasUrl = (): string => {
  const config = getDatabaseConfig();
  return config.gas.webAppUrl.trim() || DEFAULT_GAS_URL;
};

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine;
const isBase64 = (value?: string) => !!value && value.startsWith('data:image');
const generateUUID = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const migrateLegacyQueue = async (): Promise<void> => {
  if (legacyQueueMigrated) return;
  legacyQueueMigrated = true;
  try {
    const raw = localStorage.getItem(LEGACY_QUEUE_KEY);
    if (!raw) return;
    const items = JSON.parse(raw);
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item?.id || !item?.action) continue;
        await putQueueItem({
          id: String(item.id),
          action: item.action,
          payload: item.payload,
          pin: String(item.pin || ''),
          timestamp: Number(item.timestamp) || Date.now(),
          retryCount: Number(item.retryCount) || 0,
          status: 'pending'
        });
      }
    }
    localStorage.removeItem(LEGACY_QUEUE_KEY);
  } catch (error) {
    console.warn('Legacy sync queue migration failed', error);
  }
};

export const testGasConnection = async (webAppUrl: string): Promise<{ success: boolean; message: string }> => {
  const url = webAppUrl.trim() || DEFAULT_GAS_URL;
  if (!url) return { success: false, message: 'URL Web App Google Apps Script belum dikonfigurasi.' };
  if (!url.startsWith('https://script.google.com/')) {
    return { success: false, message: 'URL Web App GAS harus diawali dengan https://script.google.com/' };
  }

  try {
    const response = await fetch(url, getFetchOptions({ action: 'health_check' }));
    if (!response.ok) return { success: false, message: `HTTP status ${response.status} dari Google Apps Script` };
    const result = await response.json();
    if (result?.status === 'success') {
      return { success: true, message: 'Koneksi ke Google Spreadsheet (GAS) terhubung & aktif!' };
    }
    return { success: false, message: result?.message || 'Respon Apps Script tidak sesuai format.' };
  } catch (error: any) {
    return { success: false, message: `Gagal menghubungi Google Apps Script: ${error?.message || 'CORS / Jaringan'}` };
  }
};

export const testDatabaseConnection = async (
  config: DatabaseConfig
): Promise<{ success: boolean; message: string; tablesReady?: boolean }> =>
  config.provider === 'supabase'
    ? testSupabaseConnection(config.supabase)
    : testGasConnection(config.gas.webAppUrl);

export const addToQueue = async (action: QueueAction, payload: any, pin: string): Promise<string> => {
  await migrateLegacyQueue();
  const id = generateUUID();
  const item: QueueItem = {
    id,
    action,
    payload,
    pin,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending'
  };
  await putQueueItem(item);
  if (isOnline()) await processQueueFIFO();
  return id;
};

export const getQueueStatus = async () => {
  await migrateLegacyQueue();
  return getQueueCounts();
};

export const getQueueLength = async (): Promise<number> => (await getQueueStatus()).total;

export const retryFailedQueue = async (): Promise<number> => {
  await migrateLegacyQueue();
  const count = await retryFailedQueueItems();
  if (count > 0 && isOnline()) await processQueueFIFO();
  return count;
};

const processPhotos = async (items: any[], pin: string, type: 'profile' | 'record') =>
  Promise.all(
    items.map(async item => {
      const next = { ...item };
      if (type === 'profile' && isBase64(next.avatar)) {
        const url = await uploadImageToDrive(next.avatar, pin, next.name || 'Profile');
        if (url) next.avatar = url;
      }
      if (type === 'record' && Array.isArray(next.photos) && next.photos.length > 0) {
        next.photos = await Promise.all(
          next.photos.map(async (photo: string) => {
            if (!isBase64(photo)) return photo;
            return (await uploadImageToDrive(photo, pin, 'Record_Image')) || photo;
          })
        );
      }
      return next;
    })
  );

const executePush = async (data: Partial<AppState>, pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return pushToSupabase(config.supabase, data, pin);

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;
  try {
    const profiles = data.profiles ? await processPhotos(data.profiles, pin, 'profile') : undefined;
    const records = data.records ? await processPhotos(data.records, pin, 'record') : undefined;
    const payload = {
      action: 'sync_push',
      pin,
      payload: {
        profiles,
        records,
        vaccines: data.vaccines,
        milestones: data.milestones,
        targets: data.targets,
        reminders: data.reminders,
        menstrualCycles: data.menstrualCycles
      }
    };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return response.ok && result?.status === 'success';
  } catch (error) {
    console.warn('GAS push failed', error);
    return false;
  }
};

const executeDelete = async (type: string, id: string, pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return deleteFromSupabase(config.supabase, type as any, id, pin);

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;
  try {
    const response = await fetch(gasUrl, getFetchOptions({ action: 'delete_data', pin, type, id }));
    const result = await response.json();
    return response.ok && result?.status === 'success';
  } catch (error) {
    console.warn('GAS delete failed', error);
    return false;
  }
};

export const processQueueFIFO = async (): Promise<void> => {
  if (!isOnline() || isProcessingQueue) return;
  await migrateLegacyQueue();
  isProcessingQueue = true;

  try {
    while (isOnline()) {
      const items = await getQueueItems<QueueItem>();
      const now = Date.now();
      const item = items.find(entry => entry.status === 'pending' && (!entry.nextRetryAt || entry.nextRetryAt <= now));
      if (!item) break;

      let success = false;
      let errorMessage = 'Sinkronisasi gagal.';
      try {
        success = item.action === 'SYNC_PUSH'
          ? await executePush(item.payload, item.pin)
          : await executeDelete(item.payload.type, item.payload.id, item.pin);
      } catch (error: any) {
        errorMessage = error?.message || errorMessage;
      }

      if (success) {
        await deleteQueueItem(item.id);
        continue;
      }

      const retryCount = (item.retryCount || 0) + 1;
      const failed = retryCount >= MAX_RETRIES;
      await putQueueItem({
        ...item,
        retryCount,
        status: failed ? 'failed' : 'pending',
        lastError: errorMessage,
        nextRetryAt: failed ? undefined : Date.now() + RETRY_BASE_MS * 2 ** (retryCount - 1)
      });

      // Stop this pass so transient failures do not hammer the backend.
      break;
    }
  } catch (error) {
    console.error('Critical sync queue error', error);
  } finally {
    isProcessingQueue = false;
  }
};

export const pullFromCloud = async (pin: string): Promise<AppState | null> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return pullFromSupabase(config.supabase, pin);

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return null;
  try {
    const response = await fetch(gasUrl, getFetchOptions({ action: 'sync_pull', pin }));
    if (!response.ok) return null;
    const result: ApiResponse<any> = await response.json();
    if (result.status !== 'success' || !result.data) return null;
    return {
      profiles: result.data.profiles || [],
      records: result.data.records || [],
      vaccines: result.data.vaccines || [],
      milestones: result.data.milestones || [],
      targets: result.data.targets || [],
      reminders: result.data.reminders || [],
      menstrualCycles: result.data.menstrualCycles || [],
      activeProfileId: null,
      darkMode: false,
      pin,
      dbConfig: config,
      lastSyncTime: Date.now()
    };
  } catch (error) {
    console.error('Pull Error', error);
    return null;
  }
};

export const pushToCloud = async (data: Partial<AppState>, pin: string): Promise<boolean> => {
  try {
    await addToQueue('SYNC_PUSH', data, pin);
    return true;
  } catch (error) {
    console.error('Unable to persist sync queue item', error);
    return false;
  }
};

export const deleteFromCloud = async (
  type: 'profile' | 'record' | 'target' | 'reminder' | 'cycle' | 'vaccine' | 'milestone',
  id: string,
  pin: string
): Promise<boolean> => {
  try {
    await addToQueue('DELETE_DATA', { type, id }, pin);
    return true;
  } catch (error) {
    console.error('Unable to persist delete queue item', error);
    return false;
  }
};

export const uploadImageToDrive = async (base64Data: string, pin: string, fileName: string): Promise<string | null> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return base64Data;

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return null;
  try {
    const response = await fetch(
      gasUrl,
      getFetchOptions({
        action: 'upload_image',
        pin,
        fileData: base64Data,
        fileName: `${fileName}_${Date.now()}.jpg`
      })
    );
    const result: ApiResponse = await response.json();
    return response.ok && result.status === 'success' ? result.url || null : null;
  } catch {
    return null;
  }
};

export const checkPinOnServer = async (pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return checkPinOnSupabase(config.supabase, pin);

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;
  try {
    const response = await fetch(gasUrl, getFetchOptions({ action: 'check_pin', pin }));
    const result: ApiResponse = await response.json();
    return response.ok && result.status === 'success' && result.valid === true;
  } catch {
    return false;
  }
};

const rekeyQueuedItems = async (oldPin: string, newPin: string): Promise<void> => {
  const items = await getQueueItems<QueueItem>();
  await Promise.all(
    items
      .filter(item => item.pin === oldPin)
      .map(item => putQueueItem({ ...item, pin: newPin }))
  );
};

export const updatePinOnServer = async (newPin: string, oldPin: string): Promise<boolean> => {
  if (!/^\d{6,12}$/.test(newPin)) return false;
  const config = getDatabaseConfig();
  let success = false;

  if (config.provider === 'supabase') {
    success = await updatePinOnSupabase(config.supabase, newPin, oldPin);
  } else {
    const gasUrl = getActiveGasUrl();
    if (!gasUrl) return false;
    try {
      const response = await fetch(gasUrl, getFetchOptions({ action: 'update_pin', pin: oldPin, newPin }));
      const result = await response.json();
      success = response.ok && result?.status === 'success';
    } catch {
      success = false;
    }
  }

  if (success) await rekeyQueuedItems(oldPin, newPin);
  return success;
};

export const resetServerData = async (pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') return resetSupabaseData(config.supabase, pin);

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;
  try {
    const response = await fetch(gasUrl, getFetchOptions({ action: 'reset_data', pin }));
    const result = await response.json();
    return response.ok && result?.status === 'success';
  } catch {
    return false;
  }
};

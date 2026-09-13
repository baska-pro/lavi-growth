import { AppState, Profile, HealthRecord, VaccineRecord, MilestoneRecord, Target, Reminder, MenstrualCycle, DatabaseConfig, DatabaseProvider } from "../types";
import { 
  pullFromSupabase, 
  pushToSupabase, 
  deleteFromSupabase, 
  checkPinOnSupabase, 
  updatePinOnSupabase, 
  resetSupabaseData,
  testSupabaseConnection 
} from "./supabaseService";

// Intentionally empty for public releases. Configure your own Google Apps Script
// Web App URL from the in-app database settings before enabling cloud sync.
export const DEFAULT_GAS_URL = "";

// --- TYPES ---
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  syncedAt?: string;
}

export type QueueAction = 'SYNC_PUSH' | 'DELETE_DATA' | 'UPLOAD_IMAGE';

export interface QueueItem {
  id: string; // Unique ID for the queue item
  action: QueueAction;
  payload: any;
  pin: string;
  timestamp: number;
  retryCount: number;
}

// --- CONSTANTS ---
const KEYS = {
  QUEUE: 'LAVI_SYNC_QUEUE',
  CACHE: 'FAMHEALTH_DATA_V1',
  DB_CONFIG: 'LAVI_DB_CONFIG'
};

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  provider: 'gas',
  gas: {
    webAppUrl: DEFAULT_GAS_URL
  },
  supabase: {
    url: '',
    anonKey: ''
  }
};

// --- DATABASE CONFIGURATION GETTER & SETTER ---
export const getDatabaseConfig = (): DatabaseConfig => {
  try {
    const stored = localStorage.getItem(KEYS.DB_CONFIG);
    if (!stored) return DEFAULT_DATABASE_CONFIG;
    const parsed = JSON.parse(stored);
    return {
      provider: parsed.provider || 'gas',
      gas: {
        webAppUrl: parsed.gas?.webAppUrl || DEFAULT_GAS_URL
      },
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
    localStorage.setItem(KEYS.DB_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save database config", e);
  }
};

// Test GAS connection
export const testGasConnection = async (webAppUrl: string): Promise<{ success: boolean; message: string }> => {
  const url = webAppUrl.trim() || DEFAULT_GAS_URL;
  if (!url) {
    return { success: false, message: 'URL Web App Google Apps Script belum dikonfigurasi.' };
  }
  if (!url.startsWith('https://script.google.com/')) {
    return { success: false, message: 'URL Web App GAS harus diawali dengan https://script.google.com/' };
  }
  try {
    const payload = { action: 'check_pin', pin: '0000' };
    const response = await fetch(url, getFetchOptions(payload));
    if (!response.ok) {
      return { success: false, message: `HTTP status ${response.status} dari Google Apps Script` };
    }
    const result = await response.json();
    if (result && result.status === 'success') {
      return { success: true, message: 'Koneksi ke Google Spreadsheet (GAS) terhubung & aktif!' };
    }
    return { success: false, message: result?.message || 'Respon dari Apps Script tidak sesuai format.' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungi Google Apps Script: ${err.message || 'CORS / Jaringan'}` };
  }
};

// Unified connection tester
export const testDatabaseConnection = async (config: DatabaseConfig): Promise<{ success: boolean; message: string; tablesReady?: boolean }> => {
  if (config.provider === 'supabase') {
    return await testSupabaseConnection(config.supabase);
  } else {
    return await testGasConnection(config.gas.webAppUrl);
  }
};

const MAX_RETRIES = 3; // Prevent infinite blocking
let isProcessingQueue = false;

// --- UTILS ---
const isBase64 = (str?: string) => str && str.startsWith('data:image');
const generateUUID = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// --- QUEUE MANAGEMENT (OFFLINE FIRST) ---
const getQueue = (): QueueItem[] => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.QUEUE) || "[]");
  } catch { return []; }
};

const setQueue = (q: QueueItem[]) => localStorage.setItem(KEYS.QUEUE, JSON.stringify(q));

export const addToQueue = async (action: QueueAction, payload: any, pin: string) => {
  const item: QueueItem = {
    id: generateUUID(),
    action,
    payload,
    pin,
    timestamp: Date.now(),
    retryCount: 0
  };
  
  const queue = getQueue();
  setQueue([...queue, item]);

  // Trigger sync if online
  if (navigator.onLine) {
    await processQueueFIFO();
  }
};

export const getQueueLength = () => getQueue().length;

// --- SYNC ENGINE (CORE LOGIC WITH CONCURRENCY MUTEX) ---
export const processQueueFIFO = async (): Promise<void> => {
  if (!navigator.onLine || isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    while (navigator.onLine) {
      const currentQueue = getQueue();
      if (currentQueue.length === 0) break;

      const item = currentQueue[0];
      let success = false;

      try {
        if (item.action === 'SYNC_PUSH') {
          success = await executePush(item.payload, item.pin);
        } else if (item.action === 'DELETE_DATA') {
          success = await executeDelete(item.payload.type, item.payload.id, item.pin);
        } else if (item.action === 'UPLOAD_IMAGE') {
          success = true; 
        }
      } catch (itemErr) {
        console.warn(`Error executing queue item ${item.id}:`, itemErr);
        success = false;
      }

      if (success) {
        // Success: Remove item and proceed to next in loop
        const remaining = getQueue().slice(1);
        setQueue(remaining);
      } else {
        // Failure: Increment retry count or drop if exceeded
        const latestQueue = getQueue();
        if (latestQueue.length > 0 && latestQueue[0].id === item.id) {
          const retries = (item.retryCount || 0) + 1;
          if (retries >= MAX_RETRIES) {
            console.warn(`Item ${item.id} exceeded ${MAX_RETRIES} retries. Removing to unblock queue.`);
            setQueue(latestQueue.slice(1));
          } else {
            console.warn(`Item ${item.id} sync failed. Retry ${retries}/${MAX_RETRIES}`);
            const updatedQueue = [...latestQueue];
            updatedQueue[0] = { ...item, retryCount: retries };
            setQueue(updatedQueue);
            // Break out of the loop on transient failure to avoid hammering server
            break;
          }
        } else {
          break;
        }
      }
    }
  } catch (e) {
    console.error("Critical error in processQueueFIFO", e);
  } finally {
    isProcessingQueue = false;
  }
};

// --- API EXECUTORS (ACTUAL FETCH) ---

// Helper for GAS fetch options to prevent CORS issues
const getFetchOptions = (body: any) => ({
  method: 'POST',
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(body),
  redirect: 'follow' as RequestRedirect,
  credentials: 'omit' as RequestCredentials
});

const getActiveGasUrl = () => {
  const config = getDatabaseConfig();
  return config.gas.webAppUrl.trim() || DEFAULT_GAS_URL;
};

// 1. PULL (Read)
export const pullFromCloud = async (pin: string): Promise<AppState | null> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await pullFromSupabase(config.supabase, pin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return null;

  // Fallback to GAS (Google Apps Script)
  try {
    const payload = { action: 'sync_pull', pin };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const result: ApiResponse = await response.json();

    if (result.status === 'success' && result.data) {
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
        pin: pin,
        dbConfig: config
      };
    }
    return null;
  } catch (e) {
    console.error("Pull Error", e);
    return null;
  }
};

// 2. PUSH (Write)
const executePush = async (data: Partial<AppState>, pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await pushToSupabase(config.supabase, data, pin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;

  // Fallback to GAS (Google Apps Script)
  try {
    const profiles = data.profiles ? await processPhotos(data.profiles, pin, 'profile') : undefined;
    const records = data.records ? await processPhotos(data.records, pin, 'record') : undefined;

    const payload = {
      action: 'sync_push',
      pin: pin,
      payload: {
        profiles: profiles,
        records: records,
        vaccines: data.vaccines,
        milestones: data.milestones,
        targets: data.targets,
        reminders: data.reminders,
        menstrualCycles: data.menstrualCycles
      }
    };

    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

// 3. DELETE
const executeDelete = async (type: string, id: string, pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await deleteFromSupabase(config.supabase, type as any, id, pin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;

  try {
    const payload = { action: 'delete_data', pin, type, id };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success';
  } catch (e) {
    return false;
  }
};

// --- HELPER: Upload Photos ---
const processPhotos = async (items: any[], pin: string, type: 'profile' | 'record') => {
  const processedItems = await Promise.all(items.map(async (item) => {
    const newItem = { ...item };
    
    if (type === 'profile' && isBase64(newItem.avatar)) {
      const url = await uploadImageToDrive(newItem.avatar, pin, newItem.name);
      if (url) newItem.avatar = url;
    }

    if (type === 'record' && newItem.photos && newItem.photos.length > 0) {
      const processedUrls = await Promise.all(newItem.photos.map(async (p: string) => {
        if (isBase64(p)) {
          const url = await uploadImageToDrive(p, pin, 'Record_Image');
          return url || p; 
        }
        return p;
      }));
      newItem.photos = processedUrls.filter(Boolean);
    }
    return newItem;
  }));
  return processedItems;
};

// --- PUBLIC HELPERS ---
export const pushToCloud = async (data: Partial<AppState>, pin: string): Promise<boolean> => {
  await addToQueue('SYNC_PUSH', data, pin);
  return true; 
};

export const deleteFromCloud = async (type: 'profile' | 'record' | 'target' | 'reminder' | 'cycle' | 'vaccine' | 'milestone', id: string, pin: string): Promise<boolean> => {
  await addToQueue('DELETE_DATA', { type, id }, pin);
  return true; 
};

export const uploadImageToDrive = async (base64Data: string, pin: string, fileName: string): Promise<string | null> => {
  const config = getDatabaseConfig();
  if (config.provider === 'supabase') {
    // For Supabase, store compressed data URI directly in database row
    return base64Data;
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return null;

  try {
    const payload = {
      action: 'upload_image',
      pin,
      fileData: base64Data,
      fileName: `${fileName}_${Date.now()}.jpg`
    };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success' ? result.url : null;
  } catch (e) { return null; }
};

export const checkPinOnServer = async (pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await checkPinOnSupabase(config.supabase, pin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;

  try {
    const payload = { action: 'check_pin', pin };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success' && result.valid;
  } catch { return false; }
};

export const updatePinOnServer = async (newPin: string, oldPin: string): Promise<boolean> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await updatePinOnSupabase(config.supabase, newPin, oldPin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;

  try {
    const payload = { action: 'update_pin', pin: oldPin, newPin };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success';
  } catch { return false; }
};

export const resetServerData = async (pin: string): Promise<boolean> => {
  const config = getDatabaseConfig();

  if (config.provider === 'supabase') {
    return await resetSupabaseData(config.supabase, pin);
  }

  const gasUrl = getActiveGasUrl();
  if (!gasUrl) return false;

  try {
    const payload = { action: 'reset_data', pin };
    const response = await fetch(gasUrl, getFetchOptions(payload));
    const result = await response.json();
    return result.status === 'success';
  } catch { return false; }
};

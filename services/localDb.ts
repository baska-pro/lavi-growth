import { AppState } from '../types';

const DB_NAME = 'lavi-growth';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const QUEUE_STORE = 'sync_queue';
const STATE_KEY = 'app';

export interface StoredQueueItem {
  id: string;
  action: string;
  payload: unknown;
  pin: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'failed';
  lastError?: string;
  nextRetryAt?: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB tidak tersedia pada browser ini.'));
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB.'));
    request.onblocked = () => reject(new Error('Upgrade IndexedDB terblokir oleh tab lain.'));
  });

  return dbPromise;
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Operasi IndexedDB gagal.'));
  });

export const loadAppStateFromDb = async (): Promise<AppState | null> => {
  const db = await openDb();
  const tx = db.transaction(STATE_STORE, 'readonly');
  const result = await requestToPromise(tx.objectStore(STATE_STORE).get(STATE_KEY));
  return (result as AppState | undefined) || null;
};

export const saveAppStateToDb = async (state: AppState): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(STATE_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(STATE_STORE).put(state, STATE_KEY));
};

export const clearAppStateDb = async (): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(STATE_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(STATE_STORE).delete(STATE_KEY));
};

export const getQueueItems = async <T extends StoredQueueItem = StoredQueueItem>(): Promise<T[]> => {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const items = (await requestToPromise(tx.objectStore(QUEUE_STORE).getAll())) as T[];
  return items.sort((a, b) => a.timestamp - b.timestamp);
};

export const putQueueItem = async (item: StoredQueueItem): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(QUEUE_STORE).put(item));
};

export const deleteQueueItem = async (id: string): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(QUEUE_STORE).delete(id));
};

export const clearQueueDb = async (): Promise<void> => {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  await requestToPromise(tx.objectStore(QUEUE_STORE).clear());
};

export const getQueueCounts = async (): Promise<{ pending: number; failed: number; total: number }> => {
  const items = await getQueueItems();
  const pending = items.filter(item => item.status === 'pending').length;
  const failed = items.filter(item => item.status === 'failed').length;
  return { pending, failed, total: items.length };
};

export const retryFailedQueueItems = async (): Promise<number> => {
  const items = await getQueueItems();
  const failed = items.filter(item => item.status === 'failed');
  await Promise.all(
    failed.map(item =>
      putQueueItem({
        ...item,
        status: 'pending',
        retryCount: 0,
        lastError: undefined,
        nextRetryAt: undefined,
        timestamp: Date.now()
      })
    )
  );
  return failed.length;
};

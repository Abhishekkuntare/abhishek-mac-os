export type ActivityCategory =
  | 'session'
  | 'app'
  | 'search'
  | 'file'
  | 'setting'
  | 'workspace'
  | 'system';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  title: string;
  details?: string;
}

const DATABASE_NAME = 'arlo-os-activity-history';
const STORE_NAME = 'activity';
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | null = null;
const listeners = new Set<() => void>();

const getDatabase = () => {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support local activity history.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error('Could not open local activity history.'));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error('Activity history storage is busy. Close other ARLO OS tabs and try again.'));
      };
    });
  }

  return databasePromise;
};

const transact = async <T,>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const database = await getDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error || new Error('Activity history storage operation failed.'));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error('Activity history storage operation failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Activity history storage operation was aborted.'));
  });
};

const notify = () => listeners.forEach(listener => listener());

export const activityLog = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async list(): Promise<ActivityEntry[]> {
    const entries = await transact<ActivityEntry[]>('readonly', store => store.getAll());
    return entries.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  },

  async add(entry: ActivityEntry): Promise<void> {
    await transact<IDBValidKey>('readwrite', store => store.add(entry));
    notify();
  },

  async delete(id: string): Promise<void> {
    await transact<undefined>('readwrite', store => store.delete(id));
    notify();
  },

  async clear(): Promise<void> {
    await transact<undefined>('readwrite', store => store.clear());
    notify();
  },
};

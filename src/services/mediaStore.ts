const DATABASE_NAME = 'abhishek-os-media';
const STORE_NAME = 'media';
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | null = null;

const getDatabase = () => {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support local media storage.'));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error('Could not open local media storage.'));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error('Local media storage is busy. Close other ARLO OS tabs and try again.'));
      };
    });
  }
  return databasePromise;
};

const runRequest = async <T,>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) => {
  const database = await getDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local media storage operation failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Local media storage operation was aborted.'));
  });
};

export const storeMediaBlob = (id: string, blob: Blob) =>
  runRequest<IDBValidKey>('readwrite', store => store.put(blob, id));

export const readMediaBlob = (id: string) =>
  runRequest<Blob | undefined>('readonly', store => store.get(id));

export const deleteMediaBlob = (id: string) =>
  runRequest<undefined>('readwrite', store => store.delete(id));

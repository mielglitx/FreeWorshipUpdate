import { SongItem } from '../types/worship';

const DB_NAME = 'freeworship_songs_store_v1';
const STORE_NAME = 'songs_collection';

/**
 * Opens or initializes the songs IndexedDB database.
 */
function openSongsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves all user songs into IndexedDB for persistent retention across updates and cache clearing.
 */
export async function saveSongsToIndexedDB(songs: SongItem[]): Promise<void> {
  try {
    const db = await openSongsDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear and re-populate
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const song of songs) {
      store.put(song);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save songs to IndexedDB:', err);
  }
}

/**
 * Loads all songs from IndexedDB.
 */
export async function loadSongsFromIndexedDB(): Promise<SongItem[] | null> {
  try {
    const db = await openSongsDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const songs = await new Promise<SongItem[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as SongItem[]) || []);
      req.onerror = () => reject(req.error);
    });
    return songs && songs.length > 0 ? songs : null;
  } catch {
    return null;
  }
}

/**
 * Merges loaded/persisted songs with default songs without overwriting or deleting any user-created songs.
 */
export function mergeSongsWithDefaults(loaded: SongItem[], defaults: SongItem[]): SongItem[] {
  if (!loaded || loaded.length === 0) return defaults;

  const existingTitles = new Set(
    loaded.map((s) => s.title.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  const existingIds = new Set(loaded.map((s) => s.id));

  const missingDefaults = defaults.filter((ds) => {
    const normTitle = ds.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return !existingTitles.has(normTitle) && !existingIds.has(ds.id);
  });

  return [...loaded, ...missingDefaults];
}

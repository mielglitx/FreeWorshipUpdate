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

const MINOR_TITLE_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'so',
  'as',
  'at',
  'by',
  'in',
  'of',
  'on',
  'per',
  'to',
  'via',
]);

/**
 * Capitalizes a song title using English Title Case while strictly preserving
 * any custom capitalization entered by the user in a word (e.g. GOD, LORD).
 */
export function formatSongTitleSmart(rawTitle: string): string {
  const trimmed = (rawTitle || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const words = trimmed.split(' ');
  const lastIdx = words.length - 1;

  const formatSegment = (segment: string, isBoundaryWord: boolean): string => {
    if (!segment) return segment;
    const match = segment.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
    if (!match) return segment;
    const [, lead, core, trail] = match;
    if (!core) return segment;

    // Respect user's explicit capitalization when any uppercase letter is present
    if (/[A-Z]/.test(core)) {
      return segment;
    }

    const lowerCore = core.toLowerCase();
    if (!isBoundaryWord && lowerCore !== 'i' && MINOR_TITLE_WORDS.has(lowerCore)) {
      return segment;
    }

    const capitalizedCore = lowerCore.replace(/[a-z]/, (ch) => ch.toUpperCase());
    return `${lead}${capitalizedCore}${trail}`;
  };

  let forceNextAfterPunct = false;

  return words
    .map((word, idx) => {
      const isFirstOrLast = idx === 0 || idx === lastIdx || forceNextAfterPunct;
      const startsSubClause = /^[(\["“'‘]/.test(word);
      forceNextAfterPunct = /[:\-–—/.!?]$/.test(word);

      const parts = word.split(/([-/])/);
      const formattedParts = parts.map((part, pIdx) => {
        if (part === '-' || part === '/') return part;
        const partIsBoundary =
          (isFirstOrLast || startsSubClause) && pIdx === 0
            ? true
            : pIdx === parts.length - 1 && idx === lastIdx;
        return formatSegment(part, partIsBoundary);
      });

      return formattedParts.join('');
    })
    .join(' ');
}

/**
 * Merges loaded/persisted songs with default songs without overwriting or deleting any user-created songs.
 */
export function mergeSongsWithDefaults(loaded: SongItem[], defaults: SongItem[]): SongItem[] {
  if (!loaded || loaded.length === 0) return defaults;

  const defaultById = new Map(defaults.map((ds) => [ds.id, ds]));
  const normalizedLoaded = loaded.map((s) => {
    const def = defaultById.get(s.id);
    if (
      def &&
      s.title !== def.title &&
      s.title.trim().toLowerCase() === def.title.trim().toLowerCase()
    ) {
      return { ...s, title: def.title };
    }
    return s;
  });

  const existingTitles = new Set(
    normalizedLoaded.map((s) => s.title.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  const existingIds = new Set(normalizedLoaded.map((s) => s.id));

  const missingDefaults = defaults.filter((ds) => {
    const normTitle = ds.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return !existingTitles.has(normTitle) && !existingIds.has(ds.id);
  });

  return [...normalizedLoaded, ...missingDefaults];
}

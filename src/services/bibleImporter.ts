import { BibleVerse } from '../types/worship';

export interface CanonicalBook {
  number: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
  aliases: string[];
}

export const BIBLE_BOOKS_66: CanonicalBook[] = [
  // Old Testament (39 Books)
  { number: 1, name: 'Genesis', testament: 'OT', chapters: 50, aliases: ['gen', 'gn', 'ge'] },
  { number: 2, name: 'Exodus', testament: 'OT', chapters: 40, aliases: ['exod', 'ex', 'exo'] },
  { number: 3, name: 'Leviticus', testament: 'OT', chapters: 27, aliases: ['lev', 'lv', 'le'] },
  { number: 4, name: 'Numbers', testament: 'OT', chapters: 36, aliases: ['num', 'nm', 'nu', 'nb'] },
  { number: 5, name: 'Deuteronomy', testament: 'OT', chapters: 34, aliases: ['deut', 'dt', 'de'] },
  { number: 6, name: 'Joshua', testament: 'OT', chapters: 24, aliases: ['josh', 'jos', 'jsh'] },
  { number: 7, name: 'Judges', testament: 'OT', chapters: 21, aliases: ['judg', 'jdg', 'jg', 'jdgs'] },
  { number: 8, name: 'Ruth', testament: 'OT', chapters: 4, aliases: ['rth', 'ru'] },
  { number: 9, name: '1 Samuel', testament: 'OT', chapters: 31, aliases: ['1sam', '1sm', '1sa', '1s', 'i samuel', 'first samuel'] },
  { number: 10, name: '2 Samuel', testament: 'OT', chapters: 24, aliases: ['2sam', '2sm', '2sa', '2s', 'ii samuel', 'second samuel'] },
  { number: 11, name: '1 Kings', testament: 'OT', chapters: 22, aliases: ['1kgs', '1ki', '1k', '1kings', 'i kings', 'first kings'] },
  { number: 12, name: '2 Kings', testament: 'OT', chapters: 25, aliases: ['2kgs', '2ki', '2k', '2kings', 'ii kings', 'second kings'] },
  { number: 13, name: '1 Chronicles', testament: 'OT', chapters: 29, aliases: ['1chr', '1ch', '1chron', 'i chronicles'] },
  { number: 14, name: '2 Chronicles', testament: 'OT', chapters: 36, aliases: ['2chr', '2ch', '2chron', 'ii chronicles'] },
  { number: 15, name: 'Ezra', testament: 'OT', chapters: 10, aliases: ['ezr', 'ez'] },
  { number: 16, name: 'Nehemiah', testament: 'OT', chapters: 13, aliases: ['neh', 'ne'] },
  { number: 17, name: 'Esther', testament: 'OT', chapters: 10, aliases: ['esth', 'est', 'es'] },
  { number: 18, name: 'Job', testament: 'OT', chapters: 42, aliases: ['jb'] },
  { number: 19, name: 'Psalms', testament: 'OT', chapters: 150, aliases: ['psalm', 'ps', 'psa', 'psm', 'pss'] },
  { number: 20, name: 'Proverbs', testament: 'OT', chapters: 31, aliases: ['prov', 'prv', 'pr', 'pro'] },
  { number: 21, name: 'Ecclesiastes', testament: 'OT', chapters: 12, aliases: ['eccl', 'ecc', 'ec', 'qoh'] },
  { number: 22, name: 'Song of Solomon', testament: 'OT', chapters: 8, aliases: ['song', 'sos', 'so', 'canticles', 'song of songs'] },
  { number: 23, name: 'Isaiah', testament: 'OT', chapters: 66, aliases: ['isa', 'is'] },
  { number: 24, name: 'Jeremiah', testament: 'OT', chapters: 52, aliases: ['jer', 'je', 'jr'] },
  { number: 25, name: 'Lamentations', testament: 'OT', chapters: 5, aliases: ['lam', 'la'] },
  { number: 26, name: 'Ezekiel', testament: 'OT', chapters: 48, aliases: ['ezek', 'eze', 'ezk'] },
  { number: 27, name: 'Daniel', testament: 'OT', chapters: 12, aliases: ['dan', 'da', 'dn'] },
  { number: 28, name: 'Hosea', testament: 'OT', chapters: 14, aliases: ['hos', 'ho'] },
  { number: 29, name: 'Joel', testament: 'OT', chapters: 3, aliases: ['jl', 'joe'] },
  { number: 30, name: 'Amos', testament: 'OT', chapters: 9, aliases: ['am'] },
  { number: 31, name: 'Obadiah', testament: 'OT', chapters: 1, aliases: ['obad', 'ob'] },
  { number: 32, name: 'Jonah', testament: 'OT', chapters: 4, aliases: ['jon', 'jnh'] },
  { number: 33, name: 'Micah', testament: 'OT', chapters: 7, aliases: ['mic', 'mc'] },
  { number: 34, name: 'Nahum', testament: 'OT', chapters: 3, aliases: ['nah', 'na'] },
  { number: 35, name: 'Habakkuk', testament: 'OT', chapters: 3, aliases: ['hab', 'hb'] },
  { number: 36, name: 'Zephaniah', testament: 'OT', chapters: 3, aliases: ['zeph', 'zep', 'zp'] },
  { number: 37, name: 'Haggai', testament: 'OT', chapters: 2, aliases: ['hag', 'hg'] },
  { number: 38, name: 'Zechariah', testament: 'OT', chapters: 14, aliases: ['zech', 'zec', 'zc'] },
  { number: 39, name: 'Malachi', testament: 'OT', chapters: 4, aliases: ['mal', 'ml'] },

  // New Testament (27 Books)
  { number: 40, name: 'Matthew', testament: 'NT', chapters: 28, aliases: ['matt', 'mt', 'mat'] },
  { number: 41, name: 'Mark', testament: 'NT', chapters: 16, aliases: ['mrk', 'mk', 'mr'] },
  { number: 42, name: 'Luke', testament: 'NT', chapters: 24, aliases: ['luk', 'lk', 'lu'] },
  { number: 43, name: 'John', testament: 'NT', chapters: 21, aliases: ['jhn', 'jn', 'joh'] },
  { number: 44, name: 'Acts', testament: 'NT', chapters: 28, aliases: ['act', 'ac', 'acts of the apostles'] },
  { number: 45, name: 'Romans', testament: 'NT', chapters: 16, aliases: ['rom', 'ro', 'rm'] },
  { number: 46, name: '1 Corinthians', testament: 'NT', chapters: 16, aliases: ['1cor', '1co', 'i corinthians', 'first corinthians'] },
  { number: 47, name: '2 Corinthians', testament: 'NT', chapters: 13, aliases: ['2cor', '2co', 'ii corinthians', 'second corinthians'] },
  { number: 48, name: 'Galatians', testament: 'NT', chapters: 6, aliases: ['gal', 'ga'] },
  { number: 49, name: 'Ephesians', testament: 'NT', chapters: 6, aliases: ['eph', 'ep'] },
  { number: 50, name: 'Philippians', testament: 'NT', chapters: 4, aliases: ['phil', 'php', 'ph'] },
  { number: 51, name: 'Colossians', testament: 'NT', chapters: 4, aliases: ['col', 'cl'] },
  { number: 52, name: '1 Thessalonians', testament: 'NT', chapters: 5, aliases: ['1thess', '1th', '1thes', 'i thessalonians'] },
  { number: 53, name: '2 Thessalonians', testament: 'NT', chapters: 3, aliases: ['2thess', '2th', '2thes', 'ii thessalonians'] },
  { number: 54, name: '1 Timothy', testament: 'NT', chapters: 6, aliases: ['1tim', '1ti', '1tm', 'i timothy'] },
  { number: 55, name: '2 Timothy', testament: 'NT', chapters: 4, aliases: ['2tim', '2ti', '2tm', 'ii timothy'] },
  { number: 56, name: 'Titus', testament: 'NT', chapters: 3, aliases: ['tit', 'ti'] },
  { number: 57, name: 'Philemon', testament: 'NT', chapters: 1, aliases: ['phlm', 'phm', 'pm'] },
  { number: 58, name: 'Hebrews', testament: 'NT', chapters: 13, aliases: ['heb', 'he'] },
  { number: 59, name: 'James', testament: 'NT', chapters: 5, aliases: ['jas', 'jm', 'jam'] },
  { number: 60, name: '1 Peter', testament: 'NT', chapters: 5, aliases: ['1pet', '1pe', '1pt', '1p', 'i peter'] },
  { number: 61, name: '2 Peter', testament: 'NT', chapters: 3, aliases: ['2pet', '2pe', '2pt', '2p', 'ii peter'] },
  { number: 62, name: '1 John', testament: 'NT', chapters: 5, aliases: ['1john', '1jn', '1jo', '1j', 'i john'] },
  { number: 63, name: '2 John', testament: 'NT', chapters: 1, aliases: ['2john', '2jn', '2jo', '2j', 'ii john'] },
  { number: 64, name: '3 John', testament: 'NT', chapters: 1, aliases: ['3john', '3jn', '3jo', '3j', 'iii john'] },
  { number: 65, name: 'Jude', testament: 'NT', chapters: 1, aliases: ['jud', 'jd'] },
  { number: 66, name: 'Revelation', testament: 'NT', chapters: 22, aliases: ['rev', 're', 'rv', 'revelations', 'apocalypse'] },
];

export function resolveBookName(raw: string | number): string {
  if (typeof raw === 'number') {
    return BIBLE_BOOKS_66.find((b) => b.number === raw)?.name || 'Genesis';
  }
  const cleaned = raw.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    return BIBLE_BOOKS_66.find((b) => b.number === num)?.name || raw.trim();
  }
  const compact = cleaned.replace(/\s+/g, '');
  for (const b of BIBLE_BOOKS_66) {
    if (
      b.name.toLowerCase() === cleaned ||
      b.name.toLowerCase().replace(/\s+/g, '') === compact ||
      b.aliases.includes(cleaned) ||
      b.aliases.includes(compact)
    ) {
      return b.name;
    }
  }
  // Prefix match fallback (e.g., "cor" or "matt")
  for (const b of BIBLE_BOOKS_66) {
    if (b.name.toLowerCase().startsWith(cleaned) && cleaned.length >= 3) {
      return b.name;
    }
  }
  return raw.trim();
}

export interface ParsedScriptureRef {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

/**
 * Parses natural scripture references like:
 * - "John 3:16"
 * - "Ps 23:1-6"
 * - "1 Cor 13:4-8"
 * - "Romans 8"
 */
export function parseScriptureReference(query: string): ParsedScriptureRef | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([1-3]?\s*[a-zA-Z.\s]+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!match) return null;

  const rawBook = match[1].trim();
  const resolved = resolveBookName(rawBook);
  const exists = BIBLE_BOOKS_66.some((b) => b.name.toLowerCase() === resolved.toLowerCase());
  if (!exists) return null;

  const chapter = parseInt(match[2], 10);
  const verseStart = match[3] ? parseInt(match[3], 10) : undefined;
  const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

  return {
    book: resolved,
    chapter,
    verseStart,
    verseEnd,
  };
}

/**
 * Universal Offline Bible Parser supporting:
 * 1. thiagobodruk JSON: [{ abbrev, name, chapters: [["v1", "v2"], ...] }]
 * 2. scrollmapper / flat JSON: [{ book_name | book, chapter, verse, text }] or { verses: [...] }
 * 3. Nested object dictionary: { "Genesis": { "1": { "1": "In the beginning..." } } }
 * 4. Zefania / OpenSong XML: <XMLBIBLE><BIBLEBOOK><CHAPTER><VERS>
 */
export function parseBibleFile(
  content: string,
  fileName: string,
  customTranslationCode?: string
): { translationCode: string; verses: BibleVerse[] } {
  const defaultCode = (
    customTranslationCode ||
    fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toUpperCase()
      .slice(0, 10) ||
    'CUSTOM'
  ).toUpperCase();

  const trimmed = content.trim().replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present
  const verses: BibleVerse[] = [];

  // XML Bible Detection (Zefania XML or OpenSong XML)
  if (trimmed.startsWith('<')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/xml');
    const xmlBible = doc.querySelector('XMLBIBLE, bible, BIBLE');
    const codeAttr =
      customTranslationCode ||
      xmlBible?.getAttribute('biblename') ||
      xmlBible?.getAttribute('translation') ||
      defaultCode;
    const transCode = codeAttr.toUpperCase().slice(0, 12);

    const bookNodes = Array.from(doc.querySelectorAll('BIBLEBOOK, b, book'));
    bookNodes.forEach((bNode, bIdx) => {
      const rawName =
        bNode.getAttribute('bname') ||
        bNode.getAttribute('n') ||
        bNode.getAttribute('name') ||
        bNode.getAttribute('bnumber') ||
        String(bIdx + 1);
      const bookName = resolveBookName(rawName);

      const chapNodes = Array.from(bNode.querySelectorAll('CHAPTER, c, chapter'));
      chapNodes.forEach((cNode, cIdx) => {
        const chapNum = parseInt(
          cNode.getAttribute('cnumber') ||
            cNode.getAttribute('n') ||
            cNode.getAttribute('number') ||
            String(cIdx + 1),
          10
        );
        const verseNodes = Array.from(cNode.querySelectorAll('VERS, v, verse'));
        verseNodes.forEach((vNode, vIdx) => {
          const vNum = parseInt(
            vNode.getAttribute('vnumber') ||
              vNode.getAttribute('n') ||
              vNode.getAttribute('number') ||
              String(vIdx + 1),
            10
          );
          const text = (vNode.textContent || '').replace(/\s+/g, ' ').trim();
          if (text) {
            verses.push({
              book: bookName,
              chapter: chapNum,
              verse: vNum,
              text,
              translation: transCode,
            });
          }
        });
      });
    });

    return { translationCode: transCode, verses };
  }

  // JSON Bible Parsing
  const parsed = JSON.parse(trimmed);

  // Case 1: Array at root
  if (Array.isArray(parsed)) {
    // Subcase 1A: thiagobodruk format -> [{ abbrev: "gn", name: "Genesis", chapters: [ ["v1", "v2"] ] }]
    if (parsed.length > 0 && Array.isArray(parsed[0].chapters)) {
      parsed.forEach((bookObj: any, bIdx: number) => {
        const bookName = resolveBookName(bookObj.name || bookObj.book || bookObj.abbrev || bIdx + 1);
        bookObj.chapters.forEach((chapArr: any, cIdx: number) => {
          if (Array.isArray(chapArr)) {
            chapArr.forEach((verseText: any, vIdx: number) => {
              if (typeof verseText === 'string' && verseText.trim()) {
                verses.push({
                  book: bookName,
                  chapter: cIdx + 1,
                  verse: vIdx + 1,
                  text: verseText.trim(),
                  translation: defaultCode,
                });
              } else if (verseText && typeof verseText.text === 'string') {
                verses.push({
                  book: bookName,
                  chapter: cIdx + 1,
                  verse: Number(verseText.verse || vIdx + 1),
                  text: verseText.text.trim(),
                  translation: defaultCode,
                });
              }
            });
          }
        });
      });
      return { translationCode: defaultCode, verses };
    }

    // Subcase 1B: Flat array of verse objects -> [{ book, chapter, verse, text }]
    parsed.forEach((item: any) => {
      if (item && (item.text || item.scripture)) {
        const bookName = resolveBookName(item.book_name || item.book || item.bookNumber || 1);
        verses.push({
          book: bookName,
          chapter: Number(item.chapter || 1),
          verse: Number(item.verse || 1),
          text: String(item.text || item.scripture).trim(),
          translation: (customTranslationCode || item.translation || defaultCode).toUpperCase(),
        });
      }
    });
    return { translationCode: defaultCode, verses };
  }

  // Case 2: Object with `verses` array (e.g. scrollmapper / bible-api export)
  if (parsed && Array.isArray(parsed.verses)) {
    const code = (
      customTranslationCode ||
      parsed.translation_id ||
      parsed.translation ||
      parsed.abbreviation ||
      defaultCode
    )
      .toString()
      .toUpperCase();
    parsed.verses.forEach((item: any) => {
      const bookName = resolveBookName(item.book_name || item.book || item.book_id || 1);
      if (item.text) {
        verses.push({
          book: bookName,
          chapter: Number(item.chapter || 1),
          verse: Number(item.verse || 1),
          text: String(item.text).trim(),
          translation: code,
        });
      }
    });
    return { translationCode: code, verses };
  }

  // Case 3: Object with `books` array
  if (parsed && Array.isArray(parsed.books)) {
    const code = (customTranslationCode || parsed.translation || parsed.version || defaultCode)
      .toString()
      .toUpperCase();
    parsed.books.forEach((bObj: any, bIdx: number) => {
      const bookName = resolveBookName(bObj.name || bObj.book || bIdx + 1);
      if (Array.isArray(bObj.chapters)) {
        bObj.chapters.forEach((cObj: any, cIdx: number) => {
          const chapNum = Number(cObj.chapter || cIdx + 1);
          const vArr = Array.isArray(cObj) ? cObj : cObj.verses || [];
          vArr.forEach((vObj: any, vIdx: number) => {
            const text = typeof vObj === 'string' ? vObj : vObj.text;
            if (text) {
              verses.push({
                book: bookName,
                chapter: chapNum,
                verse: Number(vObj?.verse || vIdx + 1),
                text: String(text).trim(),
                translation: code,
              });
            }
          });
        });
      }
    });
    return { translationCode: code, verses };
  }

  // Case 4: Keyed dictionary `{ "Genesis": { "1": { "1": "In the beginning..." } } }`
  if (parsed && typeof parsed === 'object') {
    for (const [rawBook, chaptersObj] of Object.entries(parsed)) {
      if (!chaptersObj || typeof chaptersObj !== 'object') continue;
      const bookName = resolveBookName(rawBook);
      for (const [chapKey, versesObj] of Object.entries(chaptersObj as Record<string, any>)) {
        const chapNum = parseInt(chapKey, 10);
        if (isNaN(chapNum) || !versesObj || typeof versesObj !== 'object') continue;
        for (const [verseKey, verseText] of Object.entries(versesObj as Record<string, any>)) {
          const vNum = parseInt(verseKey, 10);
          if (!isNaN(vNum) && typeof verseText === 'string' && verseText.trim()) {
            verses.push({
              book: bookName,
              chapter: chapNum,
              verse: vNum,
              text: verseText.trim(),
              translation: defaultCode,
            });
          }
        }
      }
    }
  }

  return { translationCode: defaultCode, verses };
}

// ============================================================================
// IndexedDB High-Capacity Offline Storage for Full 66-Book Bibles (~31,102 verses)
// ============================================================================
const DB_NAME = 'freeworship_bible_store_v1';
const STORE_NAME = 'translations';

function openBibleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'code' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBibleToIndexedDB(code: string, verses: BibleVerse[]): Promise<void> {
  const db = await openBibleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ code, verses, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadAllBiblesFromIndexedDB(): Promise<Record<string, BibleVerse[]>> {
  try {
    const db = await openBibleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, BibleVerse[]> = {};
        for (const row of req.result || []) {
          if (row && row.code && Array.isArray(row.verses)) {
            result[row.code] = row.verses;
          }
        }
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export async function deleteBibleFromIndexedDB(code: string): Promise<void> {
  const db = await openBibleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(code);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Downloads a complete 66-book (31,102 verses) public domain Bible JSON (KJV or BBE)
 * and caches it permanently into IndexedDB for 100% offline sanctuary use.
 */
export async function fetchAndInstallPublicDomainBible(
  edition: 'en_kjv' | 'en_bbe'
): Promise<{ translationCode: string; verses: BibleVerse[] }> {
  const code = edition === 'en_kjv' ? 'KJV' : 'BBE';
  const url = `https://raw.githubusercontent.com/thiagobodruk/bible/master/json/${edition}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const rawText = await response.text();
  const parsed = parseBibleFile(rawText, `${code}.json`, code);
  if (parsed.verses.length > 0) {
    await saveBibleToIndexedDB(code, parsed.verses);
  }
  return parsed;
}

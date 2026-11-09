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
  { number: 1, name: 'Genesis', testament: 'OT', chapters: 50, aliases: ['gen', 'gn', 'ge', 'genesis'] },
  { number: 2, name: 'Exodus', testament: 'OT', chapters: 40, aliases: ['exod', 'ex', 'exo', 'exodo'] },
  { number: 3, name: 'Leviticus', testament: 'OT', chapters: 27, aliases: ['lev', 'lv', 'le', 'levitico'] },
  { number: 4, name: 'Numbers', testament: 'OT', chapters: 36, aliases: ['num', 'nm', 'nu', 'nb', 'mga bilang', 'bilang', 'numeros'] },
  { number: 5, name: 'Deuteronomy', testament: 'OT', chapters: 34, aliases: ['deut', 'dt', 'de', 'deuteronomio'] },
  { number: 6, name: 'Joshua', testament: 'OT', chapters: 24, aliases: ['josh', 'jos', 'jsh', 'josue'] },
  { number: 7, name: 'Judges', testament: 'OT', chapters: 21, aliases: ['judg', 'jdg', 'jg', 'jdgs', 'mga hukom', 'hukom', 'jueces'] },
  { number: 8, name: 'Ruth', testament: 'OT', chapters: 4, aliases: ['rth', 'ru', 'rut'] },
  { number: 9, name: '1 Samuel', testament: 'OT', chapters: 31, aliases: ['1sam', '1sm', '1sa', '1s', 'i samuel', 'first samuel', '1 samuel'] },
  { number: 10, name: '2 Samuel', testament: 'OT', chapters: 24, aliases: ['2sam', '2sm', '2sa', '2s', 'ii samuel', 'second samuel', '2 samuel'] },
  { number: 11, name: '1 Kings', testament: 'OT', chapters: 22, aliases: ['1kgs', '1ki', '1k', '1kings', 'i kings', 'first kings', '1 mga hari', '1 hari', '1 reyes'] },
  { number: 12, name: '2 Kings', testament: 'OT', chapters: 25, aliases: ['2kgs', '2ki', '2k', '2kings', 'ii kings', 'second kings', '2 mga hari', '2 hari', '2 reyes'] },
  { number: 13, name: '1 Chronicles', testament: 'OT', chapters: 29, aliases: ['1chr', '1ch', '1chron', 'i chronicles', '1 mga cronica', '1 cronica'] },
  { number: 14, name: '2 Chronicles', testament: 'OT', chapters: 36, aliases: ['2chr', '2ch', '2chron', 'ii chronicles', '2 mga cronica', '2 cronica'] },
  { number: 15, name: 'Ezra', testament: 'OT', chapters: 10, aliases: ['ezr', 'ez', 'esdras'] },
  { number: 16, name: 'Nehemiah', testament: 'OT', chapters: 13, aliases: ['neh', 'ne', 'nehemias'] },
  { number: 17, name: 'Esther', testament: 'OT', chapters: 10, aliases: ['esth', 'est', 'es', 'ester'] },
  { number: 18, name: 'Job', testament: 'OT', chapters: 42, aliases: ['jb'] },
  { number: 19, name: 'Psalms', testament: 'OT', chapters: 150, aliases: ['psalm', 'ps', 'psa', 'psm', 'pss', 'mga awit', 'awit', 'salmos'] },
  { number: 20, name: 'Proverbs', testament: 'OT', chapters: 31, aliases: ['prov', 'prv', 'pr', 'pro', 'mga kawikaan', 'kawikaan', 'proverbios'] },
  { number: 21, name: 'Ecclesiastes', testament: 'OT', chapters: 12, aliases: ['eccl', 'ecc', 'ec', 'qoh', 'eclesiastes', 'mangaral'] },
  { number: 22, name: 'Song of Solomon', testament: 'OT', chapters: 8, aliases: ['song', 'sos', 'so', 'canticles', 'song of songs', 'ang awit ni solomon', 'awit ng mga awit', 'cantares'] },
  { number: 23, name: 'Isaiah', testament: 'OT', chapters: 66, aliases: ['isa', 'is', 'isaias'] },
  { number: 24, name: 'Jeremiah', testament: 'OT', chapters: 52, aliases: ['jer', 'je', 'jr', 'jeremias'] },
  { number: 25, name: 'Lamentations', testament: 'OT', chapters: 5, aliases: ['lam', 'la', 'mga panaghoy', 'panaghoy', 'lamentaciones'] },
  { number: 26, name: 'Ezekiel', testament: 'OT', chapters: 48, aliases: ['ezek', 'eze', 'ezk', 'ezequiel'] },
  { number: 27, name: 'Daniel', testament: 'OT', chapters: 12, aliases: ['dan', 'da', 'dn'] },
  { number: 28, name: 'Hosea', testament: 'OT', chapters: 14, aliases: ['hos', 'ho', 'oseas'] },
  { number: 29, name: 'Joel', testament: 'OT', chapters: 3, aliases: ['jl', 'joe'] },
  { number: 30, name: 'Amos', testament: 'OT', chapters: 9, aliases: ['am'] },
  { number: 31, name: 'Obadiah', testament: 'OT', chapters: 1, aliases: ['obad', 'ob', 'obadias'] },
  { number: 32, name: 'Jonah', testament: 'OT', chapters: 4, aliases: ['jon', 'jnh', 'jonas'] },
  { number: 33, name: 'Micah', testament: 'OT', chapters: 7, aliases: ['mic', 'mc', 'mikas', 'miqueas'] },
  { number: 34, name: 'Nahum', testament: 'OT', chapters: 3, aliases: ['nah', 'na'] },
  { number: 35, name: 'Habakkuk', testament: 'OT', chapters: 3, aliases: ['hab', 'hb', 'habakuk', 'habacuc'] },
  { number: 36, name: 'Zephaniah', testament: 'OT', chapters: 3, aliases: ['zeph', 'zep', 'zp', 'zefanias', 'sofonias'] },
  { number: 37, name: 'Haggai', testament: 'OT', chapters: 2, aliases: ['hag', 'hg', 'hagai', 'hageo'] },
  { number: 38, name: 'Zechariah', testament: 'OT', chapters: 14, aliases: ['zech', 'zec', 'zc', 'zacarias'] },
  { number: 39, name: 'Malachi', testament: 'OT', chapters: 4, aliases: ['mal', 'ml', 'malakias'] },

  // New Testament (27 Books)
  { number: 40, name: 'Matthew', testament: 'NT', chapters: 28, aliases: ['matt', 'mt', 'mat', 'mateo'] },
  { number: 41, name: 'Mark', testament: 'NT', chapters: 16, aliases: ['mrk', 'mk', 'mr', 'marcos'] },
  { number: 42, name: 'Luke', testament: 'NT', chapters: 24, aliases: ['luk', 'lk', 'lu', 'lucas'] },
  { number: 43, name: 'John', testament: 'NT', chapters: 21, aliases: ['jhn', 'jn', 'joh', 'juan'] },
  { number: 44, name: 'Acts', testament: 'NT', chapters: 28, aliases: ['act', 'ac', 'acts of the apostles', 'mga gawa', 'gawa', 'hechos'] },
  { number: 45, name: 'Romans', testament: 'NT', chapters: 16, aliases: ['rom', 'ro', 'rm', 'mga taga-roma', 'taga-roma', 'roma', 'romanos'] },
  { number: 46, name: '1 Corinthians', testament: 'NT', chapters: 16, aliases: ['1cor', '1co', 'i corinthians', 'first corinthians', '1 mga taga-corinto', '1 corinto', '1 corintios'] },
  { number: 47, name: '2 Corinthians', testament: 'NT', chapters: 13, aliases: ['2cor', '2co', 'ii corinthians', 'second corinthians', '2 mga taga-corinto', '2 corinto', '2 corintios'] },
  { number: 48, name: 'Galatians', testament: 'NT', chapters: 6, aliases: ['gal', 'ga', 'mga taga-galacia', 'galacia', 'galatas'] },
  { number: 49, name: 'Ephesians', testament: 'NT', chapters: 6, aliases: ['eph', 'ep', 'mga taga-efeso', 'efeso', 'efesios'] },
  { number: 50, name: 'Philippians', testament: 'NT', chapters: 4, aliases: ['phil', 'php', 'ph', 'mga taga-filipos', 'filipos', 'filipenses'] },
  { number: 51, name: 'Colossians', testament: 'NT', chapters: 4, aliases: ['col', 'cl', 'mga taga-colosas', 'colosas', 'colosenses'] },
  { number: 52, name: '1 Thessalonians', testament: 'NT', chapters: 5, aliases: ['1thess', '1th', '1thes', 'i thessalonians', '1 mga taga-tesalonica', '1 tesalonica', '1 tesalonicenses'] },
  { number: 53, name: '2 Thessalonians', testament: 'NT', chapters: 3, aliases: ['2thess', '2th', '2thes', 'ii thessalonians', '2 mga taga-tesalonica', '2 tesalonica', '2 tesalonicenses'] },
  { number: 54, name: '1 Timothy', testament: 'NT', chapters: 6, aliases: ['1tim', '1ti', '1tm', 'i timothy', '1 timoteo'] },
  { number: 55, name: '2 Timothy', testament: 'NT', chapters: 4, aliases: ['2tim', '2ti', '2tm', 'ii timothy', '2 timoteo'] },
  { number: 56, name: 'Titus', testament: 'NT', chapters: 3, aliases: ['tit', 'ti', 'tito'] },
  { number: 57, name: 'Philemon', testament: 'NT', chapters: 1, aliases: ['phlm', 'phm', 'pm', 'filemon'] },
  { number: 58, name: 'Hebrews', testament: 'NT', chapters: 13, aliases: ['heb', 'he', 'mga hebreo', 'hebreo', 'hebreos'] },
  { number: 59, name: 'James', testament: 'NT', chapters: 5, aliases: ['jas', 'jm', 'jam', 'santiago'] },
  { number: 60, name: '1 Peter', testament: 'NT', chapters: 5, aliases: ['1pet', '1pe', '1pt', '1p', 'i peter', '1 pedro'] },
  { number: 61, name: '2 Peter', testament: 'NT', chapters: 3, aliases: ['2pet', '2pe', '2pt', '2p', 'ii peter', '2 pedro'] },
  { number: 62, name: '1 John', testament: 'NT', chapters: 5, aliases: ['1john', '1jn', '1jo', '1j', 'i john', '1 juan'] },
  { number: 63, name: '2 John', testament: 'NT', chapters: 1, aliases: ['2john', '2jn', '2jo', '2j', 'ii john', '2 juan'] },
  { number: 64, name: '3 John', testament: 'NT', chapters: 1, aliases: ['3john', '3jn', '3jo', '3j', 'iii john', '3 juan'] },
  { number: 65, name: 'Jude', testament: 'NT', chapters: 1, aliases: ['jud', 'jd', 'judas'] },
  { number: 66, name: 'Revelation', testament: 'NT', chapters: 22, aliases: ['rev', 're', 'rv', 'revelations', 'apocalypse', 'pahayag', 'apocalipsis'] },
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
  const compact = cleaned.replace(/[\s\-_]/g, '');
  for (const b of BIBLE_BOOKS_66) {
    if (
      b.name.toLowerCase() === cleaned ||
      b.name.toLowerCase().replace(/[\s\-_]/g, '') === compact ||
      b.aliases.includes(cleaned) ||
      b.aliases.map((a) => a.replace(/[\s\-_]/g, '')).includes(compact)
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

export interface BibleParseResult {
  translationCode: string;
  verses: BibleVerse[];
  allTranslations?: Record<string, BibleVerse[]>;
}

export const BUILTIN_BIBLE_FILES: Record<
  string,
  { code: string; label: string; file: string }
> = {
  KJV: { code: 'KJV', label: 'King James Version', file: 'kjv.json' },
  NIV: { code: 'NIV', label: 'New International Version', file: 'niv.json' },
  NASB: { code: 'NASB', label: 'New American Standard Bible', file: 'nasb.json' },
  ESV: { code: 'ESV', label: 'English Standard Version', file: 'esv.json' },
  'MBB 1901': { code: 'MBB 1901', label: 'Magandang Balita Bibliya (Ang Biblia 1901)', file: 'mbb1901.json' },
};

export type BuiltInBibleEdition = 'en_kjv' | 'en_niv' | 'en_nasb' | 'en_esv' | 'tl_abtag';

export const BIBLE_EDITIONS: Record<
  BuiltInBibleEdition,
  { code: string; label: string; file: string }
> = {
  en_kjv: { code: 'KJV', label: 'King James Version', file: 'kjv.json' },
  en_niv: { code: 'NIV', label: 'New International Version', file: 'niv.json' },
  en_nasb: { code: 'NASB', label: 'New American Standard Bible', file: 'nasb.json' },
  en_esv: { code: 'ESV', label: 'English Standard Version', file: 'esv.json' },
  tl_abtag: { code: 'MBB 1901', label: 'Magandang Balita Bibliya (Ang Biblia 1901)', file: 'mbb1901.json' },
};

/**
 * Universal Offline Bible Parser supporting:
 * 1. FreeWorship Backup Bundles & Exports: { format: "freeworship-backup-v1", bibles: { "KJV": [...] } }
 * 2. Direct Translation Maps: { "KJV": [...], "NIV": [...] }
 * 3. thiagobodruk JSON: [{ abbrev, name, chapters: [["v1", "v2"], ...] }]
 * 4. scrollmapper / flat JSON: [{ book_name | book, chapter, verse, text }] or { verses: [...] }
 * 5. Nested object dictionary: { "Genesis": { "1": { "1": "In the beginning..." } } } or { "Genesis": { "1": ["..."] } }
 * 6. Zefania / OpenSong XML: <XMLBIBLE><BIBLEBOOK><CHAPTER><VERS>
 */
export function parseBibleFile(
  content: string,
  fileName: string,
  customTranslationCode?: string
): BibleParseResult {
  let derivedCode = '';
  const fnUpper = fileName.toUpperCase();
  if (fnUpper.includes('KJV')) derivedCode = 'KJV';
  else if (fnUpper.includes('NIV')) derivedCode = 'NIV';
  else if (fnUpper.includes('NASB')) derivedCode = 'NASB';
  else if (fnUpper.includes('ESV')) derivedCode = 'ESV';
  else if (fnUpper.includes('MBB') || fnUpper.includes('TAGALOG') || fnUpper.includes('ABTAG') || fnUpper.includes('BIBLIA')) derivedCode = 'MBB 1901';
  else if (fnUpper.includes('BBE')) derivedCode = 'BBE';
  else if (fnUpper.includes('ASV')) derivedCode = 'ASV';
  else if (fnUpper.includes('WEB')) derivedCode = 'WEB';

  const defaultCode = (
    customTranslationCode ||
    derivedCode ||
    fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toUpperCase()
      .slice(0, 10) ||
    'CUSTOM'
  ).toUpperCase();

  const trimmed = content.trim().replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present
  const verses: BibleVerse[] = [];

  // Helper to normalize any verse item safely
  const normalizeVerseItem = (
    item: any,
    fallbackCode: string,
    fallbackBookName?: string,
    fallbackChap?: number,
    fallbackVerse?: number
  ): BibleVerse | null => {
    if (!item) return null;
    const text =
      typeof item === 'string'
        ? item
        : (item.text ||
           item.t ||
           item.scripture ||
           item.verseText ||
           item.verse_text ||
           item.content ||
           item.words ||
           item.body ||
           '');
    if (!text || typeof text !== 'string' || !text.trim()) return null;

    const rawBook =
      fallbackBookName ||
      item.book_name ||
      item.book ||
      item.b ||
      item.bookName ||
      item.book_id ||
      item.bookNumber ||
      item.book_number ||
      item.book_nr ||
      item.name ||
      1;
    const bookName = resolveBookName(rawBook);
    const chapter = Number(
      fallbackChap !== undefined
        ? fallbackChap
        : (item.chapter ?? item.c ?? item.chapterNumber ?? item.chapter_nr ?? item.chap ?? item.ch ?? 1)
    );
    const verse = Number(
      fallbackVerse !== undefined
        ? fallbackVerse
        : (item.verse ?? item.v ?? item.verseNumber ?? item.verse_nr ?? item.ver ?? 1)
    );
    let translation = String(
      customTranslationCode || item.translation || item.version || fallbackCode
    ).toUpperCase();
    if (translation.includes('MBB') || translation.includes('TAGALOG') || translation.includes('ABTAG')) {
      translation = 'MBB 1901';
    }

    return {
      book: bookName,
      chapter: isNaN(chapter) ? 1 : chapter,
      verse: isNaN(verse) ? 1 : verse,
      text: text.trim(),
      translation,
    };
  };

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

    return {
      translationCode: transCode,
      verses,
      allTranslations: { [transCode]: verses },
    };
  }

  // JSON Bible Parsing
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    throw new Error(`Invalid JSON syntax in Bible file: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Case 1: FreeWorship Backup Bundle / JSON with `bibles` key or `bible` key
  // E.g. { "format": "freeworship-backup-v1", "bibles": { "KJV": [...] } } OR { "bibles": [...] }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const biblesObj = parsed.bibles || parsed.bible;

    if (biblesObj && typeof biblesObj === 'object') {
      const allTranslations: Record<string, BibleVerse[]> = {};
      let primaryCode = '';

      if (Array.isArray(biblesObj)) {
        // bibles is an array of verse objects: [ { book, chapter, verse, text, translation } ]
        biblesObj.forEach((item: any) => {
          const code = (customTranslationCode || item?.translation || defaultCode).toString().toUpperCase();
          const norm = normalizeVerseItem(item, code);
          if (norm) {
            if (!primaryCode) primaryCode = norm.translation;
            if (!allTranslations[norm.translation]) {
              allTranslations[norm.translation] = [];
            }
            allTranslations[norm.translation].push(norm);
          }
        });
      } else {
        // bibles is a dictionary: { "KJV": [...], "NIV": [...] }
        for (const [rawCode, verseCollection] of Object.entries(biblesObj)) {
          let code = (customTranslationCode || rawCode || defaultCode).toUpperCase();
          if (code.includes('MBB') || code.includes('TAGALOG') || code.includes('ABTAG')) code = 'MBB 1901';
          if (!primaryCode) primaryCode = code;

          const list: BibleVerse[] = [];
          if (Array.isArray(verseCollection)) {
            verseCollection.forEach((v: any) => {
              const norm = normalizeVerseItem(v, code);
              if (norm) list.push(norm);
            });
          } else if (verseCollection && typeof verseCollection === 'object') {
            // Nested book/chapter map inside translation
            for (const [bName, chaps] of Object.entries(verseCollection as Record<string, any>)) {
              const resolvedB = resolveBookName(bName);
              if (chaps && typeof chaps === 'object') {
                for (const [cNum, vMap] of Object.entries(chaps as Record<string, any>)) {
                  const chap = parseInt(cNum, 10);
                  if (Array.isArray(vMap)) {
                    vMap.forEach((vText: any, vIdx: number) => {
                      const norm = normalizeVerseItem(vText, code, resolvedB, chap, vIdx + 1);
                      if (norm) list.push(norm);
                    });
                  } else if (vMap && typeof vMap === 'object') {
                    for (const [vNum, vText] of Object.entries(vMap as Record<string, any>)) {
                      const norm = normalizeVerseItem(vText, code, resolvedB, chap, parseInt(vNum, 10));
                      if (norm) list.push(norm);
                    }
                  }
                }
              }
            }
          }

          if (list.length > 0) {
            allTranslations[code] = list;
          }
        }
      }

      if (Object.keys(allTranslations).length > 0) {
        const activeCode = customTranslationCode || primaryCode || Object.keys(allTranslations)[0];
        const activeVerses = allTranslations[activeCode] || Object.values(allTranslations)[0] || [];
        return {
          translationCode: activeCode,
          verses: activeVerses,
          allTranslations,
        };
      }
    }

    // Case 2: Direct translation map { "KJV": [ { book, chapter, verse, text } ], "NIV": [...] }
    const topKeys = Object.keys(parsed);
    const nonMetaKeys = topKeys.filter(
      (k) => !['format', 'version', 'exportedAt', 'scope', 'settings', 'themes', 'songs', 'schedule'].includes(k)
    );
    const isDirectTranslationMap =
      nonMetaKeys.length > 0 &&
      nonMetaKeys.every((k) => Array.isArray(parsed[k])) &&
      nonMetaKeys.some((k) => {
        const arr = parsed[k];
        return arr.length > 0 && (arr[0]?.text || arr[0]?.t || arr[0]?.book || arr[0]?.scripture);
      });

    if (isDirectTranslationMap) {
      const allTranslations: Record<string, BibleVerse[]> = {};
      let primaryCode = '';

      for (const rawCode of nonMetaKeys) {
        const verseArray = parsed[rawCode];
        if (!Array.isArray(verseArray)) continue;
        let code = (customTranslationCode || rawCode || defaultCode).toUpperCase();
        if (code.includes('MBB') || code.includes('TAGALOG') || code.includes('ABTAG')) code = 'MBB 1901';
        if (!primaryCode) primaryCode = code;

        const list: BibleVerse[] = [];
        verseArray.forEach((v: any) => {
          const norm = normalizeVerseItem(v, code);
          if (norm) list.push(norm);
        });

        if (list.length > 0) {
          allTranslations[code] = list;
        }
      }

      if (Object.keys(allTranslations).length > 0) {
        const activeCode = customTranslationCode || primaryCode || Object.keys(allTranslations)[0];
        const activeVerses = allTranslations[activeCode] || Object.values(allTranslations)[0] || [];
        return {
          translationCode: activeCode,
          verses: activeVerses,
          allTranslations,
        };
      }
    }
  }

  // Case 3: Root Array
  if (Array.isArray(parsed)) {
    // Subcase 3A: thiagobodruk format -> [{ abbrev: "gn", name: "Genesis", chapters: [ ["v1", "v2"] ] }]
    if (parsed.length > 0 && Array.isArray(parsed[0].chapters)) {
      const list: BibleVerse[] = [];
      parsed.forEach((bookObj: any, bIdx: number) => {
        const bookName = resolveBookName(bookObj.name || bookObj.book || bookObj.abbrev || bIdx + 1);
        if (Array.isArray(bookObj.chapters)) {
          bookObj.chapters.forEach((chapArr: any, cIdx: number) => {
            if (Array.isArray(chapArr)) {
              chapArr.forEach((verseItem: any, vIdx: number) => {
                const norm = normalizeVerseItem(
                  verseItem,
                  defaultCode,
                  bookName,
                  cIdx + 1,
                  Number(verseItem?.verse || verseItem?.v || vIdx + 1)
                );
                if (norm) list.push(norm);
              });
            }
          });
        }
      });
      return {
        translationCode: defaultCode,
        verses: list,
        allTranslations: { [defaultCode]: list },
      };
    }

    // Subcase 3B: Flat array of verse objects -> [{ book, chapter, verse, text, translation }]
    const allTranslations: Record<string, BibleVerse[]> = {};
    let detectedCode = defaultCode;
    const list: BibleVerse[] = [];

    parsed.forEach((item: any) => {
      const code = (customTranslationCode || item?.translation || item?.version || defaultCode).toString().toUpperCase();
      const norm = normalizeVerseItem(item, code);
      if (norm) {
        list.push(norm);
        if (!allTranslations[norm.translation]) {
          allTranslations[norm.translation] = [];
        }
        allTranslations[norm.translation].push(norm);
        detectedCode = norm.translation;
      }
    });

    const activeCode = customTranslationCode || detectedCode;
    const activeVerses = allTranslations[activeCode] || list;
    return {
      translationCode: activeCode,
      verses: activeVerses,
      allTranslations: Object.keys(allTranslations).length > 0 ? allTranslations : { [activeCode]: list },
    };
  }

  // Case 4: Object with `verses` array (e.g. scrollmapper / bible-api export)
  const versesArray = parsed?.verses || parsed?.data || parsed?.items;
  if (Array.isArray(versesArray)) {
    const code = (
      customTranslationCode ||
      parsed.translation_id ||
      parsed.translation ||
      parsed.abbreviation ||
      parsed.version ||
      defaultCode
    )
      .toString()
      .toUpperCase();
    const list: BibleVerse[] = [];
    versesArray.forEach((item: any) => {
      const norm = normalizeVerseItem(item, code);
      if (norm) list.push(norm);
    });
    return {
      translationCode: code,
      verses: list,
      allTranslations: { [code]: list },
    };
  }

  // Case 5: Object with `books` array
  if (parsed && Array.isArray(parsed.books)) {
    const code = (customTranslationCode || parsed.translation || parsed.version || defaultCode)
      .toString()
      .toUpperCase();
    const list: BibleVerse[] = [];
    parsed.books.forEach((bObj: any, bIdx: number) => {
      const bookName = resolveBookName(bObj.name || bObj.book || bIdx + 1);
      if (Array.isArray(bObj.chapters)) {
        bObj.chapters.forEach((cObj: any, cIdx: number) => {
          const chapNum = Number(cObj.chapter || cIdx + 1);
          const vArr = Array.isArray(cObj) ? cObj : cObj.verses || [];
          vArr.forEach((vObj: any, vIdx: number) => {
            const norm = normalizeVerseItem(
              vObj,
              code,
              bookName,
              chapNum,
              Number(vObj?.verse || vObj?.v || vIdx + 1)
            );
            if (norm) list.push(norm);
          });
        });
      }
    });
    return {
      translationCode: code,
      verses: list,
      allTranslations: { [code]: list },
    };
  }

  // Case 6: Keyed dictionary `{ "Genesis": { "1": { "1": "In the beginning..." } } }` or `{ "Genesis": { "1": ["..."] } }`
  if (parsed && typeof parsed === 'object') {
    const list: BibleVerse[] = [];
    for (const [rawBook, chaptersObj] of Object.entries(parsed)) {
      if (!chaptersObj || typeof chaptersObj !== 'object') continue;
      if (['format', 'version', 'exportedAt', 'scope', 'settings', 'bibles', 'bible', 'songs', 'schedule'].includes(rawBook)) continue;

      const bookName = resolveBookName(rawBook);

      if (Array.isArray(chaptersObj)) {
        // Book is an array of verses or chapters
        chaptersObj.forEach((chapOrVerse: any, idx: number) => {
          if (chapOrVerse && typeof chapOrVerse === 'object') {
            const norm = normalizeVerseItem(chapOrVerse, defaultCode, bookName);
            if (norm) list.push(norm);
          } else if (typeof chapOrVerse === 'string') {
            const norm = normalizeVerseItem(chapOrVerse, defaultCode, bookName, 1, idx + 1);
            if (norm) list.push(norm);
          }
        });
      } else {
        for (const [chapKey, versesObj] of Object.entries(chaptersObj as Record<string, any>)) {
          const chapNum = parseInt(chapKey, 10);
          if (isNaN(chapNum) || !versesObj) continue;

          if (Array.isArray(versesObj)) {
            // Chapter is array of verse strings: ["In the beginning...", "And the earth..."]
            versesObj.forEach((vText: any, vIdx: number) => {
              const norm = normalizeVerseItem(vText, defaultCode, bookName, chapNum, vIdx + 1);
              if (norm) list.push(norm);
            });
          } else if (typeof versesObj === 'object') {
            // Chapter is object: { "1": "In the beginning...", "2": "And the earth..." }
            for (const [verseKey, verseText] of Object.entries(versesObj as Record<string, any>)) {
              const vNum = parseInt(verseKey, 10);
              const norm = normalizeVerseItem(
                verseText,
                defaultCode,
                bookName,
                chapNum,
                isNaN(vNum) ? undefined : vNum
              );
              if (norm) list.push(norm);
            }
          }
        }
      }
    }
    if (list.length > 0) {
      return {
        translationCode: defaultCode,
        verses: list,
        allTranslations: { [defaultCode]: list },
      };
    }
  }

  return {
    translationCode: defaultCode,
    verses: [],
    allTranslations: {},
  };
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
 * Loads a built-in 66-book Bible (KJV, NIV, NASB, ESV, MBB 1901) directly from
 * local storage, desktop IPC, or bundled application assets.
 * 100% offline, zero internet or download required.
 */
export async function loadBuiltInBible(code: string): Promise<BibleVerse[]> {
  const normCode = (code || '').toUpperCase().trim();
  const entry = Object.entries(BUILTIN_BIBLE_FILES).find(
    ([k]) =>
      k.toUpperCase() === normCode ||
      (normCode.includes('MBB') && k === 'MBB 1901') ||
      (normCode.includes('TAGALOG') && k === 'MBB 1901') ||
      (normCode.includes('ABTAG') && k === 'MBB 1901')
  );
  if (!entry) return [];
  const [canonicalCode, meta] = entry;

  // 1. Check IndexedDB cache first
  try {
    const allCached = await loadAllBiblesFromIndexedDB();
    if (allCached[canonicalCode] && allCached[canonicalCode].length > 20000) {
      return allCached[canonicalCode];
    }
  } catch (err) {
    console.warn('IndexedDB check failed, loading from local bundle:', err);
  }

  // 2. In Electron desktop, read directly from local disk via IPC
  if (typeof window !== 'undefined' && window.freeworshipDesktop?.loadBuiltInBibleFile) {
    try {
      const fileText = await window.freeworshipDesktop.loadBuiltInBibleFile(meta.file);
      if (fileText) {
        const parsed = JSON.parse(fileText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveBibleToIndexedDB(canonicalCode, parsed).catch(() => {});
          return parsed as BibleVerse[];
        }
      }
    } catch (err) {
      console.warn('Desktop IPC bible read error, falling back to fetch:', err);
    }
  }

  // 3. Bundled asset fetch (Android Capacitor & Web browser)
  const candidateUrls = [
    `./bibles/${meta.file}`,
    `bibles/${meta.file}`,
    `/bibles/${meta.file}`,
  ];
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveBibleToIndexedDB(canonicalCode, data).catch(() => {});
          return data as BibleVerse[];
        }
      }
    } catch {
      // try next candidate
    }
  }

  return [];
}

export async function loadAllBuiltInBibles(): Promise<Record<string, BibleVerse[]>> {
  const result: Record<string, BibleVerse[]> = {};
  const codes = ['KJV', 'NIV', 'NASB', 'ESV', 'MBB 1901'];
  for (const c of codes) {
    try {
      const verses = await loadBuiltInBible(c);
      if (verses.length > 0) {
        result[c] = verses;
      }
    } catch (err) {
      console.warn(`Could not preload ${c}:`, err);
    }
  }
  return result;
}

export async function fetchAndInstallPublicDomainBible(
  edition: BuiltInBibleEdition | 'en_kjv' | 'en_bbe' | 'en_niv' | 'en_nasb' | 'en_esv' | 'tl_abtag'
): Promise<{ translationCode: string; verses: BibleVerse[] }> {
  const editionToCode: Record<string, string> = {
    en_kjv: 'KJV',
    en_niv: 'NIV',
    en_nasb: 'NASB',
    en_esv: 'ESV',
    tl_abtag: 'MBB 1901',
  };
  const targetCode = editionToCode[edition] || 'KJV';
  const verses = await loadBuiltInBible(targetCode);
  if (verses.length > 0) {
    return { translationCode: targetCode, verses };
  }
  return { translationCode: targetCode, verses: [] };
}

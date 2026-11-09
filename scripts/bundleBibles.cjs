const fs = require('fs');
const path = require('path');
const https = require('https');

const CANONICAL_66_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
  'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const BIBLES = [
  { url: 'en_kjv.json', code: 'KJV', fileName: 'kjv.json' },
  { url: 'en_niv.json', code: 'NIV', fileName: 'niv.json' },
  { url: 'en_nasb.json', code: 'NASB', fileName: 'nasb.json' },
  { url: 'en_esv.json', code: 'ESV', fileName: 'esv.json' },
  { url: 'tl_abtag.json', code: 'MBB 1901', fileName: 'mbb1901.json' },
];

const outDir = path.resolve(__dirname, '../public/bibles');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function fetchBible(url) {
  return new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/' + url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}: status ${res.statusCode}`));
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const b of BIBLES) {
    console.log(`Fetching and compiling ${b.code} (${b.url})...`);
    const rawData = await fetchBible(b.url);
    if (!Array.isArray(rawData) || rawData.length !== 66) {
      throw new Error(`Unexpected book count in ${b.url}: ${rawData?.length}`);
    }

    const compiledVerses = [];
    rawData.forEach((bObj, bIdx) => {
      const canonicalBook = CANONICAL_66_BOOKS[bIdx];
      if (Array.isArray(bObj.chapters)) {
        bObj.chapters.forEach((versesArr, cIdx) => {
          const chapterNum = cIdx + 1;
          if (Array.isArray(versesArr)) {
            versesArr.forEach((verseText, vIdx) => {
              const text = String(verseText || '').trim();
              if (text) {
                compiledVerses.push({
                  book: canonicalBook,
                  chapter: chapterNum,
                  verse: vIdx + 1,
                  text: text,
                  translation: b.code,
                });
              }
            });
          }
        });
      }
    });

    const targetPath = path.join(outDir, b.fileName);
    fs.writeFileSync(targetPath, JSON.stringify(compiledVerses), 'utf8');
    const stat = fs.statSync(targetPath);
    console.log(`✓ Compiled ${b.code}: ${compiledVerses.length} verses -> ${targetPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  console.log('\nAll 5 Built-in Bibles successfully compiled into public/bibles/!');
}

main().catch(err => {
  console.error('Error bundling bibles:', err);
  process.exit(1);
});

import JSZip from 'jszip';
import { MediaAsset, ScheduleItem, Slide, SongItem } from '../types/worship';

function mapShorthandSectionTag(code: string): string {
  const c = code.trim().toLowerCase();
  if (/^v(\d*)$/.test(c)) {
    const num = c.slice(1);
    return num ? `Verse ${num}` : 'Verse 1';
  }
  if (/^c(\d*)$/.test(c)) {
    const num = c.slice(1);
    return num && num !== '1' ? `Chorus ${num}` : 'Chorus';
  }
  if (/^b(\d*)$/.test(c)) {
    return 'Bridge';
  }
  if (/^p(\d*)$/.test(c)) {
    return 'Pre-Chorus';
  }
  if (/^t(\d*)$/.test(c)) {
    return 'Tag';
  }
  if (/^i(\d*)$/.test(c)) {
    return 'Intro';
  }
  if (/^[eo](\d*)$/.test(c)) {
    return 'Outro';
  }
  return code.trim() || 'Verse 1';
}

/**
 * Extracts inline [G] [Am7] [C/G] chords from a lyric line so stage monitors
 * see the chords while the congregation projector sees clean lyrics.
 */
function separateChordsFromLyricLine(line: string): { cleanLyric: string; chords: string[] } {
  const chords: string[] = [];
  const chordRegex = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?)\]/g;
  let match: RegExpExecArray | null;
  while ((match = chordRegex.exec(line)) !== null) {
    chords.push(match[1]);
  }
  const cleanLyric = line.replace(chordRegex, '').replace(/\s{2,}/g, ' ').trim();
  return { cleanLyric, chords };
}

/**
 * 1. OpenLyrics (.xml) & OpenSong (.xml) Song Importer
 */
export function importOpenLyricsOrXmlSong(xmlContent: string, fileName: string): SongItem {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent.trim(), 'text/xml');

  const fallbackTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Check if OpenLyrics format (<properties><titles><title>)
  const olTitle =
    doc.querySelector('properties > titles > title')?.textContent?.trim() ||
    doc.querySelector('title')?.textContent?.trim() ||
    fallbackTitle;

  const authorNodes = Array.from(doc.querySelectorAll('properties > authors > author, author'));
  const author =
    authorNodes
      .map((a) => a.textContent?.trim())
      .filter(Boolean)
      .join(', ') || 'Imported Worship Song';

  const ccliNumber =
    doc.querySelector('properties > ccliNo, ccli')?.textContent?.trim() || '';

  const musicalKey =
    doc.querySelector('properties > key, key')?.textContent?.trim() || 'C';

  const tempoRaw =
    doc.querySelector('properties > tempo, tempo')?.textContent?.trim() || '';
  const bpm = parseInt(tempoRaw, 10) || undefined;

  const slides: Slide[] = [];

  // OpenLyrics <lyrics><verse name="v1"><lines>...</lines></verse></lyrics>
  const verseNodes = Array.from(doc.querySelectorAll('lyrics > verse'));
  if (verseNodes.length > 0) {
    verseNodes.forEach((vNode, vIdx) => {
      const nameAttr = vNode.getAttribute('name') || `v${vIdx + 1}`;
      const tag = mapShorthandSectionTag(nameAttr);

      // Collect lines inside <lines> (splitting on <br/>, <brk/>, or newlines)
      const linesContainers = Array.from(vNode.querySelectorAll('lines'));
      const rawLines: string[] = [];

      if (linesContainers.length > 0) {
        linesContainers.forEach((lc) => {
          // Replace <br/> or <brk/> with newline before reading text
          const clone = lc.cloneNode(true) as Element;
          Array.from(clone.querySelectorAll('br, brk')).forEach((br) => {
            br.replaceWith('\n');
          });
          // Remove <chord> tags or collect them
          const chordNames = Array.from(clone.querySelectorAll('chord'))
            .map((ch) => ch.getAttribute('name') || ch.textContent || '')
            .filter(Boolean);
          Array.from(clone.querySelectorAll('chord')).forEach((ch) => ch.remove());

          const split = (clone.textContent || '')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          rawLines.push(...split);

          if (split.length > 0) {
            // Chunk into max 4 lines per slide
            for (let i = 0; i < split.length; i += 4) {
              slides.push({
                id: `ol-${Date.now()}-${vIdx}-${i}`,
                tag,
                lines: split.slice(i, i + 4),
                chords: chordNames.length > 0 ? chordNames.join('  ') : undefined,
              });
            }
          }
        });
      } else {
        const split = (vNode.textContent || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        for (let i = 0; i < split.length; i += 4) {
          slides.push({
            id: `ol-${Date.now()}-${vIdx}-${i}`,
            tag,
            lines: split.slice(i, i + 4),
          });
        }
      }
    });
  } else {
    // OpenSong XML format (<lyrics>[V1]\n...\n[C]\n...</lyrics>)
    const openSongLyrics = doc.querySelector('lyrics')?.textContent || '';
    if (openSongLyrics.trim()) {
      const parsedFromText = importChordProOrTextSong(openSongLyrics, olTitle);
      slides.push(...parsedFromText.slides);
    }
  }

  if (slides.length === 0) {
    slides.push({
      id: `ol-fallback-${Date.now()}`,
      tag: 'Verse 1',
      lines: [olTitle],
    });
  }

  return {
    id: `song-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: olTitle,
    author,
    ccliNumber,
    musicalKey,
    bpm,
    defaultBackgroundId: 'bg-aurora',
    slides,
  };
}

/**
 * 2. ChordPro (.cho, .crd, .pro) & Structured Plain Text (.txt) Song Importer
 */
export function importChordProOrTextSong(rawText: string, fileName: string): SongItem {
  let title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  let author = 'Imported Song';
  let musicalKey = 'G';
  let ccliNumber = '';
  let bpm: number | undefined;

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const slides: Slide[] = [];

  let currentTag = 'Verse 1';
  let currentBuffer: string[] = [];
  let currentChords: string[] = [];

  const flushSlide = () => {
    if (currentBuffer.length === 0) return;
    for (let i = 0; i < currentBuffer.length; i += 4) {
      slides.push({
        id: `cho-${Date.now()}-${slides.length}-${i}`,
        tag: currentTag,
        lines: currentBuffer.slice(i, i + 4),
        chords: currentChords.length > 0 ? currentChords.join(' | ') : undefined,
      });
    }
    currentBuffer = [];
    currentChords = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Blank line flushes current stanza
    if (!trimmed) {
      flushSlide();
      continue;
    }

    // ChordPro metadata directives: {title: ...}, {artist: ...}, {key: ...}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z_]+)(?::\s*(.+))?\}$/);
    if (directiveMatch) {
      const key = directiveMatch[1].toLowerCase();
      const val = (directiveMatch[2] || '').trim();
      if (key === 'title' || key === 't') title = val || title;
      else if (key === 'subtitle' || key === 'st' || key === 'artist' || key === 'author' || key === 'a')
        author = val || author;
      else if (key === 'key' || key === 'k') musicalKey = val || musicalKey;
      else if (key === 'ccli') ccliNumber = val;
      else if (key === 'tempo' || key === 'bpm') bpm = parseInt(val, 10) || bpm;
      else if (key === 'soc' || key === 'start_of_chorus') {
        flushSlide();
        currentTag = val || 'Chorus';
      } else if (key === 'sov' || key === 'start_of_verse') {
        flushSlide();
        currentTag = val || 'Verse 1';
      } else if (key === 'sob' || key === 'start_of_bridge') {
        flushSlide();
        currentTag = val || 'Bridge';
      } else if (key === 'comment' || key === 'c') {
        flushSlide();
        currentTag = mapShorthandSectionTag(val);
      }
      continue;
    }

    // Section header like [Verse 1], [Chorus], [V1], [C], or "Verse 1:"
    const bracketHeader = trimmed.match(/^\[([A-Za-z0-9\s\-]+)\]$/);
    if (bracketHeader) {
      // Ensure it's not a single chord like [G]
      const inside = bracketHeader[1].trim();
      if (!/^[A-G][#b]?(?:m|maj|min|sus|dim|aug|[0-9])*$/.test(inside) || /^[VCBPTI][0-9]*$/i.test(inside)) {
        flushSlide();
        currentTag = mapShorthandSectionTag(inside);
        continue;
      }
    }

    const colonHeader = trimmed.match(/^(Verse\s*\d*|Chorus\s*\d*|Pre-Chorus|Bridge|Tag|Intro|Outro)\s*:?$/i);
    if (colonHeader) {
      flushSlide();
      currentTag = colonHeader[1].trim();
      continue;
    }

    // OpenSong leading dot chord line (e.g., ".G    C    D")
    if (trimmed.startsWith('.') && trimmed.length > 1) {
      currentChords.push(trimmed.slice(1).trim());
      continue;
    }

    // Extract inline ChordPro chords [G]Amazing [C]grace
    const { cleanLyric, chords } = separateChordsFromLyricLine(trimmed.replace(/^[0-9 ]+/, (m) => m));
    if (chords.length > 0) {
      currentChords.push(chords.join(' '));
    }
    if (cleanLyric) {
      currentBuffer.push(cleanLyric);
    }
  }

  flushSlide();

  return {
    id: `song-cho-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    author,
    ccliNumber,
    musicalKey,
    bpm,
    defaultBackgroundId: 'bg-aurora',
    slides:
      slides.length > 0
        ? slides
        : [
            {
              id: `cho-empty-${Date.now()}`,
              tag: 'Verse 1',
              lines: [title],
            },
          ],
  };
}

/**
 * 3. PowerPoint (.pptx) Presentation Importer
 * Extracts all slide text blocks (<a:p>/<a:t>), speaker notes, and embedded slide images
 * directly in the client using JSZip.
 */
export async function importPptxFile(
  file: File,
  defaultThemeId: string
): Promise<{ scheduleItem: ScheduleItem; extractedMedia: MediaAsset[] }> {
  const zip = await JSZip.loadAsync(file);
  const deckTitle = file.name.replace(/\.pptx$/i, '');

  // Find all slide XML files: ppt/slides/slide1.xml, slide2.xml, ...
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  const parser = new DOMParser();
  const slides: Slide[] = [];
  const extractedMedia: MediaAsset[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideNum = parseInt(slidePath.match(/slide(\d+)\.xml/i)?.[1] || String(i + 1), 10);
    const xmlStr = await zip.files[slidePath].async('text');
    const doc = parser.parseFromString(xmlStr, 'text/xml');

    // Extract paragraphs (<a:p>) and text runs (<a:t>)
    const paragraphs = Array.from(doc.getElementsByTagName('a:p'));
    const slideLines: string[] = [];

    for (const p of paragraphs) {
      const tNodes = Array.from(p.getElementsByTagName('a:t'));
      const paraText = tNodes
        .map((t) => t.textContent || '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (paraText) {
        slideLines.push(paraText);
      }
    }

    // Check speaker notes in ppt/notesSlides/notesSlide{N}.xml
    let speakerNote = '';
    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    if (zip.files[notesPath]) {
      try {
        const notesXml = await zip.files[notesPath].async('text');
        const notesDoc = parser.parseFromString(notesXml, 'text/xml');
        const noteParas = Array.from(notesDoc.getElementsByTagName('a:p'))
          .map((p) =>
            Array.from(p.getElementsByTagName('a:t'))
              .map((t) => t.textContent || '')
              .join('')
              .trim()
          )
          .filter((txt) => txt && !/^\d+$/.test(txt));
        if (noteParas.length > 0) {
          speakerNote = noteParas.join(' • ').slice(0, 140);
        }
      } catch {}
    }

    // Check if slide has an embedded background/picture in ppt/slides/_rels/slide{N}.xml.rels
    let backgroundOverrideId: string | undefined;
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    if (zip.files[relsPath]) {
      try {
        const relsXml = await zip.files[relsPath].async('text');
        const relsDoc = parser.parseFromString(relsXml, 'text/xml');
        const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'));
        const imgRel = relNodes.find((r) =>
          (r.getAttribute('Type') || '').toLowerCase().includes('/image')
        );
        if (imgRel) {
          const target = imgRel.getAttribute('Target') || '';
          const mediaPath = target.replace(/^\.\.\//, 'ppt/');
          const mediaFile = zip.files[mediaPath];
          if (mediaFile && /\.(png|jpe?g|webp|gif)$/i.test(mediaPath)) {
            const blob = await mediaFile.async('blob');
            const objectUrl = URL.createObjectURL(blob);
            const mediaId = `pptx-img-${Date.now()}-${slideNum}`;
            extractedMedia.push({
              id: mediaId,
              name: `${deckTitle} (Slide ${slideNum})`,
              category: 'Custom Upload',
              type: 'image',
              previewGradient: 'linear-gradient(135deg, #1e293b, #0f172a)',
              mediaUrl: objectUrl,
            });
            backgroundOverrideId = mediaId;
          }
        }
      } catch {}
    }

    slides.push({
      id: `pptx-slide-${Date.now()}-${slideNum}`,
      tag: `Slide ${slideNum}`,
      lines:
        slideLines.length > 0
          ? slideLines.slice(0, 6)
          : backgroundOverrideId
          ? ['']
          : [`[Slide ${slideNum} — ${deckTitle}]`],
      subtext: speakerNote || `${deckTitle} • Slide ${slideNum} of ${slidePaths.length}`,
      backgroundOverrideId,
    });
  }

  const scheduleItem: ScheduleItem = {
    id: `sched-pptx-${Date.now()}`,
    type: 'presentation',
    title: deckTitle,
    subtitle: `Imported PowerPoint Deck • ${slides.length} Slides`,
    backgroundId: extractedMedia[0]?.id || 'bg-slate-minimal',
    themeId: defaultThemeId,
    slides:
      slides.length > 0
        ? slides
        : [
            {
              id: `pptx-empty-${Date.now()}`,
              tag: 'Slide 1',
              lines: [deckTitle, 'Imported PowerPoint Presentation'],
            },
          ],
  };

  return { scheduleItem, extractedMedia };
}

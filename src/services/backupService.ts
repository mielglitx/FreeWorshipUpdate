import {
  BibleVerse,
  MediaAsset,
  MultiScreenRoutingSettings,
  ScheduleItem,
  SongItem,
  ThemeTemplate,
} from '../types/worship';

export interface FreeWorshipBackupBundle {
  format: 'freeworship-backup-v1';
  version: '1.0.0';
  exportedAt: string;
  scope: 'full' | 'songs' | 'bibles' | 'schedule' | 'settings';
  songs?: SongItem[];
  bibles?: Record<string, BibleVerse[]>;
  schedule?: ScheduleItem[];
  settings?: {
    themes?: ThemeTemplate[];
    routingSettings?: MultiScreenRoutingSettings;
    logoTitle?: string;
    logoSubtitle?: string;
    mediaPool?: MediaAsset[];
  };
}

/**
 * Triggers a browser / Electron file download for any JSON or XML string.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'application/json;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export function getDateStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Exports a single SongItem to standard OpenLyrics 0.8 XML format.
 */
export function exportSongToOpenLyricsXml(song: SongItem): string {
  const esc = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const versesXml = song.slides
    .map((slide, idx) => {
      const tagRaw = (slide.tag || `v${idx + 1}`).toLowerCase();
      let nameAttr = `v${idx + 1}`;
      if (tagRaw.includes('chorus')) nameAttr = 'c1';
      else if (tagRaw.includes('bridge')) nameAttr = 'b1';
      else if (tagRaw.includes('pre')) nameAttr = 'p1';
      else if (tagRaw.includes('tag') || tagRaw.includes('outro')) nameAttr = 'e1';
      else {
        const m = tagRaw.match(/verse\s*(\d+)/i);
        if (m) nameAttr = `v${m[1]}`;
      }

      const linesJoined = slide.lines.map((l) => esc(l)).join('<br/>');
      const chordComment = slide.chords ? `\n      <!-- Chords: ${esc(slide.chords)} -->` : '';
      return `    <verse name="${esc(nameAttr)}">${chordComment}
      <lines>${linesJoined}</lines>
    </verse>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.8" createdIn="FreeWorship Studio 1.0">
  <properties>
    <titles>
      <title>${esc(song.title)}</title>
    </titles>
    <authors>
      <author>${esc(song.author || 'Unknown')}</author>
    </authors>
    <ccliNo>${esc(song.ccliNumber || '')}</ccliNo>
    <key>${esc(song.musicalKey || 'C')}</key>
    ${song.bpm ? `<tempo type="bpm">${song.bpm}</tempo>` : ''}
  </properties>
  <lyrics>
${versesXml}
  </lyrics>
</song>`;
}

/**
 * Exports Songs Library as a JSON package (`freeworship-songs-*.fwx.json`).
 */
export function exportSongsLibraryJson(songs: SongItem[]): void {
  const bundle: FreeWorshipBackupBundle = {
    format: 'freeworship-backup-v1',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    scope: 'songs',
    songs,
  };
  downloadTextFile(
    `FreeWorship-Songs-${songs.length}-${getDateStamp()}.fwx.json`,
    JSON.stringify(bundle, null, 2)
  );
}

/**
 * Exports a single Bible translation or all offline Bibles to JSON.
 */
export function exportBiblesJson(
  biblesMap: Record<string, BibleVerse[]>,
  specificTranslation?: string
): void {
  const exportMap: Record<string, BibleVerse[]> = {};
  if (specificTranslation && biblesMap[specificTranslation]) {
    exportMap[specificTranslation] = biblesMap[specificTranslation];
  } else {
    Object.assign(exportMap, biblesMap);
  }

  const label = specificTranslation || `All-${Object.keys(exportMap).length}-Bibles`;
  const bundle: FreeWorshipBackupBundle = {
    format: 'freeworship-backup-v1',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    scope: 'bibles',
    bibles: exportMap,
  };
  downloadTextFile(
    `FreeWorship-Bible-${label}-${getDateStamp()}.fwx.json`,
    JSON.stringify(bundle, null, 2)
  );
}

/**
 * Exports the current Service Schedule (Run-of-Show) along with referenced custom themes.
 */
export function exportScheduleJson(
  schedule: ScheduleItem[],
  themes?: ThemeTemplate[]
): void {
  const bundle: FreeWorshipBackupBundle = {
    format: 'freeworship-backup-v1',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    scope: 'schedule',
    schedule,
    settings: themes ? { themes } : undefined,
  };
  downloadTextFile(
    `FreeWorship-Schedule-${getDateStamp()}.fws.json`,
    JSON.stringify(bundle, null, 2)
  );
}

/**
 * Exports Display & Boundary Settings, Multi-Screen Routing, Themes, and Logo Settings.
 */
export function exportSettingsJson(settings: {
  themes: ThemeTemplate[];
  routingSettings: MultiScreenRoutingSettings;
  logoTitle: string;
  logoSubtitle: string;
}): void {
  const bundle: FreeWorshipBackupBundle = {
    format: 'freeworship-backup-v1',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    scope: 'settings',
    settings,
  };
  downloadTextFile(
    `FreeWorship-Settings-Themes-${getDateStamp()}.fwsettings.json`,
    JSON.stringify(bundle, null, 2)
  );
}

/**
 * Exports a complete Sanctuary Backup (Songs + Bibles + Service Schedule + Themes + Display Settings).
 */
export function exportFullBackupJson(data: {
  songs: SongItem[];
  bibles: Record<string, BibleVerse[]>;
  schedule: ScheduleItem[];
  themes: ThemeTemplate[];
  routingSettings: MultiScreenRoutingSettings;
  logoTitle: string;
  logoSubtitle: string;
  mediaPool?: MediaAsset[];
}): void {
  const bundle: FreeWorshipBackupBundle = {
    format: 'freeworship-backup-v1',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    scope: 'full',
    songs: data.songs,
    bibles: data.bibles,
    schedule: data.schedule,
    settings: {
      themes: data.themes,
      routingSettings: data.routingSettings,
      logoTitle: data.logoTitle,
      logoSubtitle: data.logoSubtitle,
      mediaPool: data.mediaPool?.filter((m) => !m.mediaUrl?.startsWith('blob:')),
    },
  };
  downloadTextFile(
    `FreeWorship-FullBackup-${getDateStamp()}.fwbackup.json`,
    JSON.stringify(bundle, null, 2)
  );
}

/**
 * Parses an uploaded JSON file and normalizes it into a FreeWorshipBackupBundle
 * (supports both wrapped `freeworship-backup-v1` bundles and raw arrays of songs/schedules/settings).
 */
export function parseBackupOrModuleJson(rawText: string): FreeWorshipBackupBundle {
  const parsed = JSON.parse(rawText);

  if (parsed && parsed.format === 'freeworship-backup-v1') {
    return parsed as FreeWorshipBackupBundle;
  }

  // Raw array detection (e.g. raw SongItem[] or ScheduleItem[])
  if (Array.isArray(parsed)) {
    const first = parsed[0];
    if (first && Array.isArray(first.slides) && 'musicalKey' in first) {
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'songs',
        songs: parsed as SongItem[],
      };
    }
    if (first && Array.isArray(first.slides) && 'type' in first) {
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'schedule',
        schedule: parsed as ScheduleItem[],
      };
    }
    if (first && 'fontFamily' in first && 'textColor' in first) {
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'settings',
        settings: { themes: parsed as ThemeTemplate[] },
      };
    }
    // Flat Bible verses array: [ { book, chapter, verse, text, translation } ]
    if (first && (first.text || first.scripture) && (first.book || first.book_name)) {
      const code = (first.translation || 'CUSTOM').toUpperCase();
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'bibles',
        bibles: { [code]: parsed as BibleVerse[] },
      };
    }
  }

  // Direct translation map: { "KJV": [ { book, chapter, verse, text } ], "WEB": [...] }
  if (parsed && typeof parsed === 'object') {
    const topKeys = Object.keys(parsed);
    const nonMetaKeys = topKeys.filter(
      (k) => !['format', 'version', 'exportedAt', 'scope', 'settings', 'themes', 'songs', 'schedule'].includes(k)
    );
    const isDirectBibleMap =
      nonMetaKeys.length > 0 &&
      nonMetaKeys.every((k) => Array.isArray(parsed[k])) &&
      nonMetaKeys.some((k) => {
        const arr = parsed[k];
        return arr.length > 0 && (arr[0]?.text || arr[0]?.book || arr[0]?.scripture);
      });
    if (isDirectBibleMap) {
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'bibles',
        bibles: parsed as Record<string, BibleVerse[]>,
      };
    }
  }

  // Object with top-level keys
  if (parsed && typeof parsed === 'object') {
    if (
      parsed.songs ||
      parsed.schedule ||
      parsed.bibles ||
      parsed.settings ||
      parsed.routingSettings ||
      parsed.themes
    ) {
      return {
        format: 'freeworship-backup-v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: 'full',
        songs: Array.isArray(parsed.songs) ? parsed.songs : undefined,
        bibles: parsed.bibles && typeof parsed.bibles === 'object' ? parsed.bibles : undefined,
        schedule: Array.isArray(parsed.schedule) ? parsed.schedule : undefined,
        settings: parsed.settings || {
          themes: Array.isArray(parsed.themes) ? parsed.themes : undefined,
          routingSettings: parsed.routingSettings,
          logoTitle: parsed.logoTitle,
          logoSubtitle: parsed.logoSubtitle,
        },
      };
    }
  }

  throw new Error(
    'Unrecognized JSON structure. Please select a valid FreeWorship Backup, Songs, Schedule, Bible, or Settings file.'
  );
}

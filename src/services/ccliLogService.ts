export interface CcliLogEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  songId: string;
  title: string;
  author: string;
  ccliNumber: string;
  musicalKey: string;
}

const CCLI_LOG_STORAGE_KEY = 'freeworship_ccli_usage_log_v1';

export function loadCcliUsageLog(): CcliLogEntry[] {
  try {
    const raw = localStorage.getItem(CCLI_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCcliUsageLog(entries: CcliLogEntry[]): void {
  try {
    localStorage.setItem(CCLI_LOG_STORAGE_KEY, JSON.stringify(entries.slice(0, 2000)));
  } catch {}
}

/**
 * Records a live song projection for CCLI reporting.
 * Deduplicates consecutive/same-day projections of the exact same song within 30 minutes
 * so advancing slides within a song never creates duplicate entries.
 */
export function recordSongProjectionForCcli(
  existingLog: CcliLogEntry[],
  song: {
    id: string;
    title: string;
    author?: string;
    ccliNumber?: string;
    musicalKey?: string;
  }
): { nextLog: CcliLogEntry[]; added: boolean } {
  const now = Date.now();
  const dateStr = new Date(now).toISOString().slice(0, 10);
  const cleanTitle = (song.title || '').trim();
  if (!cleanTitle) return { nextLog: existingLog, added: false };

  const recentlyLogged = existingLog.some(
    (entry) =>
      entry.dateStr === dateStr &&
      (entry.songId === song.id || entry.title.toLowerCase() === cleanTitle.toLowerCase()) &&
      now - entry.timestamp < 30 * 60 * 1000
  );

  if (recentlyLogged) {
    return { nextLog: existingLog, added: false };
  }

  const newEntry: CcliLogEntry = {
    id: `ccli-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    dateStr,
    songId: song.id,
    title: cleanTitle,
    author: (song.author || 'Unknown').trim(),
    ccliNumber: (song.ccliNumber || 'N/A').trim(),
    musicalKey: (song.musicalKey || 'C').trim(),
  };

  const nextLog = [newEntry, ...existingLog].slice(0, 2000);
  saveCcliUsageLog(nextLog);
  return { nextLog, added: true };
}

function escapeCsvCell(val: string): string {
  const str = String(val ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCcliCsv(entries: CcliLogEntry[]): string {
  const header = ['Date', 'Time', 'Song Title', 'Author / Writer', 'CCLI Number', 'Musical Key'];
  const rows = entries.map((e) => {
    const timeStr = new Date(e.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return [
      escapeCsvCell(e.dateStr),
      escapeCsvCell(timeStr),
      escapeCsvCell(e.title),
      escapeCsvCell(e.author),
      escapeCsvCell(e.ccliNumber),
      escapeCsvCell(e.musicalKey),
    ].join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

export function downloadCcliCsv(entries: CcliLogEntry[], filename = 'FreeWorship-CCLI-Report.csv'): void {
  const csv = buildCcliCsv(entries);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

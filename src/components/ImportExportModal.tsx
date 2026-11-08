import React, { useRef, useState } from 'react';
import {
  Archive,
  BookOpen,
  Check,
  Database,
  Download,
  FileCode,
  FileText,
  FileUp,
  Layers,
  Music,
  Sliders,
  Upload,
  X,
} from 'lucide-react';
import {
  BibleVerse,
  MediaAsset,
  MultiScreenRoutingSettings,
  ScheduleItem,
  SongItem,
  ThemeTemplate,
} from '../types/worship';
import {
  downloadTextFile,
  exportBiblesJson,
  exportFullBackupJson,
  exportScheduleJson,
  exportSettingsJson,
  exportSongsLibraryJson,
  exportSongToOpenLyricsXml,
  FreeWorshipBackupBundle,
  getDateStamp,
  parseBackupOrModuleJson,
} from '../services/backupService';
import { parseBibleFile } from '../services/bibleImporter';
import {
  importChordProOrTextSong,
  importOpenLyricsOrXmlSong,
  importPptxFile,
} from '../services/fileImporters';

interface ImportExportModalProps {
  songs: SongItem[];
  customBibles: Record<string, BibleVerse[]>;
  allAvailableBibles: Record<string, BibleVerse[]>;
  selectedTranslation: string;
  schedule: ScheduleItem[];
  themes: ThemeTemplate[];
  routingSettings: MultiScreenRoutingSettings;
  logoTitle: string;
  logoSubtitle: string;
  mediaPool: MediaAsset[];
  onImportBundle: (
    bundle: FreeWorshipBackupBundle,
    mode: 'merge' | 'replace'
  ) => Promise<string>;
  onImportSongs: (newSongs: SongItem[], mode: 'merge' | 'replace') => void;
  onImportBibleTranslation: (code: string, verses: BibleVerse[]) => Promise<void>;
  onImportSchedule: (items: ScheduleItem[], mode: 'merge' | 'replace') => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  songs,
  allAvailableBibles,
  selectedTranslation,
  schedule,
  themes,
  routingSettings,
  logoTitle,
  logoSubtitle,
  mediaPool,
  onImportBundle,
  onImportSongs,
  onImportBibleTranslation,
  onImportSchedule,
  onClose,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [selectedBibleToExport, setSelectedBibleToExport] =
    useState<string>(selectedTranslation || 'KJV');

  // Hidden file inputs for each category
  const fullBackupInputRef = useRef<HTMLInputElement | null>(null);
  const songsInputRef = useRef<HTMLInputElement | null>(null);
  const bibleInputRef = useRef<HTMLInputElement | null>(null);
  const scheduleInputRef = useRef<HTMLInputElement | null>(null);
  const settingsInputRef = useRef<HTMLInputElement | null>(null);

  const bibleCodes = Object.keys(allAvailableBibles);

  // 1. Handle Full Backup or Any FreeWorship JSON Bundle Import
  const handleBundleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const bundle = parseBackupOrModuleJson(raw);
      const summary = await onImportBundle(bundle, importMode);
      setStatusMessage({ type: 'success', text: summary });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to parse backup file.',
      });
    }
    e.target.value = '';
  };

  // 2. Handle Songs Import (supports FreeWorship Songs JSON, OpenLyrics XML, OpenSong XML, ChordPro, TXT)
  const handleSongsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const importedSongs: SongItem[] = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        const lower = file.name.toLowerCase();

        if (lower.endsWith('.json')) {
          const bundle = parseBackupOrModuleJson(text);
          if (bundle.songs && bundle.songs.length > 0) {
            importedSongs.push(...bundle.songs);
          }
        } else if (lower.endsWith('.xml') || text.trim().startsWith('<')) {
          importedSongs.push(importOpenLyricsOrXmlSong(text, file.name));
        } else {
          importedSongs.push(importChordProOrTextSong(text, file.name));
        }
      }

      if (importedSongs.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No valid songs found in the selected file(s).',
        });
      } else {
        onImportSongs(importedSongs, importMode);
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${importedSongs.length} song(s) (${
            importMode === 'merge' ? 'Merged into library' : 'Replaced library'
          }).`,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error importing songs.',
      });
    }
    e.target.value = '';
  };

  // 3. Handle Bible Import (supports FreeWorship Bible JSON, thiagobodruk/scrollmapper JSON, Zefania/OpenSong XML)
  const handleBibleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage({ type: 'info', text: `Importing Bible file "${file.name}"...` });

    try {
      const text = await file.text();
      // First check if it's a FreeWorship backup bundle containing `bibles`
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const maybeBundle = JSON.parse(text);
          if (maybeBundle && maybeBundle.format === 'freeworship-backup-v1' && maybeBundle.bibles) {
            const summary = await onImportBundle(maybeBundle, importMode);
            setStatusMessage({ type: 'success', text: summary });
            e.target.value = '';
            return;
          }
        } catch {}
      }

      const { translationCode, verses, allTranslations } = parseBibleFile(text, file.name);
      if (allTranslations && Object.keys(allTranslations).length > 0) {
        for (const [code, tVerses] of Object.entries(allTranslations)) {
          if (tVerses.length > 0) {
            await onImportBibleTranslation(code, tVerses);
          }
        }
        const primary = translationCode || Object.keys(allTranslations)[0];
        setSelectedBibleToExport(primary);
        const total = Object.values(allTranslations).reduce((acc, cur) => acc + cur.length, 0);
        setStatusMessage({
          type: 'success',
          text: `Installed Bible translation(s): ${Object.keys(allTranslations).join(', ')} (${total.toLocaleString()} verses saved offline).`,
        });
      } else if (verses.length > 0) {
        await onImportBibleTranslation(translationCode, verses);
        setSelectedBibleToExport(translationCode);
        setStatusMessage({
          type: 'success',
          text: `Installed Bible "${translationCode}" (${verses.length.toLocaleString()} verses saved offline).`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No valid Bible verses found. Supported formats: FreeWorship JSON, Scrollmapper/Thiagobodruk JSON, Zefania XML, OpenSong XML.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import Bible file.',
      });
    }
    e.target.value = '';
  };

  // 4. Handle Schedule Import (supports FreeWorship Schedule .fws.json or PowerPoint .pptx)
  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith('.pptx')) {
        const { scheduleItem } = await importPptxFile(file, themes[0]?.id || 'theme-default');
        onImportSchedule([scheduleItem], 'merge');
        setStatusMessage({
          type: 'success',
          text: `Imported PowerPoint "${file.name}" (${scheduleItem.slides.length} slides) into Service Schedule.`,
        });
      } else {
        const text = await file.text();
        const bundle = parseBackupOrModuleJson(text);
        if (bundle.schedule && bundle.schedule.length > 0) {
          const summary = await onImportBundle(bundle, importMode);
          setStatusMessage({ type: 'success', text: summary });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Selected file does not contain a Service Schedule.',
          });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import schedule file.',
      });
    }
    e.target.value = '';
  };

  // 5. Handle Settings & Themes Import
  const handleSettingsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const bundle = parseBackupOrModuleJson(text);
      const summary = await onImportBundle(bundle, importMode);
      setStatusMessage({ type: 'success', text: summary });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import settings file.',
      });
    }
    e.target.value = '';
  };

  // Export all songs as a combined OpenLyrics XML archive or individual XML
  const handleExportAllSongsOpenLyrics = () => {
    songs.forEach((song, idx) => {
      setTimeout(() => {
        const xml = exportSongToOpenLyricsXml(song);
        const safeTitle = song.title.replace(/[^a-z0-9_-]+/gi, '_');
        downloadTextFile(`${safeTitle}.xml`, xml, 'application/xml;charset=utf-8');
      }, idx * 120);
    });
    setStatusMessage({
      type: 'success',
      text: `Exported ${songs.length} song(s) in OpenLyrics (.xml) format.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Hidden Inputs */}
        <input
          ref={fullBackupInputRef}
          type="file"
          accept=".json"
          onChange={handleBundleFileUpload}
          className="hidden"
        />
        <input
          ref={songsInputRef}
          type="file"
          accept=".json,.xml,.cho,.crd,.pro,.txt"
          multiple
          onChange={handleSongsFileUpload}
          className="hidden"
        />
        <input
          ref={bibleInputRef}
          type="file"
          accept=".json,.xml,.xmm"
          onChange={handleBibleFileUpload}
          className="hidden"
        />
        <input
          ref={scheduleInputRef}
          type="file"
          accept=".json,.pptx"
          onChange={handleScheduleFileUpload}
          className="hidden"
        />
        <input
          ref={settingsInputRef}
          type="file"
          accept=".json"
          onChange={handleSettingsFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="px-6 py-4 bg-booth-950 border-b border-booth-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Data Import, Export & Sanctuary Backup Studio
              </h3>
              <p className="text-xs text-slate-400">
                Import or export Songs, 66-Book Bibles, Service Schedules, and Display/Boundary/Theme Settings between PCs
              </p>
            </div>
          </div>

          {/* Import Behavior Selector (Merge vs Replace) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-booth-900 p-1 rounded-xl border border-booth-800 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-2">
                Import Mode:
              </span>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  importMode === 'merge'
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Keep existing items and add/update imported items"
              >
                Merge & Keep Existing
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  importMode === 'replace'
                    ? 'bg-amber-500 text-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Overwrite current list with the imported file"
              >
                Replace Existing
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-booth-850 hover:bg-booth-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/60 border-red-500/50 text-red-300'
                : 'bg-sky-950/60 border-sky-500/50 text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-[10px] uppercase underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* MASTER CARD: 1-Click Complete Sanctuary Backup / Restore */}
          <div className="bg-gradient-to-r from-emerald-500/15 via-booth-950 to-amber-500/15 border-2 border-emerald-500/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Archive className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-black text-[10px] uppercase">
                    ALL-IN-ONE
                  </span>
                  <h4 className="font-bold text-sm text-white">
                    Complete Sanctuary Backup (`.fwbackup.json`)
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Bundles all <span className="text-white font-semibold">{songs.length} Songs</span>,{' '}
                  <span className="text-white font-semibold">
                    {bibleCodes.length} Offline Bibles
                  </span>
                  ,{' '}
                  <span className="text-white font-semibold">
                    {schedule.length} Schedule Items
                  </span>
                  , <span className="text-white font-semibold">{themes.length} Custom Themes</span>,
                  and <span className="text-white font-semibold">2nd/3rd Screen & Boundary Settings</span> into a single portable file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fullBackupInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-600 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Restore / Import Full Backup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportFullBackupJson({
                    songs,
                    bibles: allAvailableBibles,
                    schedule,
                    themes,
                    routingSettings,
                    logoTitle,
                    logoSubtitle,
                    mediaPool,
                  });
                  setStatusMessage({
                    type: 'success',
                    text: `Exported Complete Sanctuary Backup (FreeWorship-FullBackup-${getDateStamp()}.fwbackup.json).`,
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Full Backup</span>
              </button>
            </div>
          </div>

          {/* 4 INDIVIDUAL CATEGORY CARDS: SONGS, BIBLES, SCHEDULES, SETTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. SONGS IMPORT / EXPORT */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Music className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">1. Songs Library</h4>
                    <p className="text-[11px] text-slate-400">
                      {songs.length} worship songs with lyrics, section tags, and band chords
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-booth-900 border border-booth-700 text-[10px] font-mono text-amber-300 font-bold">
                  {songs.length} Songs
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Import or export your entire songbook as a FreeWorship Songs JSON file, or import/export standard <span className="text-slate-200 font-semibold">OpenLyrics (.xml)</span>, <span className="text-slate-200 font-semibold">ChordPro (.cho)</span>, and <span className="text-slate-200 font-semibold">Plain Text (.txt)</span> files.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-booth-800">
                <button
                  type="button"
                  onClick={() => songsInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Import Songs (JSON/XML/TXT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportSongsLibraryJson(songs);
                    setStatusMessage({
                      type: 'success',
                      text: `Exported ${songs.length} songs to FreeWorship Songs JSON.`,
                    });
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Songs (.json)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportAllSongsOpenLyrics}
                className="w-full py-1.5 px-3 rounded-lg bg-booth-900 hover:bg-booth-850 border border-booth-800 text-[11px] font-semibold text-sky-300 flex items-center justify-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Export All Songs as OpenLyrics (.xml) Files</span>
              </button>
            </div>

            {/* 2. BIBLES IMPORT / EXPORT */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">2. Offline 66-Book Bibles</h4>
                    <p className="text-[11px] text-slate-400">
                      {bibleCodes.length} translations available ({bibleCodes.join(', ')})
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-booth-900 border border-booth-700 text-[10px] font-mono text-emerald-300 font-bold">
                  {bibleCodes.length} Versions
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-400 shrink-0">
                  Translation to Export:
                </label>
                <select
                  value={selectedBibleToExport}
                  onChange={(e) => setSelectedBibleToExport(e.target.value)}
                  className="flex-1 bg-booth-900 border border-booth-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  {bibleCodes.map((code) => (
                    <option key={code} value={code}>
                      {code} ({(allAvailableBibles[code]?.length || 0).toLocaleString()} verses)
                    </option>
                  ))}
                  <option value="__ALL__">All Loaded Bible Translations</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-booth-800">
                <button
                  type="button"
                  onClick={() => bibleInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import Bible (JSON/XML)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportBiblesJson(
                      allAvailableBibles,
                      selectedBibleToExport === '__ALL__' ? undefined : selectedBibleToExport
                    );
                    setStatusMessage({
                      type: 'success',
                      text: `Exported Bible translation (${selectedBibleToExport}) to JSON.`,
                    });
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Bible (.json)</span>
                </button>
              </div>
            </div>

            {/* 3. SERVICE SCHEDULES IMPORT / EXPORT */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      3. Service Schedule (Run-of-Show)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {schedule.length} items currently in the active Sunday / Event Schedule
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-booth-900 border border-booth-700 text-[10px] font-mono text-sky-300 font-bold">
                  {schedule.length} Items
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Save your complete service order (songs, scripture readings, announcements, and sermon slides) as a portable <span className="text-slate-200 font-semibold">.fws.json</span> schedule file, or import a <span className="text-slate-200 font-semibold">PowerPoint (.pptx)</span> deck.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-booth-800">
                <button
                  type="button"
                  onClick={() => scheduleInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <FileUp className="w-3.5 h-3.5 text-sky-400" />
                  <span>Import Schedule / .PPTX</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportScheduleJson(schedule, themes);
                    setStatusMessage({
                      type: 'success',
                      text: `Exported Service Schedule (${schedule.length} items) to .fws.json.`,
                    });
                  }}
                  className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Schedule (.fws.json)</span>
                </button>
              </div>
            </div>

            {/* 4. SETTINGS & THEMES IMPORT / EXPORT */}
            <div className="bg-booth-950 border border-booth-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      4. Settings, Boundaries & Themes
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      2nd/3rd Screen Routing, Slide Transitions, Text Boundary Boxes & {themes.length} Themes
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-booth-900 border border-booth-700 text-[10px] font-mono text-purple-300 font-bold">
                  {themes.length} Themes
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Export or import your exact <span className="text-slate-200 font-semibold">2nd & 3rd Monitor Routing</span>, <span className="text-slate-200 font-semibold">Slide Transition Animations</span>, <span className="text-slate-200 font-semibold">Text Boundary Coordinates</span>, <span className="text-slate-200 font-semibold">Font Styles</span>, and <span className="text-slate-200 font-semibold">Custom Themes</span>.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-booth-800">
                <button
                  type="button"
                  onClick={() => settingsInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-booth-850 hover:bg-booth-800 border border-booth-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Import Settings & Themes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportSettingsJson({
                      themes,
                      routingSettings,
                      logoTitle,
                      logoSubtitle,
                    });
                    setStatusMessage({
                      type: 'success',
                      text: 'Exported Display Routing, Boundary Boxes, and Themes (.fwsettings.json).',
                    });
                  }}
                  className="py-2 px-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Settings (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-booth-950 border-t border-booth-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            All exported files are 100% offline-compatible and can be transferred via USB drive or LAN.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-booth-800 hover:bg-booth-700 text-xs font-bold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

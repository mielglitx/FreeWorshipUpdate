import React, { useState } from 'react';
import { MediaAsset, SongItem, Slide } from '../types/worship';
import { formatSongTitleSmart } from '../services/songStorage';
import { X, Plus, Music, FileText, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface SongEditorModalProps {
  initialSong?: SongItem | null;
  mediaPool?: MediaAsset[];
  onSave: (song: SongItem, addToSchedule: boolean) => void;
  onClose: () => void;
}

function parseRawLyricsToSlides(raw: string): Slide[] {
  const blocks = raw
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const rawLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    let tag = `Verse ${index + 1}`;
    let chords = '';
    const contentLines: string[] = [];

    rawLines.forEach((line, idx) => {
      const bracketMatch = line.match(/^\[(Verse\s*\d*|Chorus\s*\d*|Bridge\s*\d*|Pre-Chorus|Tag|Intro|Outro)\]$/i);
      const colonMatch = line.match(/^(Verse\s*\d*|Chorus\s*\d*|Bridge\s*\d*|Pre-Chorus|Tag|Intro|Outro):?$/i);
      if (idx === 0 && (bracketMatch || colonMatch)) {
        tag = (bracketMatch ? bracketMatch[1] : colonMatch![1]).replace(/\s+/g, ' ');
      } else if (line.toLowerCase().startsWith('chords:')) {
        chords = line.replace(/^chords:\s*/i, '').trim();
      } else {
        contentLines.push(line);
      }
    });

    return {
      id: `slide-${Date.now()}-${index}`,
      tag,
      lines: contentLines.length > 0 ? contentLines : ['(Instrumental / Blank)'],
      chords: chords || undefined,
    };
  });
}

function slidesToRawLyrics(slides: Slide[]): string {
  return slides
    .map((s) => {
      const header = `[${s.tag}]`;
      const chordLine = s.chords ? `Chords: ${s.chords}\n` : '';
      return `${header}\n${chordLine}${s.lines.join('\n')}`;
    })
    .join('\n\n');
}

export const SongEditorModal: React.FC<SongEditorModalProps> = ({
  initialSong,
  mediaPool = [],
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [author, setAuthor] = useState(initialSong?.author || '');
  const [ccliNumber, setCcliNumber] = useState(initialSong?.ccliNumber || '');
  const [musicalKey, setMusicalKey] = useState(initialSong?.musicalKey || 'G');
  const [bpm, setBpm] = useState<number>(initialSong?.bpm || 72);
  const [arrangement, setArrangement] = useState<string[]>(initialSong?.arrangement || []);
  const [slideBgOverrides, setSlideBgOverrides] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    initialSong?.slides?.forEach((s, idx) => {
      if (s.backgroundOverrideId) map[idx] = s.backgroundOverrideId;
    });
    return map;
  });
  const [rawLyrics, setRawLyrics] = useState<string>(
    initialSong
      ? slidesToRawLyrics(initialSong.slides)
      : `[Verse 1]\nChords: G | C | Em | D\nSing a new song unto the Lord\nLet His praise fill this sanctuary\n\n[Chorus]\nChords: C | G | D | Em\nHoly is the Lord Almighty\nForever You reign in glory\n\n[Bridge]\nChords: Am | Em | C | D\nWe lift our hands in worship\nYour kingdom shall never end`
  );

  const previewSlides = parseRawLyricsToSlides(rawLyrics).map((sl, idx) => ({
    ...sl,
    backgroundOverrideId: slideBgOverrides[idx] || undefined,
  }));
  const uniqueTags = Array.from(new Set(previewSlides.map((s) => s.tag)));

  const handleSubmit = (addToSchedule: boolean) => {
    const formattedTitle = formatSongTitleSmart(title);
    if (!formattedTitle) return;
    const savedSong: SongItem = {
      id: initialSong?.id || `song-${Date.now()}`,
      title: formattedTitle,
      author: author.trim() || 'Unknown Author',
      ccliNumber: ccliNumber.trim() || 'N/A',
      musicalKey: musicalKey.trim() || 'C',
      bpm,
      arrangement: arrangement.length > 0 ? arrangement : undefined,
      defaultBackgroundId: initialSong?.defaultBackgroundId || 'bg-aurora',
      slides: previewSlides,
    };
    onSave(savedSong, addToSchedule);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-booth-900 border border-booth-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-booth-950 border-b border-booth-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialSong ? 'Edit Song & Structured Lyrics' : 'Create / Import New Worship Song'}
              </h2>
              <p className="text-xs text-slate-400">
                Use [Verse 1], [Chorus], [Bridge] tags and blank lines to auto-split slides
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-booth-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Way Maker / Amazing Grace"
                  className="w-full bg-booth-950 border border-booth-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Auto Title Case on save; custom capitalization (e.g. GOD, LORD) is preserved.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Author / Artist
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Sinach / John Newton"
                  className="w-full bg-booth-950 border border-booth-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    BPM
                  </label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    CCLI #
                  </label>
                  <input
                    type="text"
                    value={ccliNumber}
                    onChange={(e) => setCcliNumber(e.target.value)}
                    placeholder="7115744"
                    className="w-full bg-booth-950 border border-booth-700 rounded-lg px-2.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Structured Lyrics & Stage Chords
                </label>
                <div className="flex gap-1.5">
                  {['[Verse 1]', '[Chorus]', '[Bridge]', '[Tag]'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setRawLyrics((prev) => `${prev.trim()}\n\n${tag}\n`)}
                      className="text-[11px] bg-booth-800 hover:bg-booth-700 text-amber-300 px-2 py-0.5 rounded border border-booth-600"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={12}
                value={rawLyrics}
                onChange={(e) => setRawLyrics(e.target.value)}
                className="w-full flex-1 bg-booth-950 border border-booth-700 rounded-xl p-3 font-mono text-sm text-slate-100 focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Live Slide Block Preview + Arrangement & Per-Slide Backgrounds */}
          <div className="md:col-span-5 flex flex-col bg-booth-950 border border-booth-800 rounded-xl p-4 gap-3">
            {/* Arrangement Order Builder */}
            <div className="bg-booth-900 border border-booth-800 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Play Arrangement Order
                </span>
                {arrangement.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setArrangement([])}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    title="Reset to default slide order"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {uniqueTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setArrangement((prev) => [...prev, tag])}
                    className="px-2 py-0.5 rounded bg-booth-850 hover:bg-amber-500/20 border border-booth-700 hover:border-amber-500/50 text-[10px] font-bold text-slate-200"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {arrangement.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {arrangement.map((tag, aIdx) => (
                    <button
                      key={`${tag}-${aIdx}`}
                      type="button"
                      onClick={() =>
                        setArrangement((prev) => prev.filter((_, i) => i !== aIdx))
                      }
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-bold hover:bg-red-500/25 hover:border-red-400"
                      title="Click to remove from arrangement"
                    >
                      {aIdx + 1}. {tag} ×
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Default order ({previewSlides.length} slides). Click tags above to build a reusable flow (e.g. V1 → C → V2 → C → B → C).
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Compiled Slide Blocks ({previewSlides.length})
              </span>
              <span className="text-[11px] text-slate-400">Instant Auto-Reflow</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {previewSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="bg-booth-900 border border-booth-700 rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                      #{idx + 1} • {slide.tag}
                    </span>
                    {slide.chords && (
                      <span className="font-mono text-[10px] text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded">
                        {slide.chords}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-100 font-medium pt-0.5 space-y-0.5">
                    {slide.lines.map((line, lIdx) => (
                      <p key={lIdx}>{line}</p>
                    ))}
                  </div>
                  {mediaPool.length > 0 && (
                    <div className="pt-1 border-t border-booth-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      <select
                        value={slideBgOverrides[idx] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSlideBgOverrides((prev) => {
                            const next = { ...prev };
                            if (val) next[idx] = val;
                            else delete next[idx];
                            return next;
                          });
                        }}
                        className="flex-1 bg-booth-950 border border-booth-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                        title="Optional per-slide background override"
                      >
                        <option value="">Background: Song Default</option>
                        {mediaPool.map((m) => (
                          <option key={m.id} value={m.id}>
                            Override: {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-booth-950 border-t border-booth-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-booth-800"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-booth-800 hover:bg-booth-700 text-white border border-booth-600 disabled:opacity-40"
            >
              Save to Song Library
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={!title.trim()}
              className="px-5 py-2 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Save & Add to Service Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

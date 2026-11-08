import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Upload,
  Repeat,
  Radio,
  Sparkles,
  Music2,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { AudioTrackItem } from '../types/worship';
import { MUSICAL_KEYS, worshipPadSynth } from '../services/worshipPadSynth';

interface AudioPadDeckProps {
  activeSongKey?: string;
  tracks: AudioTrackItem[];
  selectedTrackIds?: string[];
  onSelectTrack?: (id: string, index: number, e: React.MouseEvent) => void;
  onTrackContextMenu?: (track: AudioTrackItem, index: number, e: React.MouseEvent) => void;
  onAddTrack: (track: AudioTrackItem) => void;
  onRemoveTrack: (id: string) => void;
}

export const AudioPadDeck: React.FC<AudioPadDeckProps> = ({
  activeSongKey,
  tracks,
  selectedTrackIds = [],
  onSelectTrack,
  onTrackContextMenu,
  onAddTrack,
  onRemoveTrack,
}) => {
  // Ambient Worship Pad State
  const [padActiveKey, setPadActiveKey] = useState<string | null>(null);
  const [autoFollowSongKey, setAutoFollowSongKey] = useState<boolean>(false);
  const [padVolume, setPadVolume] = useState<number>(0.7);
  const [padShimmer, setPadShimmer] = useState<number>(0.5);

  // Audio Track Player State
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(tracks[0]?.id || null);
  const [isPlayingTrack, setIsPlayingTrack] = useState<boolean>(false);
  const [trackVolume, setTrackVolume] = useState<number>(0.85);
  const [loopTrack, setLoopTrack] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUploadRef = useRef<HTMLInputElement | null>(null);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || null;

  // Auto-follow song key when active song changes
  useEffect(() => {
    if (autoFollowSongKey && activeSongKey && padActiveKey) {
      const normalized = worshipPadSynth.normalizeKey(activeSongKey);
      if (normalized !== padActiveKey) {
        worshipPadSynth.startOrSwitchKey(normalized);
        setPadActiveKey(normalized);
      }
    }
  }, [activeSongKey, autoFollowSongKey, padActiveKey]);

  const togglePadKey = (key: string) => {
    if (padActiveKey === key) {
      worshipPadSynth.stopWithFade(2.0);
      setPadActiveKey(null);
    } else {
      worshipPadSynth.startOrSwitchKey(key);
      setPadActiveKey(key);
    }
  };

  const handlePadVolumeChange = (val: number) => {
    setPadVolume(val);
    worshipPadSynth.setVolume(val);
  };

  const handlePadShimmerChange = (val: number) => {
    setPadShimmer(val);
    worshipPadSynth.setShimmerBrightness(val);
  };

  // Audio File Upload Handler
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const newTrack: AudioTrackItem = {
        id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Custom Audio',
        url,
      };
      onAddTrack(newTrack);
      setCurrentTrackId(newTrack.id);
    });
    e.target.value = '';
  };

  // Sync audio element volume
  useEffect(() => {
    if (audioRef.current && !isFadingOut) {
      audioRef.current.volume = trackVolume;
    }
  }, [trackVolume, isFadingOut]);

  const togglePlayTrack = (trackToPlay?: AudioTrackItem) => {
    const target = trackToPlay || currentTrack;
    if (!target || !audioRef.current) return;

    if (trackToPlay && trackToPlay.id !== currentTrackId) {
      setCurrentTrackId(trackToPlay.id);
      audioRef.current.src = trackToPlay.url;
      audioRef.current.volume = trackVolume;
      audioRef.current.play().then(() => setIsPlayingTrack(true)).catch(() => {});
      return;
    }

    if (isPlayingTrack) {
      audioRef.current.pause();
      setIsPlayingTrack(false);
    } else {
      if (audioRef.current.src !== target.url) {
        audioRef.current.src = target.url;
      }
      audioRef.current.volume = trackVolume;
      audioRef.current.play().then(() => setIsPlayingTrack(true)).catch(() => {});
    }
  };

  // Smooth 3-Second Booth Fade Out for Audio Track
  const fadeOutTrackSmoothly = () => {
    const audio = audioRef.current;
    if (!audio || !isPlayingTrack || isFadingOut) return;
    setIsFadingOut(true);
    const startVol = audio.volume;
    const steps = 30;
    const stepMs = 100; // 3.0 seconds total
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextVol = Math.max(0, startVol * (1 - currentStep / steps));
      audio.volume = nextVol;
      if (currentStep >= steps) {
        clearInterval(timer);
        audio.pause();
        audio.volume = trackVolume;
        setIsPlayingTrack(false);
        setIsFadingOut(false);
      }
    }, stepMs);
  };

  const formatTime = (secs: number): string => {
    if (!isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* =====================================================================
          SECTION 1: AMBIENT WORSHIP PAD SYNTHESIZER (12 KEYS + CROSSFADE)
         ===================================================================== */}
      <div className="bg-booth-950 border border-booth-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${padActiveKey ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-white">
                Cathedral Ambient Worship Pads
              </h5>
              <p className="text-[10px] text-slate-400">
                Real-time 12-key stereo shimmer synth with 2.2s crossfade
              </p>
            </div>
          </div>

          {padActiveKey && (
            <button
              onClick={() => {
                worshipPadSynth.stopWithFade(2.0);
                setPadActiveKey(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider"
            >
              Fade Out Pad ({padActiveKey})
            </button>
          )}
        </div>

        {/* 12 Musical Key Trigger Grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {MUSICAL_KEYS.map((k) => {
            const isActive = padActiveKey === k;
            const isSongKey =
              activeSongKey && worshipPadSynth.normalizeKey(activeSongKey) === k;

            return (
              <button
                key={k}
                onClick={() => togglePadKey(k)}
                className={`py-2 rounded-lg font-mono text-xs font-black border transition relative ${
                  isActive
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300'
                    : isSongKey
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
                    : 'bg-booth-900 hover:bg-booth-800 text-slate-200 border-booth-700'
                }`}
                title={isSongKey ? `Matches current song key (${activeSongKey})` : `Play ambient pad in ${k}`}
              >
                {k}
                {isSongKey && !isActive && (
                  <span className="block text-[8px] font-sans uppercase text-amber-400 leading-none mt-0.5">
                    Song
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pad Controls: Auto-Follow Song Key, Volume, & Shimmer Filter */}
        <div className="space-y-2 pt-1 border-t border-booth-850 text-[11px]">
          <label className="flex items-center justify-between cursor-pointer text-slate-300">
            <span>Auto-follow active song key ({activeSongKey || 'None'})</span>
            <input
              type="checkbox"
              checked={autoFollowSongKey}
              onChange={(e) => setAutoFollowSongKey(e.target.checked)}
              className="rounded accent-amber-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>Pad Volume</span>
                <span>{Math.round(padVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={padVolume}
                onChange={(e) => handlePadVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Warmth / Shimmer
                </span>
                <span>{Math.round(padShimmer * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={padShimmer}
                onChange={(e) => handlePadShimmerChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: MULTI-TRACK AUDIO PLAYER (MP3 / WAV / OGG + 3s FADE OUT)
         ===================================================================== */}
      <div className="bg-booth-950 border border-booth-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-sky-400" />
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-white">
                Audio Track & Backing Deck
              </h5>
              <p className="text-[10px] text-slate-400">
                MP3 / WAV / OGG / M4A player with 3s booth fade-out
              </p>
            </div>
          </div>

          <input
            ref={audioUploadRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleAudioFileUpload}
            className="hidden"
          />
          <button
            onClick={() => audioUploadRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Audio Track</span>
          </button>
        </div>

        <audio
          ref={audioRef}
          loop={loopTrack}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            if (!loopTrack) setIsPlayingTrack(false);
          }}
        />

        {currentTrack ? (
          <div className="bg-booth-900 border border-booth-800 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => togglePlayTrack()}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 ${
                    isPlayingTrack
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPlayingTrack ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingTrack ? 'Pause' : 'Play'}</span>
                </button>

                {isPlayingTrack && (
                  <button
                    onClick={fadeOutTrackSmoothly}
                    disabled={isFadingOut}
                    className="px-2.5 py-1.5 rounded-lg bg-booth-800 hover:bg-booth-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1"
                    title="Smooth 3-second fade out"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{isFadingOut ? 'Fading...' : '3s Fade'}</span>
                  </button>
                )}

                <button
                  onClick={() => setLoopTrack(!loopTrack)}
                  className={`p-1.5 rounded-lg border ${
                    loopTrack
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-booth-850 text-slate-400 border-booth-700'
                  }`}
                  title="Loop Audio Track"
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Seek Scrubber */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="w-full accent-sky-400 h-1.5"
            />

            {/* Master Track Volume */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              {trackVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>Track Vol</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={trackVolume}
                onChange={(e) => setTrackVolume(parseFloat(e.target.value))}
                className="flex-1 accent-sky-400"
              />
              <span className="font-mono w-8 text-right">{Math.round(trackVolume * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400 bg-booth-900/50 rounded-xl border border-dashed border-booth-800">
            Click <strong>+ Audio Track</strong> to load MP3/WAV pre-service or backing tracks.
          </div>
        )}

        {/* Uploaded Audio Track List */}
        {tracks.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {tracks.map((tr, idx) => {
              const active = tr.id === currentTrackId;
              const isMultiSelected = selectedTrackIds.includes(tr.id);
              return (
                <div
                  key={tr.id}
                  onClick={(e) => {
                    if (onSelectTrack && (e.ctrlKey || e.metaKey || e.shiftKey)) {
                      onSelectTrack(tr.id, idx, e);
                      return;
                    }
                    if (onSelectTrack) onSelectTrack(tr.id, idx, e);
                    togglePlayTrack(tr);
                  }}
                  onContextMenu={(e) => {
                    if (onTrackContextMenu) {
                      onTrackContextMenu(tr, idx, e);
                    }
                  }}
                  className={`px-2.5 py-2 rounded-lg border-2 text-xs flex items-center justify-between cursor-pointer transition ${
                    isMultiSelected
                      ? 'bg-amber-950/30 border-amber-400 text-white'
                      : active
                      ? 'bg-booth-850 border-sky-400 text-white'
                      : 'bg-booth-900 border-booth-700 hover:border-booth-600 text-slate-300'
                  }`}
                >
                  <span className="truncate font-medium">{tr.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{tr.category}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(tr.id);
                      }}
                      className="p-1 rounded hover:bg-red-950 text-slate-400 hover:text-red-400"
                      title="Delete Audio Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

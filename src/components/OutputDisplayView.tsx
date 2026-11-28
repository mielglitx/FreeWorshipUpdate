import React, { useEffect, useState } from 'react';
import { LiveBroadcastPayload } from '../types/worship';
import {
  DEFAULT_ROUTING_SETTINGS,
  closeExternalDisplayWindow,
  fetchRemoteStateFromHost,
  liveSyncBus,
} from '../services/liveSyncBus';
import { SlideStageRenderer } from './SlideStageRenderer';
import { StageBpmPulse } from './StageBpmPulse';
import {
  getCapoShapeKey,
  transposeChordLine,
  transposeMusicalKey,
} from '../services/chordTransposer';
import { DEFAULT_MEDIA_POOL, DEFAULT_THEMES, DEFAULT_SERVICE_SCHEDULE } from '../data/defaultData';

interface OutputDisplayViewProps {
  mode: 'projector' | 'stage' | 'stream';
}

export const OutputDisplayView: React.FC<OutputDisplayViewProps> = ({ mode }) => {
  const [payload, setPayload] = useState<LiveBroadcastPayload>(() => {
    const existing = liveSyncBus.getLastPayload();
    if (existing) return existing;
    const firstItem = DEFAULT_SERVICE_SCHEDULE[1];
    return {
      activeItemId: firstItem.id,
      activeItemTitle: firstItem.title,
      activeItemSubtitle: firstItem.subtitle,
      activeSlideIndex: 0,
      currentSlide: firstItem.slides[0],
      nextSlide: firstItem.slides[1] || null,
      background: DEFAULT_MEDIA_POOL[0],
      theme: DEFAULT_THEMES[0],
      routing: DEFAULT_ROUTING_SETTINGS,
      panic: { blackout: false, logoMode: false, clearText: false },
      stageAlert: { message: '', active: false, urgent: false },
      countdown: { secondsRemaining: 300, running: false, label: 'Service Countdown' },
      logoTitle: 'FREEWORSHIP SANCTUARY',
      logoSubtitle: 'WORSHIP • WORD • COMMUNITY',
      timestamp: Date.now(),
    };
  });

  const [clockText, setClockText] = useState<string>('');
  const [localCapoFret, setLocalCapoFret] = useState<number>(0);
  const [isSingleScreen, setIsSingleScreen] = useState<boolean>(() => {
    try {
      const extended = (window.screen as { isExtended?: boolean })?.isExtended;
      return extended === false;
    } catch {
      return false;
    }
  });
  const [showEscapePill, setShowEscapePill] = useState<boolean>(false);

  const handleCloseDisplayWindow = React.useCallback(
    (targetMode: 'projector' | 'stage' = mode === 'stage' ? 'stage' : 'projector') => {
      closeExternalDisplayWindow(targetMode);
      if (typeof window !== 'undefined' && !window.freeworshipDesktop) {
        try {
          window.close();
        } catch {}
      }
    },
    [mode]
  );

  // Detect 1-monitor setups and allow Escape / Ctrl+Shift+2 to close Screen 2 safely
  useEffect(() => {
    if (mode !== 'projector' && mode !== 'stage') return;

    let hideTimer: number | null = null;
    const revealTemporarily = (ms = 6000) => {
      setShowEscapePill(true);
      if (hideTimer !== null) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        setShowEscapePill(false);
      }, ms);
    };

    const syncDisplayCount = (count?: number) => {
      if (typeof count === 'number') {
        const single = count <= 1;
        setIsSingleScreen(single);
        if (single && mode === 'projector') {
          revealTemporarily(8000);
        } else {
          if (hideTimer !== null) window.clearTimeout(hideTimer);
          setShowEscapePill(false);
        }
      }
    };

    if (window.freeworshipDesktop?.getStatus) {
      window.freeworshipDesktop
        .getStatus()
        .then((st) => syncDisplayCount(st?.displayCount))
        .catch(() => {});
    } else if (isSingleScreen && mode === 'projector') {
      revealTemporarily(8000);
    }

    const unsubStatus = window.freeworshipDesktop?.onWindowStatus
      ? window.freeworshipDesktop.onWindowStatus((st) => syncDisplayCount(st?.displayCount))
      : () => {};

    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlShift2 =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.code === 'Digit2' || e.key === '@' || e.key === '2');
      if (isCtrlShift2) {
        e.preventDefault();
        handleCloseDisplayWindow('projector');
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseDisplayWindow(mode);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      if (hideTimer !== null) window.clearTimeout(hideTimer);
      unsubStatus();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mode, handleCloseDisplayWindow, isSingleScreen]);

  useEffect(() => {
    const unsub = liveSyncBus.subscribe((incoming) => {
      setPayload(incoming);
    });
    return unsub;
  }, []);

  // Ensure external OBS / vMix Browser Sources on LAN stay transparent and synced via /api/lan-sync
  useEffect(() => {
    if (mode !== 'stream') return;
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';

    let active = true;
    const isHttpOrigin =
      typeof window !== 'undefined' &&
      window.location.origin.startsWith('http') &&
      !window.freeworshipDesktop;

    let interval: number | null = null;
    if (isHttpOrigin) {
      const pollObs = async () => {
        const remote = await fetchRemoteStateFromHost(window.location.origin, 'OBS-Browser-Source', 1000);
        if (active && remote) {
          setPayload(remote);
        }
      };
      pollObs();
      interval = window.setInterval(pollObs, 200);
    }

    return () => {
      active = false;
      if (interval !== null) window.clearInterval(interval);
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
    };
  }, [mode]);

  // Automatically enter borderless fullscreen if launched with ?fullscreen=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fullscreen') === '1' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const routing = payload.routing || DEFAULT_ROUTING_SETTINGS;
  const hideCursor = routing.hideCursorOnProjector ?? true;

  if (mode === 'projector' || (mode === 'stage' && routing.stageDisplayMode === 'mirror-projector')) {
    const showSingleScreenExitOverlay = mode === 'projector' && isSingleScreen;
    return (
      <div
        className={`relative w-screen h-screen bg-black overflow-hidden m-0 p-0 border-0 ${
          hideCursor && !(showSingleScreenExitOverlay && showEscapePill) ? 'cursor-none' : ''
        }`}
        onDoubleClick={toggleFullscreen}
        onMouseMove={() => {
          if (showSingleScreenExitOverlay) {
            setShowEscapePill(true);
          }
        }}
        onMouseLeave={() => {
          if (mode === 'projector' && !isSingleScreen) {
            setShowEscapePill(false);
          }
        }}
      >
        <SlideStageRenderer
          slide={payload.currentSlide}
          background={payload.background}
          theme={payload.theme}
          transition={routing.transition || payload.theme.transition}
          panic={payload.panic}
          logoTitle={payload.logoTitle}
          logoSubtitle={payload.logoSubtitle}
          logoAsset={payload.logoAsset}
          stageAlert={payload.stageAlert}
          scaleMode="projector"
          itemTitle={payload.activeItemTitle}
          itemType={payload.activeItemType}
          itemAuthor={payload.activeItemAuthor}
          itemSlides={payload.activeItemSlides}
        />

        {showSingleScreenExitOverlay && (
          <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 pointer-events-auto cursor-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseDisplayWindow('projector');
              }}
              className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-red-600/90 text-white border border-white/25 hover:border-red-300/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              title="Disable 2nd Screen and return to Operator View (Ctrl+Shift+2 or Esc)"
            >
              <span>Disable 2nd Screen</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-amber-300">
                Ctrl+Shift+2
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-slate-200">
                Esc
              </kbd>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'stream') {
    return (
      <div className="w-screen h-screen bg-transparent overflow-hidden m-0 p-0 border-0">
        <SlideStageRenderer
          slide={payload.currentSlide}
          background={payload.background}
          theme={{
            ...payload.theme,
            lowerThirdBand: true,
            verticalAlign: 'bottom',
          }}
          transition={routing.transition || payload.theme.transition}
          panic={payload.panic}
          logoTitle={payload.logoTitle}
          logoSubtitle={payload.logoSubtitle}
          stageAlert={payload.stageAlert}
          scaleMode="projector"
          transparentStreamMode={true}
        />
      </div>
    );
  }

  const stageScale = routing.stageFontSizeScale ?? 1.0;
  const totalStageShift = (payload.stageTransposeSemitones ?? 0) - localCapoFret;
  const soundingKey = payload.activeSongKey
    ? transposeMusicalKey(payload.activeSongKey, payload.stageTransposeSemitones ?? 0)
    : undefined;
  const currentStageChords = payload.currentSlide?.chords
    ? transposeChordLine(payload.currentSlide.chords, totalStageShift)
    : '';
  const nextStageChords = payload.nextSlide?.chords
    ? transposeChordLine(payload.nextSlide.chords, totalStageShift)
    : '';

  // Stage Display / Confidence Monitor (3rd Screen)
  return (
    <div
      onDoubleClick={toggleFullscreen}
      className="w-screen h-screen bg-neutral-950 text-white flex flex-col justify-between p-6 select-none overflow-hidden m-0 border-0"
    >
      {/* Top Status Bar: Item Info, BPM, Capo, Clock, and Countdown */}
      <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-4 shrink-0 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-black tracking-widest uppercase">
              STAGE MONITOR (SCREEN 3)
            </span>
            {soundingKey && (
              <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold">
                Key: {soundingKey}
                {localCapoFret > 0 ? ` • Capo ${localCapoFret} (${getCapoShapeKey(soundingKey, localCapoFret)} shapes)` : ''}
              </span>
            )}
            <StageBpmPulse bpm={payload.activeSongBpm} />
            {payload.panic.blackout && (
              <span className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-black uppercase animate-pulse">
                HOUSE SCREEN BLACKOUT
              </span>
            )}
            {payload.panic.logoMode && (
              <span className="px-2.5 py-1 rounded bg-amber-500 text-black text-xs font-black uppercase">
                HOUSE ON LOGO
              </span>
            )}
            {payload.panic.clearText && (
              <span className="px-2.5 py-1 rounded bg-sky-500 text-black text-xs font-black uppercase">
                TEXT CLEARED ON HOUSE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-neutral-100 mt-1 truncate">{payload.activeItemTitle}</h1>
          <p className="text-sm text-neutral-400 truncate">{payload.activeItemSubtitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Local Stage Capo Selector */}
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Capo</div>
            <select
              value={localCapoFret}
              onChange={(e) => setLocalCapoFret(Number(e.target.value))}
              className="bg-transparent font-mono text-base font-black text-amber-300 focus:outline-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                <option key={c} value={c} className="bg-neutral-900 text-white">
                  {c === 0 ? 'Off' : `Capo ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Countdown Timer Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-2.5 text-right">
            <div className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
              {payload.countdown.label || 'Timer'}
            </div>
            <div
              className={`font-mono text-3xl font-black ${
                payload.countdown.secondsRemaining <= 60 ? 'text-red-400 animate-pulse' : 'text-amber-300'
              }`}
            >
              {formatCountdown(payload.countdown.secondsRemaining)}
            </div>
          </div>

          {/* Wall Clock */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-2.5 text-right">
            <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold">Current Time</div>
            <div className="font-mono text-3xl font-black text-white">{clockText}</div>
          </div>
        </div>
      </div>

      {/* Private Stage Message Banner (For Band / Pastor) */}
      {payload.stageAlert.active && payload.stageAlert.message && (
        <div className="my-3 bg-amber-500 text-black px-6 py-3 rounded-xl font-black text-2xl tracking-wide flex items-center justify-between shadow-lg animate-bounce shrink-0">
          <span>STAGE ALERT: {payload.stageAlert.message}</span>
          <span className="text-xs uppercase px-2 py-1 bg-black/20 rounded">Private to Stage</span>
        </div>
      )}

      {/* Current Slide Panel (High-visibility yellow/white) */}
      <div className="flex-1 flex flex-col justify-center bg-neutral-900/70 border-2 border-emerald-500/70 rounded-2xl p-8 my-3 relative min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <span className="px-3 py-1 rounded-md bg-emerald-500 text-black font-black text-sm uppercase tracking-wider">
            NOW LIVE • {payload.currentSlide?.tag || 'Slide'}
          </span>
          {currentStageChords && (
            <span
              className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-4 py-1 rounded-lg"
              style={{ fontSize: `${Math.round(24 * stageScale)}px` }}
            >
              Chords: {currentStageChords}
            </span>
          )}
        </div>

        <div
          className="space-y-2 font-extrabold text-white leading-tight"
          style={{ fontSize: `${Math.round(48 * stageScale)}px` }}
        >
          {payload.currentSlide ? (
            payload.currentSlide.lines.map((line, idx) => <p key={idx}>{line}</p>)
          ) : (
            <p className="text-neutral-500 italic">No active slide</p>
          )}
        </div>

        {payload.currentSlide?.subtext && (
          <div
            className="mt-4 font-semibold text-emerald-400"
            style={{ fontSize: `${Math.round(22 * stageScale)}px` }}
          >
            {payload.currentSlide.subtext}
          </div>
        )}
      </div>

      {/* Upcoming Next Slide Panel */}
      {routing.stageDisplayMode !== 'lyrics-chords-large' && (
        <div className="h-44 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-center shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase tracking-wider">
              UP NEXT • {payload.nextSlide?.tag || 'End of Item'}
            </span>
            {nextStageChords && (
              <span className="font-mono text-base font-semibold text-amber-200/80">
                Next Chords: {nextStageChords}
              </span>
            )}
          </div>
          <div
            className="space-y-1 font-semibold text-neutral-300 leading-snug"
            style={{ fontSize: `${Math.round(26 * stageScale)}px` }}
          >
            {payload.nextSlide ? (
              payload.nextSlide.lines.map((line, idx) => <p key={idx}>{line}</p>)
            ) : (
              <p className="text-neutral-600 italic">End of section — check schedule for next item</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

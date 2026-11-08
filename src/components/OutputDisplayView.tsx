import React, { useEffect, useState } from 'react';
import { LiveBroadcastPayload } from '../types/worship';
import { DEFAULT_ROUTING_SETTINGS, liveSyncBus } from '../services/liveSyncBus';
import { SlideStageRenderer } from './SlideStageRenderer';
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

  useEffect(() => {
    const unsub = liveSyncBus.subscribe((incoming) => {
      setPayload(incoming);
    });
    return unsub;
  }, []);

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
    return (
      <div
        className={`w-screen h-screen bg-black overflow-hidden m-0 p-0 border-0 ${
          hideCursor ? 'cursor-none' : ''
        }`}
        onDoubleClick={toggleFullscreen}
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
        />
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

  // Stage Display / Confidence Monitor (3rd Screen)
  return (
    <div
      onDoubleClick={toggleFullscreen}
      className="w-screen h-screen bg-neutral-950 text-white flex flex-col justify-between p-6 select-none overflow-hidden m-0 border-0"
    >
      {/* Top Status Bar: Item Info, Clock, and Countdown */}
      <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-black tracking-widest uppercase">
              STAGE MONITOR (SCREEN 3)
            </span>
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
          <h1 className="text-2xl font-bold text-neutral-100 mt-1">{payload.activeItemTitle}</h1>
          <p className="text-sm text-neutral-400">{payload.activeItemSubtitle}</p>
        </div>

        <div className="flex items-center gap-6">
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
          {payload.currentSlide?.chords && (
            <span
              className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-4 py-1 rounded-lg"
              style={{ fontSize: `${Math.round(24 * stageScale)}px` }}
            >
              Chords: {payload.currentSlide.chords}
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
            {payload.nextSlide?.chords && (
              <span className="font-mono text-base font-semibold text-amber-200/80">
                Next Chords: {payload.nextSlide.chords}
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

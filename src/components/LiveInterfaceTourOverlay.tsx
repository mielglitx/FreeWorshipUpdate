import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export interface LiveTourStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  audioUrl: string;
  tip?: string;
  onEnter?: () => void;
}

export const PC_LIVE_TOUR_STEPS: Omit<LiveTourStep, 'onEnter'>[] = [
  {
    id: 'pc-01',
    selector: '[data-tour="pc-menus"]',
    title: '1. Top Menu Bar (File • Output • View • Tools • Help)',
    description:
      'Use File to save and load service schedules (.fws/.json), Output to configure your 2nd & 3rd monitors, View to change layout/theme, Tools for Android setup, and Help to reopen this live tour.',
    audioUrl: './tour-audio/pc-01.mp3',
    tip: 'Shortcuts: Ctrl+S Save Schedule • Ctrl+O Load Schedule',
  },
  {
    id: 'pc-02',
    selector: '[data-tour="pc-panic"]',
    title: '2. Emergency Panic Deck (Blackout • Logo • Clear)',
    description:
      'Instantly control what appears on the 2nd Monitor projector: Blackout [B] cuts to black, Logo [L] displays your sanctuary logo, Clear [C] hides lyrics over your motion background, and [Esc] restores live output.',
    audioUrl: './tour-audio/pc-02.mp3',
    tip: 'Keyboard: B = Blackout • L = Logo • C = Clear • Esc = Restore',
  },
  {
    id: 'pc-03',
    selector: '[data-tour="pc-screens"]',
    title: '3. Launch 2nd Screen (Projector Output)',
    description:
      'Click "2nd Screen" to open a borderless fullscreen projection window on your church projector or LED display.',
    audioUrl: './tour-audio/pc-03.mp3',
    tip: 'Assign displays anytime via Output > Display & Boundary Settings',
  },
  {
    id: 'pc-04',
    selector: '[data-tour="pc-android-btn"]',
    title: '4. Android APK, QR Code & Wi-Fi Sync Hub',
    description:
      'Click "Android APK" to scan the QR code from your Android phone camera to download the app over Wi-Fi, view your PC IP address, or allow Windows Firewall ports.',
    audioUrl: './tour-audio/pc-04.mp3',
    tip: 'Shows a green counter badge whenever your Android device connects',
  },
  {
    id: 'pc-05',
    selector: '[data-tour="pc-left-tabs"]',
    title: '5. Resource Library Tabs',
    description:
      'Switch between Songs, the offline 66-book Bible (KJV, NIV, NASB, ESV, MBB 1901), motion Media backgrounds, worship Audio pads, and slide Themes.',
    audioUrl: './tour-audio/pc-05.mp3',
  },
  {
    id: 'pc-06',
    selector: '[data-tour="pc-song-list"]',
    title: '6. Songs & Bible Library List',
    description:
      'Single-click any song or Scripture passage to inspect it safely in Preview. Click "+ Schedule" (or drag it) to add it to your service order, or double-click to project live right away.',
    audioUrl: './tour-audio/pc-06.mp3',
    tip: 'Click = Preview • Double-click = Go Live Immediately',
  },
  {
    id: 'pc-07',
    selector: '[data-tour="pc-preview-deck"]',
    title: '7. Preview Workspace (Safe Pre-Check)',
    description:
      'Check song verses, chorus jumps, and lyrics here without disturbing what the congregation currently sees. Double-click any slide or click "Go Live" when ready.',
    audioUrl: './tour-audio/pc-07.mp3',
  },
  {
    id: 'pc-08',
    selector: '[data-tour="pc-live-deck"]',
    title: '8. Live Workspace (ON AIR Projection)',
    description:
      'Only the slide currently shown on the projector is highlighted green as ON AIR. Click any slide, use Jump tags, or press Spacebar / Arrow keys to advance smoothly.',
    audioUrl: './tour-audio/pc-08.mp3',
    tip: 'Keys: Space / → Next Slide • ← / ↑ Previous Slide',
  },
  {
    id: 'pc-09',
    selector: '[data-tour="pc-program-monitor"]',
    title: '9. Program Live Output Monitor',
    description:
      'This live mirror shows the exact image appearing on your 2nd Monitor projector—complete with the Song Title or Bible Book, Chapter & Verse overlay.',
    audioUrl: './tour-audio/pc-09.mp3',
  },
  {
    id: 'pc-10',
    selector: '[data-tour="pc-schedule"]',
    title: '10. Service Schedule & Stage Countdown Tools',
    description:
      'Build your Sunday Run-of-Show on the right, save/load schedules, start the pre-service countdown timer, and send stage or nursery alerts.',
    audioUrl: './tour-audio/pc-10.mp3',
    tip: 'You are ready to lead worship! Press Esc or Exit Tour anytime.',
  },
];

export const ANDROID_LIVE_TOUR_STEPS: Omit<LiveTourStep, 'onEnter'>[] = [
  {
    id: 'and-01',
    selector: '[data-tour="and-connect-bar"]',
    title: '1. Connect Android to Windows PC (Scan PC)',
    description:
      'Ensure your phone and Windows laptop share the same Wi-Fi network, then tap "Scan PC" to auto-discover your laptop (or type the PC IP manually and tap Connect).',
    audioUrl: './tour-audio/and-01.mp3',
    tip: 'A green confirmation banner pops on both PC and Android when synced',
  },
  {
    id: 'and-02',
    selector: '[data-tour="and-view-modes"]',
    title: '2. View Mode Switcher',
    description:
      'Switch cleanly between "3rd Monitor + Remote" (Split View), "Full 3rd Monitor" for singers/musicians on stage, or "Full Controller".',
    audioUrl: './tour-audio/and-02.mp3',
  },
  {
    id: 'and-03',
    selector: '[data-tour="and-stage-monitor"]',
    title: '3. 3rd Monitor Stage Confidence Screen',
    description:
      'Shows large ON AIR lyrics, chord charts for your band, the upcoming slide, plus your countdown timer and live wall clock.',
    audioUrl: './tour-audio/and-03.mp3',
  },
  {
    id: 'and-04',
    selector: '[data-tour="and-transport"]',
    title: '4. Wireless Projector & Panic Controls',
    description:
      'Tap "NEXT SLIDE" or "PREV SLIDE" to change slides wirelessly on the 2nd Monitor, or trigger Blackout, Logo, Clear Text, and Restore.',
    audioUrl: './tour-audio/and-04.mp3',
  },
  {
    id: 'and-05',
    selector: '[data-tour="and-tabs"]',
    title: '5. Slides, Schedule & Add Song / Bible Tabs',
    description:
      'Jump directly to any slide, switch Schedule items, or open the "Song / Bible" tab to search/create songs and pick Bible verses to add to the PC Schedule or Go Live!',
    audioUrl: './tour-audio/and-05.mp3',
  },
];

interface LiveInterfaceTourOverlayProps {
  isOpen: boolean;
  steps: LiveTourStep[];
  onClose: () => void;
  onOpenWrittenGuide?: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const LiveInterfaceTourOverlay: React.FC<LiveInterfaceTourOverlayProps> = ({
  isOpen,
  steps,
  onClose,
  onOpenWrittenGuide,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const currentStep = steps[stepIdx] || steps[0];

  const stopAudioAndTimers = () => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      } catch {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
      setIsPlaying(true);
    } else {
      stopAudioAndTimers();
    }
    return () => stopAudioAndTimers();
  }, [isOpen]);

  // Trigger optional UI preparation hook (e.g. switch layout to show target panel) & measure target rect
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    if (currentStep.onEnter) {
      try {
        currentStep.onEnter();
      } catch {}
    }

    const measure = () => {
      const el = document.querySelector(currentStep.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const pad = 5;
        setRect({
          top: Math.max(4, r.top - pad),
          left: Math.max(4, r.left - pad),
          width: Math.min(window.innerWidth - 8, r.width + pad * 2),
          height: Math.min(window.innerHeight - 8, r.height + pad * 2),
        });
      }
    };

    const el = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } catch {}
    }

    const initialTimer = window.setTimeout(measure, 120);
    const interval = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, stepIdx, currentStep?.selector]);

  // Play Neural Pre-recorded Voice-Over & Auto-Advance cleanly when narration finishes
  useEffect(() => {
    stopAudioAndTimers();
    if (!isOpen || !currentStep) return;

    const scheduleAdvance = (delayMs: number) => {
      if (!isPlaying) return;
      advanceTimerRef.current = window.setTimeout(() => {
        setStepIdx((prev) => {
          if (prev + 1 < steps.length) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, delayMs);
    };

    if (audioEnabled && currentStep.audioUrl) {
      const audio = new Audio(currentStep.audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        scheduleAdvance(850);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        scheduleAdvance(5000);
      };
      audio.play().catch(() => {
        setIsSpeaking(false);
        scheduleAdvance(5000);
      });
    } else if (isPlaying) {
      scheduleAdvance(5000);
    }

    return () => stopAudioAndTimers();
  }, [isOpen, stepIdx, isPlaying, audioEnabled]);

  // Allow Escape key to exit tour
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setStepIdx((i) => Math.min(steps.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, steps.length, onClose]);

  if (!isOpen || !currentStep) return null;

  const replayAudio = () => {
    stopAudioAndTimers();
    if (!currentStep.audioUrl) return;
    setAudioEnabled(true);
    const audio = new Audio(currentStep.audioUrl);
    audioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      if (isPlaying) {
        advanceTimerRef.current = window.setTimeout(() => {
          setStepIdx((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
        }, 850);
      }
    };
    audio.play().catch(() => setIsSpeaking(false));
  };

  // Compute smart floating coach card placement so it never obscures the spotlighted control
  const cardWidth = Math.min(410, window.innerWidth - 24);
  const cardEstHeight = 235;
  let cardLeft = Math.round((window.innerWidth - cardWidth) / 2);
  let cardTop = Math.round(window.innerHeight - cardEstHeight - 20);

  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - (rect.left + rect.width);
    const spaceLeft = rect.left;

    if (spaceBelow >= cardEstHeight + 24) {
      cardTop = rect.top + rect.height + 16;
      cardLeft = Math.min(
        Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 12
      );
    } else if (spaceAbove >= cardEstHeight + 24) {
      cardTop = rect.top - cardEstHeight - 16;
      cardLeft = Math.min(
        Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 12
      );
    } else if (spaceRight >= cardWidth + 28) {
      cardLeft = rect.left + rect.width + 18;
      cardTop = Math.min(
        Math.max(12, rect.top),
        window.innerHeight - cardEstHeight - 12
      );
    } else if (spaceLeft >= cardWidth + 28) {
      cardLeft = rect.left - cardWidth - 18;
      cardTop = Math.min(
        Math.max(12, rect.top),
        window.innerHeight - cardEstHeight - 12
      );
    } else {
      // Fallback: place opposite edge vertically
      cardTop = rect.top > window.innerHeight / 2 ? 16 : window.innerHeight - cardEstHeight - 16;
      cardLeft = Math.round((window.innerWidth - cardWidth) / 2);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] pointer-events-auto select-none">
      {/* Backdrop click catcher (when no rect or outside rect) */}
      {!rect && (
        <div
          className="fixed inset-0 bg-slate-950/80 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Smooth Real-UI Spotlight Cutout */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)',
            transition: 'all 450ms cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
          }}
          className="border-2 border-amber-400 ring-4 ring-amber-400/35 z-[131]"
        >
          {/* Animated Clicking Pointer Badge on Real Target */}
          <div
            className="absolute -bottom-3 -right-3 w-8 h-8 bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-white animate-fw-tap"
            style={{ pointerEvents: 'none' }}
          >
            <MousePointerClick className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* Floating Coach / Narrator Card */}
      <div
        style={{
          position: 'fixed',
          top: `${Math.max(12, Math.min(cardTop, window.innerHeight - 210))}px`,
          left: `${Math.max(12, Math.min(cardLeft, window.innerWidth - cardWidth - 12))}px`,
          width: `${cardWidth}px`,
          transition: 'all 450ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="z-[135] bg-booth-900 border-2 border-amber-400 shadow-2xl p-4 space-y-3"
      >
        {/* Top Metadata Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              Step {stepIdx + 1} / {steps.length}
            </span>
            {isSpeaking && (
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                <Volume2 className="w-3 h-3" />
                <span>Voice Guide</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={replayAudio}
              className="p-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-200"
              title="Replay voice narration for this step"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAudioEnabled((a) => !a)}
              className={`p-1.5 border ${
                audioEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-booth-850 border-booth-700 text-slate-400'
              }`}
              title={audioEnabled ? 'Mute voice-over' : 'Unmute voice-over'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-booth-850 hover:bg-red-600/80 border border-booth-700 text-slate-200 hover:text-white"
              title="Exit Live Tour (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white leading-snug">{currentStep.title}</h3>
          <p className="text-xs text-slate-200 leading-relaxed">{currentStep.description}</p>
          {currentStep.tip && (
            <div className="mt-1.5 px-2.5 py-1 bg-booth-950 border border-booth-700 text-[10px] font-mono text-amber-300">
              {currentStep.tip}
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1 pt-0.5">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIdx(idx)}
              className={`h-1.5 transition-all ${
                idx === stepIdx
                  ? 'flex-[2] bg-amber-400'
                  : idx < stepIdx
                  ? 'flex-1 bg-emerald-500/70'
                  : 'flex-1 bg-booth-700 hover:bg-booth-500'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Controls Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-booth-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-amber-300 font-bold text-[11px] flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {onOpenWrittenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWrittenGuide();
                }}
                className="px-2 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-slate-300 font-bold text-[11px] flex items-center gap-1"
                title="Open written Help manual"
              >
                <BookOpen className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
              className="px-2.5 py-1.5 bg-booth-850 hover:bg-booth-800 border border-booth-700 text-white font-bold text-[11px] flex items-center gap-0.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {stepIdx + 1 < steps.length ? (
              <button
                type="button"
                onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-0.5 shadow"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px]"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
